"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { loginUser } from "@/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { usePopup } from "@/components/PopupProvider";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

function authErrorMessage(error?: string | null) {
  if (!error) return null;
  const normalized = error.toLowerCase();
  if (normalized.includes("credential") || normalized.includes("signin")) return "ایمیل یا رمز عبور اشتباه است.";
  if (normalized.includes("accessdenied") || normalized.includes("denied")) return "دسترسی شما برای ورود تایید نشد.";
  if (normalized.includes("callback")) return "ورود با سرویس انتخاب‌شده کامل نشد. دوباره تلاش کنید.";
  if (normalized.includes("configuration")) return "تنظیمات ورود روی سرور کامل نیست.";
  if (normalized.includes("verification")) return "لینک ورود یا تایید معتبر نیست یا منقضی شده است.";
  return "ورود انجام نشد. دوباره تلاش کنید.";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="nq-btn nq-btn-primary nq-btn-lg mt-1 w-full">
      {pending ? "در حال ورود…" : "ورود"}
      {!pending ? <ArrowLeft size={20} weight="bold" aria-hidden /> : null}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = usePopup();
  const [authQueryError, setAuthQueryError] = useState<string | null>(null);

  useEffect(() => {
    setAuthQueryError(authErrorMessage(new URLSearchParams(window.location.search).get("error")));
  }, []);

  const [error, formAction] = useActionState<string | null, FormData>(async (_previousState, formData) => {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!email || !password) return "ایمیل و رمز عبور را کامل وارد کنید.";

    const result = await loginUser(formData);
    if (result.success) {
      router.push("/dashboard/user");
      return null;
    }

    if ((result as { needsVerification?: boolean }).needsVerification) {
      showAlert("ایمیل تایید نشده", result.error || "برای ورود ابتدا ایمیل خود را تایید کنید.", "warning");
      router.push(`/auth/verify-email?email=${encodeURIComponent((result as { email?: string }).email || email)}`);
      return null;
    }

    return result.error || "ایمیل یا رمز عبور اشتباه است.";
  }, null);

  const message = error || authQueryError;

  return (
    <AuthShell title="خوش برگشتید" subtitle="وارد شوید تا به لابی دوستانتان بپیوندید." activeTab="login">
      <form action={formAction} noValidate className="flex flex-col gap-5">
        {message ? <Notice tone="danger">{message}</Notice> : null}

        <Field label="ایمیل" name="email" type="email" dir="ltr" autoComplete="email" inputMode="email" placeholder="name@example.com" />
        <Field
          label="رمز عبور"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          aside={
            <Link href="/auth/forgot-password" className="text-sm font-bold text-accent hover:underline">
              فراموش کرده‌ام
            </Link>
          }
        />

        <SubmitButton />
      </form>

      <div className="my-6">
        <OrDivider />
      </div>
      <GoogleButton />
    </AuthShell>
  );
}
