"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { registerUser } from "@/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!name || !email || !password) {
      setError("نام، ایمیل و رمز عبور را کامل وارد کنید.");
      return;
    }

    setPending(true);
    const result = await registerUser(formData);
    setPending(false);

    if (result.success) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email.toLowerCase())}`);
    } else {
      setError(result.error || "ساخت حساب انجام نشد. دوباره تلاش کنید.");
    }
  };

  return (
    <AuthShell title="به جمع بپیوندید" subtitle="یک حساب بسازید تا نقاب خودتان را بگیرید و بازی‌هایتان ثبت شود." activeTab="register">
      <form onSubmit={handleRegister} noValidate className="flex flex-col gap-5">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <Field label="نام" name="name" type="text" autoComplete="name" hint="همین نام سر میز و در گزارش بازی دیده می‌شود." />
        <Field label="ایمیل" name="email" type="email" dir="ltr" autoComplete="email" inputMode="email" placeholder="name@example.com" />
        <Field
          label="رمز عبور"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          hint="حداقل ۸ کاراکتر، با ترکیبی از حرف و عدد."
        />

        <button type="submit" disabled={pending} className="nq-btn nq-btn-primary nq-btn-lg mt-1 w-full">
          {pending ? "در حال ساخت حساب…" : "ساخت حساب"}
          {!pending ? <ArrowLeft size={20} weight="bold" aria-hidden /> : null}
        </button>
      </form>

      <div className="my-6">
        <OrDivider />
      </div>
      <GoogleButton label="ثبت نام با گوگل" />
    </AuthShell>
  );
}
