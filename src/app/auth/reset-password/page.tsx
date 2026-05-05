"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { CommandButton } from "@/components/CommandUI";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (!token) {
      setStatus("error");
      setMessage("لینک بازیابی نامعتبر است.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }

    setStatus("sending");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || "رمز عبور تغییر نکرد.");
      return;
    }

    setStatus("done");
    setMessage("رمز عبور جدید ثبت شد. حالا می‌توانید وارد شوید.");
    setTimeout(() => router.push("/auth/login"), 1400);
  };

  return (
    <AuthFrame title="رمز جدید" subtitle="رمزی امن انتخاب کنید و دوباره وارد بازی شوید." icon="lock_reset">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {message && (
          <div className={`rounded-2xl border p-3 text-sm font-bold leading-6 ${status === "error" ? "border-rose-300/25 bg-rose-400/10 text-rose-100" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"}`}>
            {message}
          </div>
        )}

        <AuthField label="رمز عبور جدید" icon="lock">
          <input name="password" type="password" dir="ltr" placeholder="حداقل ۸ کاراکتر، عدد و حرف بزرگ" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>
        <AuthField label="تکرار رمز عبور" icon="verified_user">
          <input name="confirm" type="password" dir="ltr" placeholder="تکرار رمز جدید" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <CommandButton type="submit" disabled={status === "sending"} className="w-full">
          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
          {status === "sending" ? "در حال ثبت..." : "ثبت رمز جدید"}
        </CommandButton>
      </form>
    </AuthFrame>
  );
}
