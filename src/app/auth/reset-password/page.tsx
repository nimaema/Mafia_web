"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

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

    if (!token) {
      setError("لینک بازیابی نامعتبر است");
      return;
    }

    if (password !== confirmPassword) {
      setError("تکرار رمز عبور مطابقت ندارد");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "تنظیم رمز عبور ناموفق بود");
        return;
      }

      router.push("/auth/login");
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      icon="password"
      title="رمز عبور جدید"
      subtitle="برای ادامه، رمز تازه‌ای با حداقل ۸ کاراکتر، یک حرف بزرگ و یک عدد تنظیم کنید."
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">رمز عبور</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="رمز تازه"
              className="w-full pl-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">تکرار رمز عبور</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="تکرار رمز تازه"
              className="w-full pl-12"
            />
          </div>
        </div>

        <button disabled={isSubmitting} type="submit" className="ui-button-primary mt-2 min-h-12 w-full">
          <span className="material-symbols-outlined text-xl">check</span>
          {isSubmitting ? "در حال ذخیره..." : "ذخیره رمز جدید"}
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
