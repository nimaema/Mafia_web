"use client";

import { registerUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const { showAlert } = usePopup();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!name || !email || !password) {
      showAlert("فرم ناقص است", "نام، ایمیل و رمز عبور را کامل وارد کنید.", "warning");
      return;
    }
    const result = await registerUser(formData);

    if (result.success) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email.toLowerCase())}`);
    } else {
      showAlert("خطا در ثبت نام", result.error || "مشکلی در ایجاد حساب رخ داد", "error");
    }
  };

  return (
    <AuthShell
      icon="person_add"
      title="ساخت حساب کاربری"
      subtitle="حساب خود را بسازید تا به لابی‌ها، تاریخچه بازی و ابزارهای مدیریت دسترسی داشته باشید."
      activeTab="register"
    >
      <form onSubmit={handleRegister} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[var(--pm-muted)]">نام کامل</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pm-muted)]">badge</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="نام و نام خانوادگی"
              className="w-full pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[var(--pm-muted)]">ایمیل</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pm-muted)]">mail</span>
            <input
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[var(--pm-muted)]">رمز عبور</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pm-muted)]">lock</span>
            <input
              name="password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="حداقل ۸ کاراکتر"
              className="w-full pl-12"
            />
          </div>
          <p className="text-xs leading-5 text-[var(--pm-muted)]">
            برای امنیت بهتر از ترکیب حروف و عدد استفاده کنید.
          </p>
        </div>

        <button type="submit" className="ui-button-primary mt-2 min-h-12 w-full">
          <span className="material-symbols-outlined text-xl">person_add</span>
          ایجاد حساب کاربری
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--pm-line)]"></div>
        <span className="text-xs font-bold text-[var(--pm-muted)]">یا</span>
        <div className="h-px flex-1 bg-[var(--pm-line)]"></div>
      </div>

      <button onClick={() => signIn("google")} type="button" className="ui-button-secondary min-h-12 w-full">
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        </svg>
        ثبت نام با گوگل
      </button>
    </AuthShell>
  );
}
