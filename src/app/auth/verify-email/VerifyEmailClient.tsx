"use client";

import { useEffect, useState, useTransition } from "react";
import { resendVerificationEmail } from "@/actions/auth";
import { usePopup } from "@/components/PopupProvider";
import { AuthFrame } from "@/components/AuthFrame";
import { CommandButton, CommandSurface, StatusChip } from "@/components/CommandUI";

export function VerifyEmailClient({
  email,
  verified,
  error,
}: {
  email?: string;
  verified?: boolean;
  error?: string;
}) {
  const { showToast, showAlert } = usePopup();
  const [secondsLeft, setSecondsLeft] = useState(verified ? 0 : 120);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (verified || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, verified]);

  const resend = () => {
    if (!email) {
      showAlert("ایمیل نامشخص", "برای ارسال دوباره تایید، ابتدا با ایمیل ثبت‌نام‌شده وارد شوید.", "warning");
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
    <AuthFrame
      title={verified ? "ایمیل تایید شد" : "تایید ایمیل"}
      subtitle={verified ? "حساب شما آماده ورود است." : "برای فعال شدن حساب، لینک تایید ایمیل را باز کنید."}
      icon={verified ? "verified" : "mark_email_unread"}
    >
      <div className="space-y-4">
        <CommandSurface className="p-4">
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${verified ? "bg-emerald-300 text-slate-950" : error ? "bg-amber-300 text-slate-950" : "bg-cyan-300 text-slate-950"}`}>
              {verified ? "verified" : error ? "warning" : "outgoing_mail"}
            </span>
            <div className="min-w-0">
              <StatusChip tone={verified ? "emerald" : error ? "amber" : "cyan"}>
                {verified ? "فعال" : "در انتظار تایید"}
              </StatusChip>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {verified
                  ? "ایمیل حساب تایید شد. حالا می‌توانید وارد شوید و به لابی‌ها دسترسی داشته باشید."
                  : email
                    ? `لینک تایید برای ${email} ارسال شده است.`
                    : "لینک تایید در صندوق ایمیل حساب شما قرار دارد."}
              </p>
            </div>
          </div>
        </CommandSurface>

        {error && (
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-bold leading-6 text-amber-100">
            {error}
          </div>
        )}

        {verified ? (
          <CommandButton href="/auth/login" className="w-full">
            <span className="material-symbols-outlined text-[18px]">login</span>
            ورود به حساب
          </CommandButton>
        ) : (
          <>
            <CommandButton onClick={resend} disabled={secondsLeft > 0 || isPending} className="w-full">
              <span className={`material-symbols-outlined text-[18px] ${isPending ? "animate-spin" : ""}`}>
                {isPending ? "progress_activity" : "send"}
              </span>
              {secondsLeft > 0 ? `ارسال دوباره تا ${secondsLeft} ثانیه دیگر` : "ارسال دوباره ایمیل تایید"}
            </CommandButton>
            <CommandButton href="/auth/login" tone="ghost" className="w-full">
              بازگشت به ورود
            </CommandButton>
          </>
        )}
      </div>
    </AuthFrame>
  );
}
