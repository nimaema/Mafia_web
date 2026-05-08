"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/AuthShell";
import { usePopup } from "@/components/PopupProvider";

function authErrorMessage(error?: string | null) {
  if (!error) return null;
  const normalized = error.toLowerCase();
  if (normalized.includes("credential") || normalized.includes("signin")) {
    return "ایمیل یا رمز عبور اشتباه است";
  }
  if (normalized.includes("accessdenied") || normalized.includes("denied")) {
    return "دسترسی شما برای ورود تایید نشد.";
  }
  if (normalized.includes("callback")) {
    return "ورود با سرویس انتخاب‌شده کامل نشد. دوباره تلاش کنید.";
  }
  if (normalized.includes("configuration")) {
    return "تنظیمات ورود روی سرور کامل نیست.";
  }
  if (normalized.includes("verification")) {
    return "لینک ورود یا تایید معتبر نیست یا منقضی شده است.";
  }
  return "ورود انجام نشد. دوباره تلاش کنید.";
}

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = usePopup();
  const [authQueryError, setAuthQueryError] = useState<string | null>(null);

  useEffect(() => {
    setAuthQueryError(authErrorMessage(new URLSearchParams(window.location.search).get("error")));
  }, []);

  const [error, setError] = useActionState<string | null, FormData>(
    async (_previousState, formData) => {
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      if (!email || !password) {
        return "ایمیل و رمز عبور را کامل وارد کنید";
      }
      const result = await loginUser(formData);
      if (result.success) {
        if (result.role === "ADMIN") {
          router.push("/dashboard/admin/users");
        } else if (result.role === "MODERATOR") {
          router.push("/dashboard/moderator");
        } else {
          router.push("/dashboard/user");
        }
        return null;
      }

      if ((result as any).needsVerification) {
        showAlert("ایمیل تایید نشده", result.error || "برای ورود ابتدا ایمیل خود را تایید کنید.", "warning");
        router.push(`/auth/verify-email?email=${encodeURIComponent((result as any).email || email)}`);
        return null;
      }

      return result.error || "ایمیل یا رمز عبور اشتباه است";
    },
    null
  );

  return (
    <AuthShell
      icon="admin_panel_settings"
      title="ورود به سیستم"
      subtitle="برای دسترسی به داشبورد، لابی‌ها و کنترل بازی وارد حساب خود شوید."
      activeTab="login"
    >
      <form action={setError} noValidate className="flex flex-col gap-5">
        {(error || authQueryError) && (
          <div className="rounded-[var(--radius-md)] border border-[var(--pm-danger)]/20 bg-[var(--pm-danger)]/10 px-4 py-3 text-sm text-[var(--pm-danger)]">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error || authQueryError}</span>
            </div>
          </div>
        )}

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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--pm-muted)]">رمز عبور</label>
            <Link href="/auth/forgot-password" className="text-xs font-bold text-[var(--pm-primary)] transition-colors opacity-90 hover:opacity-100">
              فراموشی رمز؟
            </Link>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--pm-muted)]">lock</span>
            <input
              name="password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-12"
            />
          </div>
        </div>

        <button type="submit" className="pm-button-primary mt-2 min-h-12 w-full">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          ورود به حساب
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--pm-line)]"></div>
        <span className="text-xs font-bold text-[var(--pm-muted)]">یا</span>
        <div className="h-px flex-1 bg-[var(--pm-line)]"></div>
      </div>

      <button 
        onClick={() => signIn("google")} 
        type="button" 
        className="group relative flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-lg border border-[var(--pm-line)] bg-zinc-50/50 px-4 font-bold text-[var(--pm-text)] transition-all hover:border-[var(--pm-line-strong)] hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--pm-line-strong)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        </svg>
        <span>ادامه با گوگل</span>
      </button>
    </AuthShell>
  );
}
