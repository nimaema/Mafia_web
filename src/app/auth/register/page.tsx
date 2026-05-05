"use client";

import { registerUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { CommandButton } from "@/components/CommandUI";

export default function RegisterPage() {
  const router = useRouter();
  const { showAlert, showToast } = usePopup();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!name || !email || !password) {
      showAlert("اطلاعات ناقص", "نام، ایمیل و رمز عبور را کامل وارد کنید.", "warning");
      return;
    }

    const result = await registerUser(formData);
    if (result.success) {
      showToast("حساب ساخته شد. ایمیل تایید را بررسی کنید.", "success");
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      showAlert("خطا در ثبت‌نام", result.error || "مشکلی در ایجاد حساب رخ داد.", "error");
    }
  };

  return (
    <AuthFrame title="ساخت حساب" subtitle="برای ورود به هر بازی، حساب کاربری لازم است." icon="person_add" active="register">
      <form onSubmit={handleRegister} noValidate className="space-y-4">
        <AuthField label="نام نمایشی" icon="badge">
          <input name="name" type="text" placeholder="نام شما در بازی" maxLength={50} className="pm-input h-12 px-3 pl-10" />
        </AuthField>

        <AuthField label="ایمیل" icon="mail">
          <input name="email" type="email" dir="ltr" placeholder="name@example.com" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <AuthField label="رمز عبور" icon="lock">
          <input name="password" type="password" dir="ltr" placeholder="حداقل ۸ کاراکتر" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <CommandButton type="submit" className="w-full">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          ایجاد حساب
        </CommandButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-bold text-zinc-500">
        <span className="h-px flex-1 bg-white/10" />
        <span>یا</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <CommandButton tone="ghost" onClick={() => signIn("google")} className="w-full">
        <span className="material-symbols-outlined text-[18px]">account_circle</span>
        ادامه با گوگل
      </CommandButton>
    </AuthFrame>
  );
}
