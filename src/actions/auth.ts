"use server";

import { passwordValidationError, saltAndHashPassword } from "@/lib/password";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { getTrustedBaseUrlFromHeaders } from "@/lib/site";

const INVALID_LOGIN_MESSAGE = "ایمیل یا رمز عبور اشتباه است";

async function getBaseUrl() {
  return getTrustedBaseUrlFromHeaders(await headers());
}

async function createVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "لطفاً نام، ایمیل و رمز عبور را کامل وارد کنید." };
  }

  const passwordError = passwordValidationError(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "این ایمیل قبلاً ثبت شده است." };
  }

  const password_hash = await saltAndHashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
    },
  });

  const token = await createVerificationToken(email);
  await sendVerificationEmail(email, token, await getBaseUrl());

  return { success: true };
}

export async function resendVerificationEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "ایمیل حساب را وارد کنید." };

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return { error: "حسابی با این ایمیل پیدا نشد." };
  if (user.emailVerified) return { success: true, verified: true };

  const existing = await prisma.verificationToken.findFirst({
    where: { identifier: normalizedEmail, expires: { gt: new Date() } },
    orderBy: { expires: "desc" },
  });
  if (existing) {
    const createdAtMs = existing.expires.getTime() - 24 * 60 * 60 * 1000;
    const waitMs = 2 * 60 * 1000 - (Date.now() - createdAtMs);
    if (waitMs > 0) {
      return { error: `برای ارسال دوباره حدود ${Math.ceil(waitMs / 1000)} ثانیه دیگر صبر کنید.` };
    }
  }

  const token = await createVerificationToken(normalizedEmail);
  const result = await sendVerificationEmail(normalizedEmail, token, await getBaseUrl());
  return result.delivered || result.previewUrl
    ? { success: true }
    : { error: "ارسال ایمیل تایید انجام نشد. تنظیمات ایمیل سرور را بررسی کنید." };
}

export async function verifyEmailToken(token: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.identifier !== normalizedEmail || record.expires < new Date()) {
    return { error: "لینک تایید ایمیل نامعتبر یا منقضی شده است." };
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true, emailVerified: true }
    });

    if (!user) {
      return { error: "ایمیل یا رمز عبور اشتباه است" };
    }

    if (!user.emailVerified) {
      return { error: "برای ورود ابتدا ایمیل خود را تایید کنید.", needsVerification: true, email };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, role: user?.role };
  } catch (error) {
    if (error instanceof Error && error.message.includes("مسدود")) {
      return { error: "حساب کاربری شما مسدود شده است" };
    }
    return { error: INVALID_LOGIN_MESSAGE };
  }
}

export async function logout() {
  await signOut();
}
