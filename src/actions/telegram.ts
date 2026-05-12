"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTelegramLinkToken, hashTelegramLinkToken, telegramBotLink } from "@/lib/telegramLink";
import { revalidatePath } from "next/cache";

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

export async function createTelegramAccountLink() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "برای اتصال تلگرام ابتدا وارد حساب شوید." };
  }

  const token = createTelegramLinkToken();
  const link = telegramBotLink(token);
  if (!link) {
    return { error: "نام کاربری ربات تلگرام روی سرور تنظیم نشده است." };
  }

  await prisma.telegramLinkToken.deleteMany({ where: { userId: session.user.id } });
  await prisma.telegramLinkToken.create({
    data: {
      userId: session.user.id,
      tokenHash: hashTelegramLinkToken(token),
      expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS),
    },
  });

  return { success: true, link };
}

export async function unlinkTelegramAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "برای قطع اتصال تلگرام ابتدا وارد حساب شوید." };
  }

  await prisma.telegramAccount.deleteMany({ where: { userId: session.user.id } });
  await prisma.telegramLinkToken.deleteMany({ where: { userId: session.user.id } });
  revalidatePath("/dashboard/user/profile");
  return { success: true };
}
