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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildResetMessage(email: string, resetUrl: string, from: string) {
  const safeEmail = escapeHtml(email);
  return {
    from,
    to: email,
    subject: "بازیابی رمز عبور مافیا بورد",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; padding: 0; background: #e9eef0; color: #18181b; direction: rtl; font-family: Vazirmatn, IRANSans, Tahoma, Arial, sans-serif; }
          .preheader { display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; }
          .shell { padding: 34px 12px; }
          .container { max-width: 620px; margin: 0 auto; overflow: hidden; border-radius: 30px; background: #ffffff; border: 1px solid #dfe4e8; box-shadow: 0 28px 90px rgba(9, 9, 11, 0.18); }
          .hero { padding: 34px 32px 30px; background: #111113; background-image: linear-gradient(135deg, #111113 0%, #18181b 46%, #1f3d14 100%); color: #ffffff; }
          .brand-row { display: table; width: 100%; }
          .brand { display: table-cell; vertical-align: middle; }
          .mark { display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 16px; background: #84cc16; color: #18181b; text-align: center; font-size: 23px; font-weight: 950; }
          .brand-text { display: inline-block; margin-right: 12px; vertical-align: middle; }
          .brand-title { display: block; color: #ffffff; font-size: 16px; font-weight: 950; line-height: 1.6; }
          .brand-subtitle { display: block; color: #bef264; font-size: 12px; font-weight: 900; }
          .pill { display: table-cell; width: 1%; white-space: nowrap; vertical-align: middle; padding: 8px 12px; border-radius: 999px; background: rgba(132, 204, 22, 0.14); color: #d9f99d; font-size: 12px; font-weight: 950; }
          h1 { margin: 28px 0 0; max-width: 500px; font-size: 34px; line-height: 1.45; font-weight: 950; letter-spacing: 0; }
          .hero-copy { margin: 13px 0 0; max-width: 500px; color: #e4e4e7; font-size: 15px; line-height: 2; font-weight: 750; }
          .content { padding: 30px 32px 32px; }
          .hello { margin: 0 0 8px; font-size: 21px; line-height: 1.7; font-weight: 950; color: #18181b; }
          .body-copy { margin: 0; color: #3f3f46; font-size: 15px; line-height: 2.05; font-weight: 700; }
          .action { margin: 28px 0; text-align: center; }
          .btn { display: inline-block; min-width: 244px; padding: 17px 30px; border-radius: 18px; background: #84cc16; color: #18181b !important; text-decoration: none; font-size: 16px; font-weight: 950; box-shadow: 0 18px 38px rgba(132, 204, 22, 0.34); }
          .summary { display: table; width: 100%; border-spacing: 0 12px; margin: 6px 0 2px; }
          .summary-row { display: table-row; }
          .summary-cell { display: table-cell; padding: 14px 15px; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; font-size: 13px; background: #fafafa; }
          .summary-cell:first-child { border-right: 1px solid #e4e4e7; border-radius: 16px 0 0 16px; color: #71717a; font-weight: 900; }
          .summary-cell:last-child { border-left: 1px solid #e4e4e7; border-radius: 0 16px 16px 0; color: #18181b; font-weight: 950; text-align: left; direction: ltr; }
          .notice { margin-top: 20px; padding: 16px; border-radius: 18px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; font-size: 13px; line-height: 2; font-weight: 850; }
          .link-box { margin-top: 18px; padding: 16px; border-radius: 18px; background: #f4f4f5; border: 1px solid #e4e4e7; }
          .link-label { margin: 0 0 8px; color: #71717a; font-size: 12px; font-weight: 900; }
          .link { margin: 0; word-break: break-all; color: #2563eb; direction: ltr; text-align: left; font-size: 12px; line-height: 1.8; font-weight: 700; }
          .footer { padding: 18px 32px 28px; color: #71717a; font-size: 12px; line-height: 1.8; text-align: center; font-weight: 750; }
          @media (max-width: 520px) {
            .shell { padding: 14px 8px; }
            .hero, .content, .footer { padding-left: 18px; padding-right: 18px; }
            h1 { font-size: 25px; }
            .hero-copy { font-size: 14px; }
            .pill { display: inline-block; margin-top: 14px; }
            .btn { display: block; min-width: 0; }
          }
        </style>
      </head>
      <body>
        <div class="preheader">لینک امن تنظیم رمز جدید حساب مافیا تا ۲۴ ساعت معتبر است.</div>
        <div class="shell">
          <div class="container">
            <div class="hero">
              <div class="brand-row">
                <div class="brand">
                  <span class="mark">M</span>
                  <span class="brand-text">
                    <span class="brand-title">مافیا بورد</span>
                    <span class="brand-subtitle">بازیابی امن حساب</span>
                  </span>
                </div>
                <div class="pill">اعتبار ۲۴ ساعت</div>
              </div>
              <h1>رمز عبور تازه، با یک لینک امن</h1>
              <p class="hero-copy">برای حساب ${safeEmail} درخواست تنظیم رمز جدید ثبت شده است. اگر این درخواست از طرف شما بوده، از دکمه زیر ادامه دهید.</p>
            </div>

            <div class="content">
              <p class="hello">سلام،</p>
              <p class="body-copy">این لینک فقط برای همین درخواست ساخته شده و بعد از استفاده حذف می‌شود. اگر شما درخواست نداده‌اید، بدون هیچ اقدامی این ایمیل را نادیده بگیرید.</p>

              <div class="action">
                <a href="${resetUrl}" class="btn">تنظیم رمز جدید</a>
              </div>

              <div class="summary">
                <div class="summary-row">
                  <span class="summary-cell">اعتبار لینک</span>
                  <span class="summary-cell">۲۴ ساعت</span>
                </div>
                <div class="summary-row">
                  <span class="summary-cell">حساب</span>
                  <span class="summary-cell">${safeEmail}</span>
                </div>
              </div>

              <div class="notice">
                این لینک را با کسی به اشتراک نگذارید. تیم مافیا بورد هرگز رمز عبور یا کد خصوصی شما را درخواست نمی‌کند.
              </div>

              <div class="link-box">
                <p class="link-label">اگر دکمه باز نشد، این لینک را در مرورگر وارد کنید:</p>
                <p class="link">${resetUrl}</p>
              </div>
            </div>

            <div class="footer">
              این پیام خودکار از طرف مافیا بورد ارسال شده است.
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `برای بازیابی رمز عبور حساب ${email} به این لینک مراجعه کنید: ${resetUrl}\n\nاین لینک تا ۲۴ ساعت معتبر است و بعد از استفاده حذف می‌شود.`,
  };
}

function buildVerificationMessage(email: string, verifyUrl: string, from: string) {
  const safeEmail = escapeHtml(email);
  return {
    from,
    to: email,
    subject: "تایید ایمیل و فعال‌سازی حساب مافیا بورد",
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; background: #eef2f3; color: #18181b; direction: rtl; font-family: Vazirmatn, IRANSans, Tahoma, Arial, sans-serif; }
          .preheader { display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; }
          .shell { padding: 34px 12px; }
          .card { max-width: 620px; margin: 0 auto; overflow: hidden; border-radius: 30px; background: #ffffff; border: 1px solid #dfe4e8; box-shadow: 0 28px 90px rgba(9, 9, 11, 0.17); }
          .hero { padding: 34px 32px 30px; background: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #18181b 52%, #164e63 100%); color: white; }
          .brand-row { display: table; width: 100%; }
          .brand { display: table-cell; vertical-align: middle; }
          .mark { display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 16px; background: #84cc16; color: #18181b; text-align: center; font-size: 23px; font-weight: 950; }
          .brand-text { display: inline-block; margin-right: 12px; vertical-align: middle; }
          .brand-title { display: block; color: #ffffff; font-size: 16px; font-weight: 950; line-height: 1.6; }
          .brand-subtitle { display: block; color: #bae6fd; font-size: 12px; font-weight: 900; }
          .pill { display: table-cell; width: 1%; white-space: nowrap; vertical-align: middle; padding: 8px 12px; border-radius: 999px; background: rgba(14, 165, 233, 0.16); color: #bae6fd; font-size: 12px; font-weight: 950; }
          h1 { margin: 28px 0 0; font-size: 34px; line-height: 1.45; font-weight: 950; }
          .hero-copy { margin: 13px 0 0; color: #e4e4e7; font-size: 15px; line-height: 2; font-weight: 750; }
          .body { padding: 30px 32px 32px; }
          .copy { margin: 0; color: #3f3f46; font-size: 15px; line-height: 2.05; font-weight: 700; }
          .action { margin: 28px 0; text-align: center; }
          .btn { display: inline-block; min-width: 236px; border-radius: 18px; background: #84cc16; color: #18181b !important; padding: 17px 28px; font-size: 16px; font-weight: 950; text-decoration: none; box-shadow: 0 18px 38px rgba(132, 204, 22, 0.34); }
          .steps { display: table; width: 100%; border-spacing: 0 10px; margin-top: 18px; }
          .step { display: table-row; }
          .step span { display: table-cell; padding: 13px 14px; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; background: #fafafa; font-size: 13px; }
          .step span:first-child { width: 1%; white-space: nowrap; border-right: 1px solid #e4e4e7; border-radius: 16px 0 0 16px; color: #0ea5e9; font-weight: 950; }
          .step span:last-child { border-left: 1px solid #e4e4e7; border-radius: 0 16px 16px 0; color: #3f3f46; font-weight: 800; }
          .note { margin-top: 20px; border-radius: 18px; border: 1px solid #bae6fd; background: #f0f9ff; padding: 15px; color: #075985; font-size: 13px; line-height: 2; font-weight: 850; }
          .link-box { margin-top: 18px; border-radius: 18px; border: 1px solid #e4e4e7; background: #f4f4f5; padding: 14px; }
          .link-label { margin: 0 0 8px; color: #71717a; font-size: 12px; font-weight: 900; }
          .link { margin: 0; color: #2563eb; direction: ltr; text-align: left; word-break: break-all; font-size: 12px; line-height: 1.8; font-weight: 700; }
          .footer { padding: 18px 32px 28px; color: #71717a; text-align: center; font-size: 12px; line-height: 1.8; font-weight: 750; }
          @media (max-width: 520px) { .shell { padding: 14px 8px; } .hero, .body, .footer { padding-left: 18px; padding-right: 18px; } h1 { font-size: 25px; } .hero-copy { font-size: 14px; } .pill { display: inline-block; margin-top: 14px; } .btn { display: block; min-width: 0; } }
        </style>
      </head>
      <body>
        <div class="preheader">حساب مافیا بورد خود را با یک لینک ۲۴ ساعته فعال کنید.</div>
        <div class="shell">
          <div class="card">
            <div class="hero">
              <div class="brand-row">
                <div class="brand">
                  <span class="mark">M</span>
                  <span class="brand-text">
                    <span class="brand-title">مافیا بورد</span>
                    <span class="brand-subtitle">فعال‌سازی حساب</span>
                  </span>
                </div>
                <div class="pill">اعتبار ۲۴ ساعت</div>
              </div>
              <h1>ایمیل‌تان را تایید کنید و وارد بازی شوید</h1>
              <p class="hero-copy">برای فعال‌سازی حساب ${safeEmail} فقط کافی است دکمه تایید را بزنید.</p>
            </div>
            <div class="body">
              <p class="copy">بعد از تایید ایمیل، داشبورد، لابی‌ها و تاریخچه بازی برای حساب شما فعال می‌شود. این مرحله کمک می‌کند فقط کاربران واقعی وارد بازی‌ها شوند.</p>
              <div class="action"><a class="btn" href="${verifyUrl}">تایید ایمیل</a></div>
              <div class="steps">
                <div class="step"><span>۱</span><span>ایمیل را تایید کنید.</span></div>
                <div class="step"><span>۲</span><span>وارد حساب شوید و به لابی‌ها دسترسی بگیرید.</span></div>
                <div class="step"><span>۳</span><span>اگر لینک کار نکرد، از صفحه تایید ایمیل دوباره درخواست ارسال کنید.</span></div>
              </div>
              <div class="note">اگر شما این حساب را نساخته‌اید، این ایمیل را نادیده بگیرید. لینک بعد از ۲۴ ساعت قابل استفاده نخواهد بود.</div>
              <div class="link-box">
                <p class="link-label">اگر دکمه باز نشد، این لینک را در مرورگر وارد کنید:</p>
                <p class="link">${verifyUrl}</p>
              </div>
            </div>
            <div class="footer">این پیام خودکار از طرف مافیا بورد ارسال شده است.</div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `برای تایید ایمیل حساب ${email} به این لینک بروید: ${verifyUrl}\n\nاین لینک تا ۲۴ ساعت معتبر است.`,
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
