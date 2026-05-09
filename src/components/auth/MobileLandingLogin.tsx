"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginUser } from "@/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePopup } from "@/components/PopupProvider";

function authErrorMessage(error?: string | null) {
  if (!error) return null;
  const normalized = error.toLowerCase();
  if (normalized.includes("credential") || normalized.includes("signin")) return "ایمیل یا رمز عبور اشتباه است";
  if (normalized.includes("accessdenied") || normalized.includes("denied")) return "دسترسی شما برای ورود تایید نشد.";
  if (normalized.includes("callback")) return "ورود با سرویس انتخاب‌شده کامل نشد. دوباره تلاش کنید.";
  if (normalized.includes("configuration")) return "تنظیمات ورود روی سرور کامل نیست.";
  if (normalized.includes("verification")) return "لینک ورود یا تایید معتبر نیست یا منقضی شده است.";
  return "ورود انجام نشد. دوباره تلاش کنید.";
}

export function MobileLandingLogin() {
  const router = useRouter();
  const { showAlert } = usePopup();
  const [authQueryError, setAuthQueryError] = useState<string | null>(null);

  useEffect(() => {
    setAuthQueryError(authErrorMessage(new URLSearchParams(window.location.search).get("error")));
  }, []);

  const [error, submitLogin, pending] = useActionState<string | null, FormData>(
    async (_previousState, formData) => {
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      if (!email || !password) return "ایمیل و رمز عبور را کامل وارد کنید";

      const result = await loginUser(formData);
      if (result.success) {
        if (result.role === "ADMIN") router.push("/dashboard/admin/users");
        else if (result.role === "MODERATOR") router.push("/dashboard/moderator");
        else router.push("/dashboard/user");
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
    <section className="pm-mobile-app-landing relative z-10 flex min-h-[100dvh] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)] md:hidden">
      <header className="motion-reveal mx-auto flex w-full max-w-sm items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)] shadow-[var(--pm-shadow-soft)]">
            <span className="material-symbols-outlined text-2xl text-[var(--pm-primary)]">theater_comedy</span>
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black leading-6">مافیا بورد</span>
            <span className="block text-[0.68rem] font-black text-[var(--pm-muted)]">ورود به اتاق فرمان</span>
          </span>
        </Link>
        <ThemeToggle nav />
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">
        <div className="motion-pop pm-card p-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-4 py-5 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)] shadow-[var(--pm-shadow-soft)]">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-[var(--pm-text)]">خوش آمدید</h1>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm font-bold leading-6 text-[var(--pm-muted)]">
              برای ادامه وارد حساب خود شوید.
            </p>
          </div>

          <form action={submitLogin} noValidate className="mt-5 grid gap-4">
            {(error || authQueryError) && (
              <div className="rounded-[var(--radius-md)] border border-[var(--pm-danger)]/20 bg-[var(--pm-danger)]/10 px-3 py-2 text-xs font-bold leading-6 text-[var(--pm-danger)]">
                {error || authQueryError}
              </div>
            )}

            <label className="grid gap-2">
              <span className="text-xs font-black text-[var(--pm-muted)]">ایمیل</span>
              <span className="relative block">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--pm-muted)]">mail</span>
                <input name="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" className="pl-12" />
              </span>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-[var(--pm-muted)]">رمز عبور</span>
                <Link href="/auth/forgot-password" className="text-xs font-black text-[var(--pm-primary)]">فراموشی رمز؟</Link>
              </span>
              <span className="relative block">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--pm-muted)]">lock</span>
                <input name="password" type="password" dir="ltr" autoComplete="current-password" placeholder="••••••••" className="pl-12" />
              </span>
            </label>

            <button type="submit" disabled={pending} className="pm-button-primary mt-1 min-h-[3.25rem] w-full text-base">
              <span className={`material-symbols-outlined text-xl ${pending ? "animate-spin" : ""}`}>
                {pending ? "progress_activity" : "arrow_back"}
              </span>
              ورود
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--pm-line)]" />
            <span className="text-xs font-bold text-[var(--pm-muted)]">یا</span>
            <span className="h-px flex-1 bg-[var(--pm-line)]" />
          </div>

          <button
            type="button"
            onClick={() => signIn("google")}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-4 text-sm font-black text-[var(--pm-text)] shadow-[var(--pm-shadow-soft)]"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            ورود با گوگل
          </button>

          <p className="mt-5 text-center text-xs font-bold text-[var(--pm-muted)]">
            حساب ندارید؟{" "}
            <Link href="/auth/register" className="font-black text-[var(--pm-primary)]">
              ثبت نام
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
