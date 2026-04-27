import nodemailer from "nodemailer";

type PasswordResetEmailResult = {
  delivered: boolean;
  previewUrl?: string;
};

function getMailConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const secureValue = process.env.SMTP_SECURE ?? process.env.EMAIL_SERVER_SECURE;
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user || "no-reply@localhost";

  return {
    host,
    port,
    secure: secureValue ? secureValue === "true" : port === 465,
    user,
    pass,
    from,
  };
}

function buildResetUrl(baseUrl: string, token: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/auth/reset-password?token=${token}`;
}

function getTransporter() {
  const config = getMailConfig();

  if (!config.host) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user || config.pass
      ? {
          auth: {
            user: config.user,
            pass: config.pass,
          },
        }
      : {}),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<PasswordResetEmailResult> {
  const config = getMailConfig();
  const resetUrl = buildResetUrl(baseUrl, token);
  const transporter = getTransporter();

  if (!transporter) {
    console.info("[PASSWORD_RESET_PREVIEW]", { email, resetUrl, reason: "mail transport is not configured" });
    return { delivered: false, previewUrl: resetUrl };
  }

  const message = {
    from: config.from,
    to: email,
    subject: "بازیابی رمز عبور - مافیا",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Tahoma, Arial, sans-serif; background: #f4f4f5; color: #18181b; direction: rtl; margin: 0; padding: 24px; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; }
          .logo { font-size: 28px; font-weight: bold; color: #65a30d; margin-bottom: 24px; text-align: center; }
          p { line-height: 1.9; margin-bottom: 16px; }
          .btn { display: inline-block; padding: 12px 28px; background: #84cc16; color: #18181b; border-radius: 12px; text-decoration: none; font-weight: bold; }
          .notice { font-size: 13px; color: #71717a; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 16px; }
          .link { font-size: 12px; word-break: break-all; color: #2563eb; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">مافیا بورد</div>
          <p>سلام،</p>
          <p>برای حساب شما درخواست بازیابی رمز عبور ثبت شده است. برای ساخت رمز جدید روی دکمه زیر بزنید:</p>
          <p style="text-align:center">
            <a href="${resetUrl}" class="btn">تنظیم رمز عبور جدید</a>
          </p>
          <p class="link">${resetUrl}</p>
          <div class="notice">
            <p>این لینک تا ۱ ساعت معتبر است.</p>
            <p>اگر این درخواست را شما ثبت نکرده‌اید، این پیام را نادیده بگیرید.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `برای بازیابی رمز عبور خود، به این لینک مراجعه کنید: ${resetUrl}\n\nاین لینک تا ۱ ساعت دیگر معتبر است.`,
  };

  try {
    await transporter.sendMail(message);
    return { delivered: true };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[PASSWORD_RESET_PREVIEW]", {
        email,
        resetUrl,
        reason: "mail delivery failed in non-production",
        error,
      });
      return { delivered: false, previewUrl: resetUrl };
    }

    throw error;
  }
}
