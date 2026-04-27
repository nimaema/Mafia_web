import nodemailer from "nodemailer";

type PasswordResetEmailResult = {
  delivered: boolean;
  previewUrl?: string;
  reason?: string;
};

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
  const resendApiKey = process.env.RESEND_API_KEY || (host === "smtp.resend.com" && pass?.startsWith("re_") ? pass : "");

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

function buildResetUrl(baseUrl: string, token: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/auth/reset-password?token=${token}`;
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
}

async function sendWithResendApi(
  message: ReturnType<typeof buildResetMessage>,
  apiKey: string,
  resetUrl: string
): Promise<PasswordResetEmailResult> {
  try {
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

    if (response.ok) {
      return { delivered: true };
    }

    const body = await response.text();
    console.warn("[PASSWORD_RESET_RESEND_FAILED]", {
      status: response.status,
      body,
      resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
    return { delivered: false, reason: `Resend API returned ${response.status}` };
  } catch (error) {
    console.warn("[PASSWORD_RESET_RESEND_FAILED]", {
      error,
      resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
    return { delivered: false, reason: "Resend API request failed" };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<PasswordResetEmailResult> {
  const config = getMailConfig();
  const resetUrl = buildResetUrl(baseUrl, token);
  const message = buildResetMessage(email, resetUrl, config.from);

  if (config.resendApiKey) {
    return sendWithResendApi(message, config.resendApiKey, resetUrl);
  }

  const transporter = getTransporter(config);

  if (!transporter) {
    console.info("[PASSWORD_RESET_PREVIEW]", { email, resetUrl, reason: "mail transport is not configured" });
    return { delivered: false, previewUrl: resetUrl, reason: "mail transport is not configured" };
  }

  try {
    await withTimeout(transporter.sendMail(message), MAIL_TIMEOUT_MS);
    return { delivered: true };
  } catch (error) {
    console.warn("[PASSWORD_RESET_EMAIL_FAILED]", {
      email,
      resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      error,
    });
    return {
      delivered: false,
      ...(process.env.NODE_ENV !== "production" ? { previewUrl: resetUrl } : {}),
      reason: "mail delivery failed",
    };
  }
}
