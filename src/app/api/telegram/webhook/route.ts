import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegramBot";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "Telegram webhook secret is not configured" }, { status: 503 });
  }

  const actualSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (actualSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
