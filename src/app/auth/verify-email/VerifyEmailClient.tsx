"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { resendVerificationEmail } from "@/actions/auth";
import { usePopup } from "@/components/PopupProvider";

export function VerifyEmailClient({ email, verified, error }: { email?: string; verified?: boolean; error?: string }) {
  const { showToast, showAlert } = usePopup();
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (verified || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, verified]);

  const resend = () => {
    if (!email) {
      showAlert("ایمیل نامشخص", "برای ارسال دوباره، از لینک داخل ایمیل یا صفحه ثبت‌نام وارد شوید.", "warning");
      return;
    }
    startTransition(async () => {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setSecondsLeft(120);
        showToast(result.verified ? "ایمیل شما قبلاً تایید شده است" : "ایمیل تایید دوباره ارسال شد", "success");
      } else {
        showAlert("ارسال انجام نشد", result.error || "کمی بعد دوباره تلاش کنید.", "error");
      }
    });
  };

  return (
    <div className="app-page pm-force-dark min-h-screen overflow-hidden p-4 text-white" dir="rtl">
      <main className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden lg:block">
          <div className="pm-chip pm-chip-primary">
            <span className="material-symbols-outlined text-lg">mark_email_unread</span>
            ایستگاه فعال‌سازی حساب
          </div>
          <h1 className="mt-5 text-5xl font-black leading-tight text-white">فقط تایید ایمیل مانده.</h1>
          <p className="mt-4 max-w-xl text-base font-bold leading-8 text-white/58">
            بعد از تایید، داشبورد، لابی‌ها و تاریخچه بازی برای حساب شما فعال می‌شود.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["shield", "ورود امن"],
              ["timer", "ارسال هر ۲ دقیقه"],
              ["sports_esports", "آماده بازی"],
            ].map(([icon, text]) => (
              <div key={text} className="ui-muted p-4">
                <span className="material-symbols-outlined text-xl text-cyan-200">{icon}</span>
                <p className="mt-3 text-sm font-black text-white">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <div className="border-b border-white/10 bg-black/20 p-6 text-center">
            <div className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${verified ? "bg-cyan-300" : error ? "bg-amber-400" : "bg-sky-400"} text-zinc-950`}>
              <span className="material-symbols-outlined text-3xl">{verified ? "verified" : error ? "warning" : "outgoing_mail"}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-white">
              {verified ? "ایمیل تایید شد" : "ایمیل‌تان را تایید کنید"}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/56">
              {verified
                ? "حساب شما آماده استفاده است."
                : email
                  ? `لینک تایید برای ${email} ارسال شده است.`
                  : "لینک تایید در صندوق ایمیل شماست."}
            </p>
          </div>

          <div className="space-y-4 p-6">
            {error && (
              <div className="rounded-2xl border border-amber-400/24 bg-amber-400/10 p-4 text-sm font-bold leading-6 text-amber-200">
                {error}
              </div>
            )}

            {verified ? (
              <Link href="/auth/login" className="ui-button-primary min-h-12 w-full">
                <span className="material-symbols-outlined text-xl">login</span>
                ورود به حساب
              </Link>
            ) : (
              <>
                <button onClick={resend} disabled={secondsLeft > 0 || isPending} className="ui-button-primary min-h-12 w-full">
                  <span className={`material-symbols-outlined text-xl ${isPending ? "animate-spin" : ""}`}>{isPending ? "refresh" : "send"}</span>
                  {secondsLeft > 0 ? `ارسال دوباره تا ${secondsLeft} ثانیه دیگر` : "ارسال دوباره ایمیل تایید"}
                </button>
                <Link href="/auth/login" className="ui-button-secondary min-h-12 w-full">
                  بازگشت به ورود
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
