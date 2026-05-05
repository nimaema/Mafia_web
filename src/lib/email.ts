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

type EmailDetailRow = {
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
};

type AuthEmailTheme = {
  heroBackground: string;
  heroGradient: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  badgeText: string;
  noteBackground: string;
  noteBorder: string;
  noteText: string;
};

type AuthEmailHtmlOptions = {
  theme: AuthEmailTheme;
  preheader: string;
  eyebrow: string;
  badge: string;
  title: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  details: EmailDetailRow[];
  notice: string;
  steps?: string[];
};

const EMAIL_FONT_FAMILY = "Tahoma, Arial, sans-serif";
const EMAIL_RTL_STYLE = `font-family: ${EMAIL_FONT_FAMILY}; direction: rtl; text-align: right; unicode-bidi: embed;`;
const RTL_MARK = "\u200F";
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

const resetEmailTheme: AuthEmailTheme = {
  heroBackground: "#15171b",
  heroGradient: "linear-gradient(135deg, #15171b 0%, #1f2937 54%, #00a896 100%)",
  accent: "#00f5d4",
  accentText: "#002d27",
  accentSoft: "#ccfbf1",
  badgeText: "#99fff0",
  noteBackground: "#ecfeff",
  noteBorder: "#a5f3fc",
  noteText: "#155e75",
};

const verificationEmailTheme: AuthEmailTheme = {
  heroBackground: "#0f172a",
  heroGradient: "linear-gradient(135deg, #0f172a 0%, #172554 52%, #155e75 100%)",
  accent: "#38bdf8",
  accentText: "#082f49",
  accentSoft: "#e0f2fe",
  badgeText: "#bae6fd",
  noteBackground: "#f0f9ff",
  noteBorder: "#bae6fd",
  noteText: "#075985",
};

function renderEmailRows(rows: EmailDetailRow[]) {
  return rows
    .map((row) => {
      const valueDirection = row.dir || "rtl";
      const valueAlign = valueDirection === "ltr" ? "left" : "right";
      return `
        <tr>
          <td dir="rtl" align="right" valign="middle" style="${EMAIL_RTL_STYLE} padding: 13px 15px; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 0 16px 16px 0; background-color: #fafafa; color: #71717a; font-size: 12px; line-height: 22px; font-weight: 700; white-space: nowrap;">
            ${escapeHtml(row.label)}
          </td>
          <td dir="${valueDirection}" align="${valueAlign}" valign="middle" style="font-family: ${EMAIL_FONT_FAMILY}; direction: ${valueDirection}; text-align: ${valueAlign}; unicode-bidi: embed; padding: 13px 15px; border-top: 1px solid #e5e7eb; border-left: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 16px 0 0 16px; background-color: #fafafa; color: #18181b; font-size: 13px; line-height: 22px; font-weight: 700;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderEmailSteps(steps: string[] | undefined, theme: AuthEmailTheme) {
  if (!steps?.length) return "";

  return `
    <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 20px 0 0; border-collapse: separate; border-spacing: 0 10px;">
      ${steps
        .map(
          (step, index) => `
            <tr>
              <td dir="rtl" align="center" valign="top" width="42" style="${EMAIL_RTL_STYLE} width: 42px; padding: 0 0 0 10px;">
                <span style="display: inline-block; width: 30px; height: 30px; border-radius: 12px; background-color: ${theme.accentSoft}; color: ${theme.accentText}; font-family: ${EMAIL_FONT_FAMILY}; font-size: 13px; line-height: 30px; font-weight: 700; text-align: center;">${String(index + 1).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)])}</span>
              </td>
              <td dir="rtl" align="right" valign="top" style="${EMAIL_RTL_STYLE} padding: 5px 0 0; color: #3f3f46; font-size: 14px; line-height: 28px; font-weight: 700;">
                ${escapeHtml(step)}
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
}

function buildAuthEmailHtml(options: AuthEmailHtmlOptions) {
  const safeCtaUrl = escapeHtml(options.ctaUrl);

  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <title>${escapeHtml(options.title)}</title>
    </head>
    <body lang="fa" dir="rtl" style="margin: 0; padding: 0; background-color: #edf2f4; color: #18181b; direction: rtl; text-align: right; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div lang="fa" dir="rtl" style="display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px; direction: rtl; text-align: right;">
        ${escapeHtml(options.preheader)}
      </div>

      <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #edf2f4;">
        <tr>
          <td dir="rtl" align="center" style="padding: 28px 12px;">
            <table role="presentation" dir="rtl" width="640" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 640px; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #dde3e7; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);">
              <tr>
                <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 30px 28px 28px; border-radius: 28px 28px 0 0; background-color: ${options.theme.heroBackground}; background-image: ${options.theme.heroGradient}; color: #ffffff;">
                  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td dir="rtl" align="right" valign="middle" style="${EMAIL_RTL_STYLE}">
                        <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                          <tr>
                            <td dir="rtl" align="center" valign="middle" style="width: 48px; height: 48px; border-radius: 17px; background-color: ${options.theme.accent}; color: ${options.theme.accentText}; font-family: ${EMAIL_FONT_FAMILY}; font-size: 24px; line-height: 48px; font-weight: 700; text-align: center;">
                              M
                            </td>
                            <td dir="rtl" align="right" valign="middle" style="${EMAIL_RTL_STYLE} padding-right: 12px;">
                              <div dir="rtl" style="${EMAIL_RTL_STYLE} color: #ffffff; font-size: 17px; line-height: 24px; font-weight: 700;">مافیا بورد</div>
                              <div dir="rtl" style="${EMAIL_RTL_STYLE} color: ${options.theme.badgeText}; font-size: 12px; line-height: 20px; font-weight: 700;">${escapeHtml(options.eyebrow)}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td dir="rtl" align="left" valign="middle" style="${EMAIL_RTL_STYLE} padding-right: 12px;">
                        <span dir="rtl" style="${EMAIL_RTL_STYLE} display: inline-block; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.18); background-color: rgba(255, 255, 255, 0.10); color: ${options.theme.badgeText}; padding: 8px 12px; font-size: 12px; line-height: 18px; font-weight: 700; white-space: nowrap;">
                          ${escapeHtml(options.badge)}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <h1 dir="rtl" align="right" style="${EMAIL_RTL_STYLE} margin: 30px 0 0; color: #ffffff; font-size: 30px; line-height: 44px; font-weight: 700;">
                    ${escapeHtml(options.title)}
                  </h1>
                  <p dir="rtl" align="right" style="${EMAIL_RTL_STYLE} margin: 12px 0 0; color: #e5e7eb; font-size: 15px; line-height: 30px; font-weight: 400;">
                    ${escapeHtml(options.intro)}
                  </p>
                </td>
              </tr>

              <tr>
                <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 30px 28px 32px; background-color: #ffffff;">
                  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td dir="rtl" align="center" style="padding: 0 0 26px;">
                        <table role="presentation" dir="rtl" cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate;">
                          <tr>
                            <td dir="rtl" align="center" bgcolor="${options.theme.accent}" style="border-radius: 18px; background-color: ${options.theme.accent}; box-shadow: 0 16px 34px rgba(132, 204, 22, 0.28);">
                              <a href="${safeCtaUrl}" target="_blank" rel="noreferrer" dir="rtl" style="${EMAIL_RTL_STYLE} display: inline-block; min-width: 220px; padding: 16px 28px; border-radius: 18px; color: ${options.theme.accentText}; font-size: 16px; line-height: 24px; font-weight: 700; text-align: center; text-decoration: none;">
                                ${escapeHtml(options.ctaLabel)}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                    ${renderEmailRows(options.details)}
                  </table>

                  ${renderEmailSteps(options.steps, options.theme)}

                  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 22px; border-collapse: collapse;">
                    <tr>
                      <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 16px 17px; border: 1px solid ${options.theme.noteBorder}; border-radius: 18px; background-color: ${options.theme.noteBackground}; color: ${options.theme.noteText}; font-size: 13px; line-height: 27px; font-weight: 700;">
                        ${escapeHtml(options.notice)}
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 18px; border-collapse: collapse;">
                    <tr>
                      <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 16px 17px; border: 1px solid #e5e7eb; border-radius: 18px; background-color: #f8fafc;">
                        <p dir="rtl" align="right" style="${EMAIL_RTL_STYLE} margin: 0 0 9px; color: #71717a; font-size: 12px; line-height: 22px; font-weight: 700;">
                          اگر دکمه باز نشد، این لینک را در مرورگر وارد کنید:
                        </p>
                        <p dir="ltr" align="left" style="font-family: ${EMAIL_FONT_FAMILY}; direction: ltr; text-align: left; unicode-bidi: embed; margin: 0; color: #2563eb; font-size: 12px; line-height: 22px; font-weight: 400; word-break: break-all;">
                          ${safeCtaUrl}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td dir="rtl" align="center" style="${EMAIL_RTL_STYLE} padding: 18px 24px 26px; background-color: #ffffff; color: #71717a; font-size: 12px; line-height: 22px; font-weight: 400; text-align: center;">
                  این پیام خودکار از طرف مافیا بورد ارسال شده است.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildResetMessage(email: string, resetUrl: string, from: string) {
  return {
    from,
    to: email,
    subject: "بازیابی رمز عبور مافیا بورد",
    html: buildAuthEmailHtml({
      theme: resetEmailTheme,
      preheader: "لینک امن تنظیم رمز جدید حساب مافیا بورد تا ۲۴ ساعت معتبر است.",
      eyebrow: "بازیابی امن حساب",
      badge: "اعتبار ۲۴ ساعت",
      title: "تنظیم رمز عبور تازه",
      intro: "برای حساب شما درخواست بازیابی رمز ثبت شده است. اگر این درخواست از طرف شما بوده، با دکمه زیر رمز جدید بسازید.",
      ctaLabel: "تنظیم رمز جدید",
      ctaUrl: resetUrl,
      details: [
        { label: "حساب", value: email, dir: "ltr" },
        { label: "اعتبار لینک", value: "۲۴ ساعت" },
        { label: "وضعیت", value: "پس از استفاده حذف می‌شود" },
      ],
      notice: "این لینک را با کسی به اشتراک نگذارید. تیم مافیا بورد هرگز رمز عبور یا کد خصوصی شما را درخواست نمی‌کند.",
    }),
    text: `${RTL_MARK}برای بازیابی رمز عبور حساب ${email} به این لینک مراجعه کنید: ${resetUrl}\n\n${RTL_MARK}این لینک تا ۲۴ ساعت معتبر است و بعد از استفاده حذف می‌شود.`,
  };
}

function buildVerificationMessage(email: string, verifyUrl: string, from: string) {
  return {
    from,
    to: email,
    subject: "تایید ایمیل و فعال‌سازی حساب مافیا بورد",
    html: buildAuthEmailHtml({
      theme: verificationEmailTheme,
      preheader: "حساب مافیا بورد خود را با یک لینک ۲۴ ساعته فعال کنید.",
      eyebrow: "فعال‌سازی حساب",
      badge: "اعتبار ۲۴ ساعت",
      title: "ایمیل‌تان را تایید کنید",
      intro: "فقط یک قدم مانده تا حساب شما آماده ورود به لابی‌ها، داشبورد و تاریخچه بازی شود.",
      ctaLabel: "تایید ایمیل",
      ctaUrl: verifyUrl,
      details: [
        { label: "حساب", value: email, dir: "ltr" },
        { label: "اعتبار لینک", value: "۲۴ ساعت" },
      ],
      steps: [
        "روی دکمه تایید ایمیل بزنید.",
        "بعد از تایید، دوباره وارد حساب شوید.",
        "اگر لینک کار نکرد، از صفحه تایید ایمیل درخواست ارسال دوباره بدهید.",
      ],
      notice: "اگر شما این حساب را نساخته‌اید، این ایمیل را نادیده بگیرید. لینک بعد از ۲۴ ساعت قابل استفاده نخواهد بود.",
    }),
    text: `${RTL_MARK}برای تایید ایمیل حساب ${email} به این لینک بروید: ${verifyUrl}\n\n${RTL_MARK}این لینک تا ۲۴ ساعت معتبر است.`,
  };
}

function renderInlineEmailText(value: string) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong style=\"font-weight: 800; color: #18181b;\">$1</strong>");
}

function buildAdminEmailBodyHtml(body: string) {
  const lines = body.split(/\r?\n/);
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`
      <div dir="rtl" style="${EMAIL_RTL_STYLE} margin: 0 0 14px; border: 1px solid #e5e7eb; border-radius: 18px; background: #ffffff; padding: 16px 18px; color: #27272a; font-size: 15px; line-height: 32px; font-weight: 600;">
        ${paragraph.map(renderInlineEmailText).join("<br />")}
      </div>
    `);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`
      <div dir="rtl" style="${EMAIL_RTL_STYLE} margin: 0 0 14px; border: 1px solid #dbeafe; border-radius: 18px; background: #eff6ff; padding: 16px 18px;">
        ${listItems
          .map(
            (item) => `
              <div dir="rtl" style="${EMAIL_RTL_STYLE} color: #1e3a8a; font-size: 14px; line-height: 30px; font-weight: 700;">
                <span style="display: inline-block; width: 7px; height: 7px; margin-left: 8px; border-radius: 999px; background: #00f5d4;"></span>${renderInlineEmailText(item)}
              </div>
            `
          )
          .join("")}
      </div>
    `);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      blocks.push(`<div style="height: 1px; margin: 18px 4px; background: #e5e7eb;"></div>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(`
        <div dir="rtl" style="${EMAIL_RTL_STYLE} margin: 0 0 12px; color: #18181b; font-size: 20px; line-height: 34px; font-weight: 800;">
          ${renderInlineEmailText(line.slice(2))}
        </div>
      `);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(`
        <div dir="rtl" style="${EMAIL_RTL_STYLE} margin: 0 0 14px; border: 1px solid #99fff0; border-right: 5px solid #00f5d4; border-radius: 18px; background: #ecfeff; padding: 15px 17px; color: #155e75; font-size: 14px; line-height: 28px; font-weight: 800;">
          ${renderInlineEmailText(line.slice(2))}
        </div>
      `);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.length
    ? blocks.join("")
    : `
      <div dir="rtl" style="${EMAIL_RTL_STYLE} margin: 0; border: 1px solid #e5e7eb; border-radius: 18px; background: #ffffff; padding: 16px 18px; color: #27272a; font-size: 15px; line-height: 32px; font-weight: 600;">
        ${renderInlineEmailText(body).replace(/\n/g, "<br />")}
      </div>
    `;
}

function buildAdminUserMessage(email: string, subject: string, body: string, from: string) {
  const renderedBody = buildAdminEmailBodyHtml(body);

  return {
    from,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>${escapeHtml(subject)}</title>
      </head>
      <body lang="fa" dir="rtl" style="margin: 0; padding: 0; background-color: #e8edf0; color: #18181b; direction: rtl; text-align: right; -webkit-text-size-adjust: 100%;">
        <div dir="rtl" style="display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">
          ${escapeHtml(subject)}
        </div>
        <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background-color: #e8edf0;">
          <tr>
            <td dir="rtl" align="center" style="padding: 28px 12px;">
              <table role="presentation" dir="rtl" width="660" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 660px; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #d7dee3; border-radius: 30px; overflow: hidden; box-shadow: 0 26px 76px rgba(15, 23, 42, 0.18);">
                <tr>
                  <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 30px 28px 32px; background-color: #101113; background-image: linear-gradient(135deg, #101113 0%, #18212f 46%, #00a896 100%); color: #ffffff;">
                    <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                      <tr>
                        <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE}">
                          <div dir="rtl" style="display: inline-block; width: 48px; height: 48px; border-radius: 17px; background-color: #00f5d4; color: #002d27; font-family: ${EMAIL_FONT_FAMILY}; font-size: 24px; line-height: 48px; font-weight: 700; text-align: center;">M</div>
                          <div dir="rtl" style="${EMAIL_RTL_STYLE} display: inline-block; padding-right: 12px; vertical-align: top;">
                            <div style="${EMAIL_RTL_STYLE} color: #ffffff; font-size: 17px; line-height: 24px; font-weight: 700;">مافیا بورد</div>
                            <div style="${EMAIL_RTL_STYLE} color: #99fff0; font-size: 12px; line-height: 20px; font-weight: 700;">پیام مدیریت</div>
                          </div>
                        </td>
                        <td dir="rtl" align="left" style="${EMAIL_RTL_STYLE}">
                          <span style="display: inline-block; border: 1px solid rgba(217,249,157,0.25); border-radius: 999px; padding: 8px 12px; background: rgba(163,230,53,0.10); color: #99fff0; font-size: 12px; font-weight: 700;">پیام رسمی</span>
                        </td>
                      </tr>
                    </table>
                    <h1 dir="rtl" style="${EMAIL_RTL_STYLE} margin: 30px 0 0; color: #ffffff; font-size: 31px; line-height: 46px; font-weight: 700;">${escapeHtml(subject)}</h1>
                    <div dir="rtl" style="${EMAIL_RTL_STYLE} margin-top: 14px; color: #d4d4d8; font-size: 14px; line-height: 27px; font-weight: 700;">
                      این پیام توسط تیم مدیریت مافیا بورد برای اطلاع‌رسانی مستقیم حساب شما ارسال شده است.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} padding: 28px; background: #ffffff;">
                    <div dir="rtl" style="${EMAIL_RTL_STYLE} border: 1px solid #e2e8f0; border-radius: 24px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); padding: 14px;">
                      ${renderedBody}
                    </div>
                    <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-top: 18px; border-collapse: separate; border-spacing: 0;">
                      <tr>
                        <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} border: 1px solid #99fff0; border-radius: 18px; background: #ecfeff; padding: 14px 16px; color: #155e75; font-size: 12px; line-height: 24px; font-weight: 700;">
                          اگر درباره این پیام سوالی دارید، از داخل سایت با مدیریت پیگیری کنید و اطلاعات حساس حساب خود را در پاسخ ایمیل ارسال نکنید.
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-collapse: collapse;">
                      <tr>
                        <td dir="rtl" align="right" style="${EMAIL_RTL_STYLE} color: #71717a; font-size: 12px; line-height: 24px; font-weight: 700;">
                          این پیام برای حساب <span dir="ltr" style="direction: ltr; unicode-bidi: embed;">${escapeHtml(email)}</span> ارسال شده است.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `${RTL_MARK}${subject}\n\n${RTL_MARK}${body}`,
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

export async function sendAdminUserEmail(email: string, subject: string, body: string): Promise<PasswordResetEmailResult> {
  const config = getMailConfig();
  const from = process.env.ADMIN_EMAIL_FROM || process.env.EMAIL_FROM || process.env.SMTP_FROM || "no-reply@playmafia.live";
  const message = buildAdminUserMessage(email, subject, body, from);

  if (config.resendApiKey) {
    return sendWithResendApi(message, config.resendApiKey, email);
  }

  const transporter = getTransporter({ ...config, from });

  if (!transporter) {
    console.info("[ADMIN_EMAIL_PREVIEW]", { email, subject, body, reason: "mail transport is not configured" });
    return { delivered: false, reason: "mail transport is not configured" };
  }

  try {
    await withTimeout(transporter.sendMail(message), MAIL_TIMEOUT_MS);
    return { delivered: true };
  } catch (error) {
    console.warn("[ADMIN_EMAIL_FAILED]", { email, subject, error });
    return { delivered: false, reason: "mail delivery failed" };
  }
}
