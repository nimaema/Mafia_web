"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
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
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen items-center justify-center p-4 font-sans" dir="rtl">
      <div className="hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/20 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[150px] mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <main className="ui-card relative z-10 flex w-full max-w-[420px] flex-col gap-8 p-8 sm:p-10">
        <header className="flex flex-col gap-2 items-center text-center">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-600 p-[2px] shadow-lg shadow-lime-500/20 mb-2">
            <div className="w-full h-full bg-zinc-950 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl bg-gradient-to-br from-lime-400 to-emerald-500 bg-clip-text text-transparent">lock_reset</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">بازیابی رمز عبور</h1>
          <p className="text-sm text-zinc-400 font-medium">ایمیل حساب خود را وارد کنید</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm py-3 px-4 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-lime-500/10 border border-lime-500/30 text-lime-300 text-sm py-3 px-4 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">mark_email_read</span>
              <span className="font-medium">{message}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 px-1">ایمیل</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">mail</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                dir="ltr"
                placeholder="name@example.com"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full relative group overflow-hidden rounded-lg p-[1px] mt-2 disabled:opacity-60">
            <span className="absolute inset-0 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"></span>
            <div className="relative flex items-center justify-center gap-2 bg-zinc-900 px-4 py-3.5 rounded-lg transition-all group-hover:bg-transparent">
              <span className="text-white font-bold text-sm group-hover:text-zinc-950 transition-colors">
                {isSubmitting ? "در حال ارسال..." : "ارسال لینک بازیابی"}
              </span>
              <span className="material-symbols-outlined text-white text-sm group-hover:text-zinc-950 transition-colors">send</span>
            </div>
          </button>
        </form>

        <Link href="/auth/login" className="text-center text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors">
          بازگشت به ورود
        </Link>
      </main>
    </div>
  );
}
