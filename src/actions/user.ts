"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "شما وارد نشده‌اید" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
      return { error: "لطفا نام و ایمیل را وارد کنید" };
    }
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.some((part) => part.length > 25)) {
      return { error: "نام و نام خانوادگی هر کدام حداکثر می‌توانند ۲۵ کاراکتر باشند." };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email, ...(currentUser?.email !== email ? { emailVerified: null } : {}) }
    });

    revalidatePath("/dashboard/user");
    revalidatePath("/dashboard/user/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.code === 'P2002') {
      return { error: "این ایمیل قبلا ثبت شده است" };
    }
    return { error: "خطا در بروزرسانی پروفایل" };
  }
}

import { hashPassword, verifyPassword } from "@/lib/password";

export async function changePassword(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "شما وارد نشده‌اید" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || !confirmPassword) {
      return { error: "لطفا تمامی فیلدها را پر کنید" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "رمز عبور جدید و تکرار آن یکسان نیستند" };
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return { error: "کاربر یافت نشد" };
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return { error: "لطفا رمز عبور فعلی را وارد کنید" };
      }
      const isValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isValid) {
        return { error: "رمز عبور فعلی نادرست است" };
      }
    }

    const newHashed = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHashed }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { error: "خطا در تغییر رمز عبور" };
  }
}
