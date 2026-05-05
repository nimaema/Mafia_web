import nodemailer from "nodemailer";

const MAIL_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Mail delivery timed out after ${milliseconds}ms`));
    }, milliseconds);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function getMailConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const secureValue = process.env.SMTP_SECURE ?? process.env.EMAIL_SERVER_SECURE;
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user || "no-reply@localhost";
  const resendApiKey =
    process.env.RESEND_API_KEY || (host === "smtp.resend.com" && pass?.startsWith("re_") ? pass : "");

  return {
    host,
    port,
    secure: secureValue ? secureValue === "true" : port === 465,
    user,
    pass,
    from,
    resendApiKey,
  };
}

function getTransporter(config = getMailConfig()) {
  if (!config.host) {
    return null;
  }

  const host = config.host.toLowerCase();
  const isLocalDevRelay = ["localhost", "127.0.0.1", "::1"].includes(host) && config.port === 1025;
  if (process.env.NODE_ENV === "production" && isLocalDevRelay) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
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

function buildResetMessage(email: string, resetUrl: string, from: string) {
  return {
    from,
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
          <div class="logo">مافیا</div>
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
  };
}

async function sendWithResendApi(
  message: ReturnType<typeof buildResetMessage>,
  apiKey: string,
  resetUrl: string
) {
  const response = await withTimeout(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "MafiaApp/1.0",
      },
      body: JSON.stringify(message),
    }),
    MAIL_TIMEOUT_MS
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API returned ${response.status}: ${body}`);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
  const config = getMailConfig();
  const message = buildResetMessage(email, resetUrl, config.from);

  if (config.resendApiKey) {
    await sendWithResendApi(message, config.resendApiKey, resetUrl);
    return;
  }

  const transporter = getTransporter(config);

  if (!transporter) {
    console.info("[PASSWORD_RESET_PREVIEW]", { email, resetUrl, reason: "mail transport is not configured" });
    throw new Error("mail transport is not configured");
  }

  await withTimeout(transporter.sendMail(message), MAIL_TIMEOUT_MS);
}
