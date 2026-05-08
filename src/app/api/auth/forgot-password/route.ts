import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getTrustedBaseUrlFromRequest } from "@/lib/site";

const PASSWORD_RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const record = error as { code?: unknown; cause?: unknown };
  return String(record.code || getErrorCode(record.cause));
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

    // Create new token (expires in 24 hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const mailResult = await sendPasswordResetEmail(email, token, getTrustedBaseUrlFromRequest(request));

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
