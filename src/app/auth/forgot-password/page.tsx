"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { CommandButton } from "@/components/CommandUI";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim();
    if (!email) {
      setStatus("error");
      setMessage("ایمیل حساب خود را وارد کنید.");
      return;
    }

    setStatus("sending");
    setMessage("");
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || "ارسال ایمیل بازیابی انجام نشد.");
      return;
    }

    setStatus("sent");
    setMessage("اگر این ایمیل در سیستم باشد، لینک بازیابی برای شما ارسال شد.");
  };

  return (
    <AuthFrame title="بازیابی رمز" subtitle="لینک امن بازیابی را از ایمیل خود دریافت کنید." icon="key">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {message && (
          <div className={`rounded-2xl border p-3 text-sm font-bold leading-6 ${status === "error" ? "border-rose-300/25 bg-rose-400/10 text-rose-100" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"}`}>
            {message}
          </div>
        )}

        <AuthField label="ایمیل" icon="mail">
          <input name="email" type="email" dir="ltr" placeholder="name@example.com" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <CommandButton type="submit" disabled={status === "sending"} className="w-full">
          <span className="material-symbols-outlined text-[18px]">{status === "sending" ? "progress_activity" : "send"}</span>
          {status === "sending" ? "در حال ارسال..." : "ارسال لینک بازیابی"}
        </CommandButton>

        <CommandButton href="/auth/login" tone="ghost" className="w-full">
          بازگشت به ورود
        </CommandButton>
      </form>
    </AuthFrame>
  );
}
