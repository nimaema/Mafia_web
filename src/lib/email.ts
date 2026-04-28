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

function buildVerifyUrl(baseUrl: string, token: string, email: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
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
          body { margin: 0; padding: 0; background: #eef2f3; color: #18181b; direction: rtl; font-family: Vazirmatn, IRANSans, Tahoma, Arial, sans-serif; }
          .preheader { display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; }
          .shell { padding: 34px 14px; }
          .container { max-width: 584px; margin: 0 auto; overflow: hidden; border-radius: 28px; background: #ffffff; border: 1px solid #e4e4e7; box-shadow: 0 24px 70px rgba(24, 24, 27, 0.15); }
          .topbar { height: 6px; background: linear-gradient(90deg, #84cc16, #0ea5e9, #f59e0b); }
          .hero { padding: 36px 32px 34px; background: linear-gradient(135deg, #111113 0%, #27272a 48%, #365314 100%); color: #ffffff; }
          .brand { display: inline-block; margin-bottom: 22px; padding: 9px 13px; border-radius: 999px; background: rgba(132, 204, 22, 0.16); color: #d9f99d; font-size: 12px; line-height: 1; font-weight: 900; }
          h1 { margin: 0; max-width: 420px; font-size: 34px; line-height: 1.45; font-weight: 950; }
          .hero p { margin: 14px 0 0; max-width: 440px; color: #e4e4e7; font-size: 16px; line-height: 2; font-weight: 700; }
          .content { padding: 32px; }
          .hello { margin: 0 0 10px; font-size: 20px; line-height: 1.7; font-weight: 950; color: #18181b; }
          .body-copy { margin: 0 0 18px; color: #3f3f46; font-size: 15px; line-height: 2.05; font-weight: 700; }
          .action { margin: 30px 0; text-align: center; }
          .btn { display: inline-block; min-width: 238px; padding: 17px 30px; border-radius: 18px; background: #84cc16; color: #18181b !important; text-decoration: none; font-size: 16px; font-weight: 950; box-shadow: 0 16px 34px rgba(132, 204, 22, 0.34); }
          .grid { display: table; width: 100%; border-spacing: 0 12px; margin: 20px 0 4px; }
          .item { display: table-row; }
          .item span { display: table-cell; padding: 14px 15px; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
          .item span:first-child { border-right: 1px solid #e4e4e7; border-radius: 16px 0 0 16px; color: #71717a; font-weight: 900; }
          .item span:last-child { border-left: 1px solid #e4e4e7; border-radius: 0 16px 16px 0; color: #18181b; font-weight: 950; text-align: left; direction: ltr; }
          .link-box { margin-top: 20px; padding: 16px; border-radius: 18px; background: #f4f4f5; border: 1px solid #e4e4e7; }
          .link-label { margin: 0 0 9px; color: #71717a; font-size: 12px; font-weight: 900; }
          .link { margin: 0; word-break: break-all; color: #2563eb; direction: ltr; text-align: left; font-size: 12px; line-height: 1.8; font-weight: 700; }
          .notice { margin-top: 24px; padding: 17px; border-radius: 18px; background: #fefce8; border: 1px solid #fde68a; color: #854d0e; font-size: 14px; line-height: 2; font-weight: 800; }
          .footer { padding: 18px 32px 28px; color: #71717a; font-size: 12px; line-height: 1.8; text-align: center; font-weight: 700; }
          @media (max-width: 520px) {
            .shell { padding: 14px 8px; }
            .hero, .content, .footer { padding-left: 18px; padding-right: 18px; }
            h1 { font-size: 26px; }
            .hero p { font-size: 14px; }
            .btn { display: block; min-width: 0; }
          }
        </style>
      </head>
      <body>
        <div class="preheader">لینک امن تنظیم رمز جدید حساب مافیا تا ۱ ساعت معتبر است.</div>
        <div class="shell">
          <div class="container">
            <div class="topbar"></div>
            <div class="hero">
              <div class="brand">Mafia Board</div>
              <h1>بازیابی امن رمز عبور</h1>
              <p>برای حساب شما درخواست ساخت رمز جدید ثبت شده است. با دکمه زیر وارد صفحه امن تغییر رمز شوید.</p>
            </div>

            <div class="content">
              <p class="hello">سلام،</p>
              <p class="body-copy">این ایمیل فقط برای تایید درخواست بازیابی رمز ارسال شده است. اگر درخواست از طرف شما بوده، روی دکمه زیر بزنید.</p>

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

function buildVerificationMessage(email: string, verifyUrl: string, from: string) {
  return {
    from,
    to: email,
    subject: "تایید ایمیل حساب مافیا بورد",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; background: #f4f4f5; color: #18181b; direction: rtl; font-family: Vazirmatn, Tahoma, Arial, sans-serif; }
          .shell { padding: 32px 12px; }
          .card { max-width: 560px; margin: 0 auto; overflow: hidden; border-radius: 28px; background: #ffffff; border: 1px solid #e4e4e7; box-shadow: 0 24px 70px rgba(24,24,27,.14); }
          .hero { padding: 34px 30px; background: linear-gradient(135deg, #0f172a, #18181b 56%, #365314); color: white; }
          .badge { display: inline-block; border-radius: 999px; background: rgba(132,204,22,.16); color: #d9f99d; padding: 9px 13px; font-size: 12px; font-weight: 900; }
          h1 { margin: 18px 0 0; font-size: 32px; line-height: 1.45; font-weight: 950; }
          .hero p { margin: 12px 0 0; color: #e4e4e7; line-height: 2; font-weight: 700; }
          .body { padding: 30px; }
          .copy { margin: 0; color: #3f3f46; font-size: 15px; line-height: 2; font-weight: 700; }
          .action { margin: 28px 0; text-align: center; }
          .btn { display: inline-block; min-width: 220px; border-radius: 18px; background: #84cc16; color: #18181b !important; padding: 16px 26px; font-weight: 950; text-decoration: none; box-shadow: 0 16px 34px rgba(132,204,22,.34); }
          .note { border-radius: 18px; border: 1px solid #bae6fd; background: #f0f9ff; padding: 15px; color: #075985; font-size: 13px; line-height: 2; font-weight: 800; }
          .link { margin-top: 18px; border-radius: 18px; border: 1px solid #e4e4e7; background: #f4f4f5; padding: 14px; color: #2563eb; direction: ltr; text-align: left; word-break: break-all; font-size: 12px; line-height: 1.8; }
          .footer { padding: 0 30px 28px; color: #71717a; text-align: center; font-size: 12px; font-weight: 700; }
          @media (max-width: 520px) { .shell { padding: 12px 8px; } .hero, .body, .footer { padding-left: 18px; padding-right: 18px; } h1 { font-size: 25px; } .btn { display: block; min-width: 0; } }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="card">
            <div class="hero">
              <span class="badge">Mafia Board</span>
              <h1>ایمیل‌تان را تایید کنید</h1>
              <p>فقط یک قدم مانده تا لابی‌ها، تاریخچه بازی و داشبورد کامل برای شما فعال شود.</p>
            </div>
            <div class="body">
              <p class="copy">برای فعال‌سازی حساب ${email} روی دکمه زیر بزنید. این لینک تا ۲۴ ساعت معتبر است.</p>
              <div class="action"><a class="btn" href="${verifyUrl}">تایید ایمیل</a></div>
              <div class="note">اگر شما این حساب را نساخته‌اید، این ایمیل را نادیده بگیرید.</div>
              <div class="link">${verifyUrl}</div>
            </div>
            <div class="footer">این پیام خودکار از طرف مافیا بورد ارسال شده است.</div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `برای تایید ایمیل حساب خود به این لینک بروید: ${verifyUrl}`,
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

export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<PasswordResetEmailResult> {
  const config = getMailConfig();
  const verifyUrl = buildVerifyUrl(baseUrl, token, email);
  const message = buildVerificationMessage(email, verifyUrl, config.from);

  if (config.resendApiKey) {
    return sendWithResendApi(message, config.resendApiKey, verifyUrl);
  }

  const transporter = getTransporter(config);

  if (!transporter) {
    console.info("[VERIFY_EMAIL_PREVIEW]", { email, verifyUrl, reason: "mail transport is not configured" });
    return { delivered: false, previewUrl: verifyUrl, reason: "mail transport is not configured" };
  }

  try {
    await withTimeout(transporter.sendMail(message), MAIL_TIMEOUT_MS);
    return { delivered: true };
  } catch (error) {
    console.warn("[VERIFY_EMAIL_FAILED]", { email, error });
    return { delivered: false, reason: "mail delivery failed" };
  }
}
