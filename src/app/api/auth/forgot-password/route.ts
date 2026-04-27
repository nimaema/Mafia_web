import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
});

function getBaseUrl(request: Request) {
  const envBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  const requestBaseUrl = forwardedHost
    ? `${forwardedProto || requestUrl.protocol.replace(":", "")}://${forwardedHost}`
    : requestUrl.origin;

  if (process.env.NODE_ENV !== "production" && /localhost|127\.0\.0\.1/.test(requestBaseUrl)) {
    return requestBaseUrl;
  }

  return envBaseUrl || requestBaseUrl;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!user || !user.password_hash) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate existing tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const mailResult = await sendPasswordResetEmail(email, token, getBaseUrl(request));

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" && mailResult.previewUrl
        ? { previewUrl: mailResult.previewUrl }
        : {}),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "اطلاعات وارد شده معتبر نیست" },
        { status: 400 }
      );
    }

    const errorCode =
      typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";

    if (errorCode === "P1001" || errorCode === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "اتصال پایگاه داده برقرار نیست. ابتدا سرویس دیتابیس را اجرا کنید." },
        { status: 503 }
      );
    }

    console.error("[FORGOT_PASSWORD]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
