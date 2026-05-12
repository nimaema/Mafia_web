import { createHash, randomBytes } from "crypto";

export function createTelegramLinkToken() {
  return randomBytes(24).toString("base64url");
}

export function hashTelegramLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function telegramBotLink(token: string) {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username) return null;
  return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
}
