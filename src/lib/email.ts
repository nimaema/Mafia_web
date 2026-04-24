import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "بازیابی رمز عبور - مافیا",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Tahoma, Arial, sans-serif; background: #0c0e09; color: #e0e4d2; direction: rtl; }
          .container { max-width: 480px; margin: 40px auto; background: #1d2116; border-radius: 16px; padding: 32px; }
          .logo { font-size: 28px; font-weight: bold; color: #a3e635; margin-bottom: 24px; text-align: center; }
          p { line-height: 1.8; margin-bottom: 16px; }
          .btn { display: inline-block; padding: 12px 28px; background: #a3e635; color: #0c0e09; border-radius: 12px; text-decoration: none; font-weight: bold; }
          .notice { font-size: 13px; color: #8c947c; margin-top: 24px; border-top: 1px solid #424936; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎭 مافیا</div>
          <p>سلام،</p>
          <p>درخواست بازیابی رمز عبور برای حساب شما دریافت شد. برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
          <p style="text-align:center">
            <a href="${resetUrl}" class="btn">تنظیم رمز عبور جدید</a>
          </p>
          <div class="notice">
            <p>این لینک تا ۱ ساعت دیگر معتبر است.</p>
            <p>اگر این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `برای بازیابی رمز عبور خود، به این لینک مراجعه کنید: ${resetUrl}\n\nاین لینک تا ۱ ساعت دیگر معتبر است.`,
  });
}
