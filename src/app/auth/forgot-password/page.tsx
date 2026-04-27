"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPreviewUrl(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "ارسال لینک بازیابی ناموفق بود");
        return;
      }

      setMessage("اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.");
      setPreviewUrl(data.previewUrl || null);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      icon="lock_reset"
      title="بازیابی رمز عبور"
      subtitle="ایمیل حساب خود را وارد کنید تا لینک تنظیم رمز تازه برای شما آماده شود."
      footer={
        <Link href="/auth/login" className="text-center text-sm font-bold text-lime-600 transition-colors hover:text-lime-500 dark:text-lime-400">
          بازگشت به ورود
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-4 py-3 text-sm text-lime-700 dark:text-lime-300">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">mark_email_read</span>
              <span>{message}</span>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-300">
            <p className="font-black">لینک تست محلی آماده است</p>
            <p className="mt-2 leading-6">
              چون سرویس ایمیل در این محیط در دسترس نیست، می‌توانید مستقیم از همین لینک روند بازیابی را تست کنید.
            </p>
            <a href={previewUrl} className="ui-button-secondary mt-3 min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              باز کردن لینک بازیابی
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">ایمیل</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full pl-12"
            />
          </div>
        </div>

        <button disabled={isSubmitting} type="submit" className="ui-button-primary mt-2 min-h-12 w-full">
          <span className="material-symbols-outlined text-xl">send</span>
          {isSubmitting ? "در حال ارسال..." : "ارسال لینک بازیابی"}
        </button>
      </form>
    </AuthShell>
  );
}
