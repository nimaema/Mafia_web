import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const record = error as { code?: unknown; cause?: unknown };
  return String(record.code || getErrorCode(record.cause));
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "ایمیل معتبر وارد کنید" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!user) {
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

    if (!mailResult.delivered && process.env.NODE_ENV === "production") {
      await prisma.passwordResetToken.deleteMany({ where: { token } });
      console.error("[FORGOT_PASSWORD_EMAIL]", {
        email,
        reason: mailResult.reason || "mail delivery failed",
      });
      return NextResponse.json(
        { error: "سرویس ارسال ایمیل بازیابی رمز تنظیم نیست یا در دسترس نیست. تنظیمات SMTP سرور را بررسی کنید." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" && mailResult.previewUrl
        ? { previewUrl: mailResult.previewUrl }
        : {}),
    });
  } catch (err) {
    const errorCode = getErrorCode(err);

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
