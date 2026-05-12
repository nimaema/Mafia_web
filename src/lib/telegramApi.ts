export type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type TelegramInlineKeyboardMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

type SendMessageOptions = {
  replyMarkup?: TelegramInlineKeyboardMarkup;
  parseMode?: "HTML" | "MarkdownV2";
  disableNotification?: boolean;
};

function botApiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export function htmlEscape(value: string | null | undefined) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function callTelegram(method: string, payload: Record<string, unknown>) {
  const url = botApiUrl(method);
  if (!url) {
    console.warn(`Telegram bot token is not configured; skipped ${method}.`);
    return { ok: false, description: "Telegram bot token is not configured" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    console.error("Telegram API call failed:", method, data || response.statusText);
  }
  return data;
}

export async function sendTelegramMessage(chatId: string, text: string, options: SendMessageOptions | TelegramInlineKeyboardMarkup = {}) {
  const normalizedOptions = "inline_keyboard" in options ? { replyMarkup: options } : options;
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: normalizedOptions.parseMode || "HTML",
    disable_notification: normalizedOptions.disableNotification || false,
    reply_markup: normalizedOptions.replyMarkup,
  });
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}
