"use server";

import { PrismaClient } from "@prisma/client";
import { saltAndHashPassword } from "@/lib/password";
import { signIn } from "@/auth";

const prisma = new PrismaClient();

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "Missing required fields" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already exists" };
  }

  const password_hash = await saltAndHashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
    },
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });

    return { success: true, role: user?.role };
  } catch (error) {
    return { error: "Invalid credentials" };
  }
}
