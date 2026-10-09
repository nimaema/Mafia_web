"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { resendVerificationEmail } from "@/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { usePopup } from "@/components/PopupProvider";
import { Notice } from "@/components/ui/Notice";

const toFa = (value: number) => value.toLocaleString("fa-IR");

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
      showAlert("ایمیل نامشخص", "برای ارسال دوباره، از لینک داخل ایمیل یا صفحه ثبت نام وارد شوید.", "warning");
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

  if (verified) {
    return (
      <AuthShell title="نقاب شما آماده است" subtitle="ایمیل تایید شد. حالا می‌توانید وارد شوید و به اولین لابی بپیوندید.">
        <Link href="/auth/login" className="nq-btn nq-btn-primary nq-btn-lg w-full">
          ورود
          <ArrowLeft size={20} weight="bold" aria-hidden />
        </Link>
      </AuthShell>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <AuthShell
      title="ایمیل‌تان را باز کنید"
      subtitle={email ? `لینک تایید برای ${email} فرستاده شد.` : "لینک تایید در صندوق ایمیل شماست."}
      footer={
        <Link href="/auth/login" className="text-sm font-bold text-accent hover:underline">
          بازگشت به ورود
        </Link>
      }
    >
      <div className="flex flex-col gap-5">
        {error ? <Notice tone="warning">{error}</Notice> : null}
        <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-raised p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent-soft text-accent">
            <EnvelopeSimple size={24} weight="bold" aria-hidden />
          </span>
          <p className="text-sm font-medium leading-6 text-muted">
            روی لینک داخل ایمیل بزنید. اگر پیدا نکردید، پوشه اسپم را هم نگاه کنید.
          </p>
        </div>
        <button onClick={resend} disabled={secondsLeft > 0 || isPending} className="nq-btn nq-btn-secondary nq-btn-lg w-full">
          {isPending ? (
            "در حال ارسال…"
          ) : secondsLeft > 0 ? (
            <span>
              ارسال دوباره تا{" "}
              <span className="tabular-nums" dir="ltr">
                {toFa(minutes)}:{seconds.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}
              </span>
            </span>
          ) : (
            <>
              ارسال دوباره ایمیل
              <PaperPlaneTilt size={20} weight="bold" aria-hidden />
            </>
          )}
        </button>
      </div>
    </AuthShell>
  );
}
