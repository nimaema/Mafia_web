"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowSquareOut, PaperPlaneTilt } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

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
    if (!email.trim()) {
      setError("ایمیل حساب را وارد کنید.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        setError(data?.error || "ارسال لینک بازیابی انجام نشد. دوباره تلاش کنید.");
        return;
      }

      setMessage("اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی تا چند دقیقه دیگر می‌رسد.");
      setPreviewUrl(data?.previewUrl || null);
    } catch {
      setError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="رمز را فراموش کرده‌اید؟"
      subtitle="ایمیل حسابتان را بنویسید تا لینک ساخت رمز تازه را برایتان بفرستیم."
      footer={
        <Link href="/auth/login" className="text-sm font-bold text-accent hover:underline">
          بازگشت به ورود
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}
        {previewUrl ? (
          <Notice tone="info">
            <p>سرویس ایمیل در این محیط فعال نیست. لینک بازیابی را مستقیم باز کنید:</p>
            <a href={previewUrl} className="mt-2 inline-flex items-center gap-1.5 underline">
              باز کردن لینک بازیابی
              <ArrowSquareOut size={16} weight="bold" aria-hidden />
            </a>
          </Notice>
        ) : null}

        <Field
          label="ایمیل"
          name="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button disabled={isSubmitting} type="submit" className="nq-btn nq-btn-primary nq-btn-lg mt-1 w-full">
          {isSubmitting ? "در حال ارسال…" : "ارسال لینک بازیابی"}
          {!isSubmitting ? <PaperPlaneTilt size={20} weight="bold" aria-hidden /> : null}
        </button>
      </form>
    </AuthShell>
  );
}
