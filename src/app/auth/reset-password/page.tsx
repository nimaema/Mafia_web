"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) return setError("این لینک بازیابی معتبر نیست. یک لینک تازه درخواست کنید.");
    if (!password || !confirmPassword) return setError("رمز عبور و تکرار آن را کامل وارد کنید.");
    if (password.length < 8) return setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    if (password !== confirmPassword) return setError("تکرار رمز عبور با خود رمز یکی نیست.");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "ذخیره رمز تازه انجام نشد.");
        return;
      }
      router.push("/auth/login");
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="رمز تازه"
      subtitle="حداقل ۸ کاراکتر، با یک حرف بزرگ و یک عدد."
      footer={
        <Link href="/auth/login" className="text-sm font-bold text-accent hover:underline">
          بازگشت به ورود
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field
          label="رمز عبور تازه"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field
          label="تکرار رمز عبور"
          name="confirm"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <button disabled={isSubmitting} type="submit" className="nq-btn nq-btn-primary nq-btn-lg mt-1 w-full">
          {isSubmitting ? "در حال ذخیره…" : "ذخیره رمز تازه"}
          {!isSubmitting ? <Check size={20} weight="bold" aria-hidden /> : null}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
