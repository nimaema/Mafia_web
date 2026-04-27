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
    subject: "لینک امن بازیابی رمز عبور مافیا",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; padding: 0; background: #eef2f3; color: #18181b; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          .shell { padding: 28px 14px; }
          .container { max-width: 560px; margin: 0 auto; overflow: hidden; border-radius: 24px; background: #ffffff; border: 1px solid #e4e4e7; box-shadow: 0 20px 60px rgba(24, 24, 27, 0.12); }
          .hero { padding: 30px 28px; background: linear-gradient(135deg, #18181b 0%, #27272a 44%, #3f6212 100%); color: #ffffff; }
          .brand { display: inline-block; margin-bottom: 18px; padding: 8px 12px; border-radius: 999px; background: rgba(132, 204, 22, 0.16); color: #bef264; font-size: 12px; font-weight: 800; letter-spacing: 0; }
          h1 { margin: 0; font-size: 26px; line-height: 1.6; font-weight: 900; }
          .hero p { margin: 10px 0 0; color: #d4d4d8; font-size: 14px; line-height: 1.9; }
          .content { padding: 28px; }
          p { margin: 0 0 16px; line-height: 1.9; }
          .action { margin: 26px 0; text-align: center; }
          .btn { display: inline-block; min-width: 210px; padding: 15px 26px; border-radius: 16px; background: #84cc16; color: #18181b !important; text-decoration: none; font-weight: 900; box-shadow: 0 14px 28px rgba(132, 204, 22, 0.28); }
          .grid { display: table; width: 100%; border-spacing: 0 10px; margin: 18px 0 4px; }
          .item { display: table-row; }
          .item span { display: table-cell; padding: 12px; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; font-size: 12px; }
          .item span:first-child { border-right: 1px solid #e4e4e7; border-radius: 14px 0 0 14px; color: #71717a; font-weight: 700; }
          .item span:last-child { border-left: 1px solid #e4e4e7; border-radius: 0 14px 14px 0; color: #18181b; font-weight: 900; text-align: left; direction: ltr; }
          .link-box { margin-top: 18px; padding: 14px; border-radius: 14px; background: #f4f4f5; border: 1px solid #e4e4e7; }
          .link-label { margin: 0 0 8px; color: #71717a; font-size: 12px; font-weight: 800; }
          .link { margin: 0; word-break: break-all; color: #2563eb; direction: ltr; text-align: left; font-size: 12px; line-height: 1.7; }
          .notice { margin-top: 22px; padding: 16px; border-radius: 16px; background: #fefce8; border: 1px solid #fde68a; color: #854d0e; font-size: 13px; line-height: 1.9; }
          .footer { padding: 18px 28px 26px; color: #71717a; font-size: 12px; line-height: 1.8; text-align: center; }
          @media (max-width: 520px) {
            .shell { padding: 14px 8px; }
            .hero, .content, .footer { padding-left: 18px; padding-right: 18px; }
            h1 { font-size: 22px; }
            .btn { display: block; min-width: 0; }
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="container">
            <div class="hero">
              <div class="brand">Mafia Board</div>
              <h1>بازیابی امن رمز عبور</h1>
              <p>برای حساب شما درخواست ساخت رمز جدید ثبت شده است. با دکمه زیر وارد صفحه امن تغییر رمز شوید.</p>
            </div>

            <div class="content">
              <p>سلام،</p>
              <p>این ایمیل فقط برای تایید درخواست بازیابی رمز ارسال شده است. اگر درخواست از طرف شما بوده، روی دکمه زیر بزنید.</p>

              <div class="action">
                <a href="${resetUrl}" class="btn">تنظیم رمز جدید</a>
              </div>

              <div class="grid">
                <div class="item">
                  <span>اعتبار لینک</span>
                  <span>۱ ساعت</span>
                </div>
                <div class="item">
                  <span>نوع عملیات</span>
                  <span>Password reset</span>
                </div>
              </div>

              <div class="notice">
                اگر شما این درخواست را ثبت نکرده‌اید، نیازی به انجام کاری نیست. این لینک بعد از پایان اعتبار قابل استفاده نخواهد بود.
              </div>

              <div class="link-box">
                <p class="link-label">اگر دکمه باز نشد، این لینک را در مرورگر وارد کنید:</p>
                <p class="link">${resetUrl}</p>
              </div>
            </div>

            <div class="footer">
              این پیام خودکار از طرف وب‌سایت مافیا ارسال شده است.
            </div>
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
