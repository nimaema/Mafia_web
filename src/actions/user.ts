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

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email }
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
