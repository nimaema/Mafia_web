"use client";

import Link from "next/link";
import { useState } from "react";

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
        setError(data?.error || "ارسال لینک بازیابی ناموفق بود. پاسخ سرور قابل خواندن نبود.");
        return;
      }

      setMessage("اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.");
      setPreviewUrl(data?.previewUrl || null);
    } catch {
      setError("درخواست به سرور نرسید. اگر برنامه محلی را تست می‌کنید، مطمئن شوید سرور و دیتابیس هر دو اجرا هستند.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-sans selection:bg-[#98000b] selection:text-white flex items-center justify-center p-4 md:p-8" dir="rtl">
      {/* Cinematic ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-[#131313] to-transparent opacity-80" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#3a3939]/20 via-[#0e0e0e] to-[#0e0e0e]" />
      </div>

      <div className="relative w-full max-w-2xl flex flex-col shadow-[0_0_64px_rgba(71,71,71,0.08)] bg-[#201f1f] border-l-4 border-transparent md:border-none">
        
        {/* Dossier Top/Side Accent Bar (Crimson) */}
        <div className="w-full h-1.5 md:w-1.5 md:h-auto bg-[#98000b] absolute top-0 left-0 right-0 md:bottom-0 md:right-auto md:left-0 z-10" />
        
        {/* Main Content Area */}
        <div className="flex-1 p-8 md:p-14 flex flex-col justify-center relative z-20">
          
          <div className="mb-10 relative">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
              بازیابی رمز عبور
            </h1>
            <p className="text-sm text-[#c8c6c6] uppercase opacity-80 font-mono tracking-widest mt-2" style={{ letterSpacing: "0.1em" }} dir="ltr">
              /// OP: FORGET_PASSWORD
            </p>
            <div className="w-12 h-1 bg-[#ffb4ab] mt-6" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
            
            {error && (
              <div className="bg-[#1c1b1b] border-r-4 border-[#ffb4ab] p-4 text-[#ffb4ab] text-sm animate-fade-in shadow-lg">
                <div className="flex items-center gap-3 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xl">warning</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {message && (
              <div className="bg-[#1c1b1b] border-r-4 border-[#a3e635] p-4 text-[#c8c6c6] text-sm animate-fade-in shadow-lg">
                <div className="flex items-center gap-3 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xl">done_all</span>
                  <span>{message}</span>
                </div>
              </div>
            )}

            {previewUrl && (
              <div className="bg-[#3a3939] p-6 text-[#e5e2e1] text-sm shadow-xl">
                <p className="font-bold tracking-widest text-[#ffb4ab] uppercase mb-2 font-mono" dir="ltr">/// LOCAL_TEST_LINK_READY</p>
                <p className="mb-6 opacity-80 leading-relaxed text-xs">
                  چون سرویس ایمیل در این محیط در دسترس نیست، می‌توانید مستقیم از همین لینک روند بازیابی را تست کنید.
                </p>
                <a href={previewUrl} className="inline-flex items-center gap-2 border-2 border-white/20 hover:border-[#ffb4ab] px-4 py-3 font-bold tracking-widest text-xs uppercase transition-colors" dir="ltr">
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  OPEN LINK
                </a>
              </div>
            )}

            <div className="flex flex-col gap-2 relative group">
              <label className="text-[10px] font-bold tracking-[0.15em] text-[#c6c6c6] uppercase font-mono" dir="ltr">
                TARGET_EMAIL [ایمیل]
              </label>
              <div className="relative mt-2">
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[#c6c6c6] opacity-50 group-focus-within:opacity-100 group-focus-within:text-[#ffb4ab] transition-colors">mail</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="CLASSIFIED@DOMAIN.COM"
                  className="w-full bg-transparent border-0 border-b-2 border-white/20 px-8 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-0 focus:border-[#ffb4ab] transition-colors rounded-none font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
              <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto relative group overflow-hidden bg-gradient-to-r from-[#ffb4ab] to-[#98000b] text-[#690005] font-black uppercase tracking-widest text-xs px-8 py-4 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-none flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">{isSubmitting ? "hourglass_empty" : "terminal"}</span>
                {isSubmitting ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              
              <Link href="/auth/login" className="w-full sm:w-auto border-2 border-white/10 hover:border-white/30 text-[#e5e2e1] font-bold uppercase tracking-widest text-xs px-8 py-4 transition-all hover:bg-white/5 active:scale-95 text-center flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
                بازگشت به ورود
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
