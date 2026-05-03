"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // For a dynamic glowing background effect tied to mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPreviewUrl(null);
    if (!email.trim()) {
      setError("لطفاً آدرس ایمیل خود را وارد کنید.");
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
        setError(data?.error || "ارسال لینک بازیابی با خطا مواجه شد.");
        return;
      }

      setMessage("لینک بازیابی رمز عبور با موفقیت به ایمیل شما ارسال شد.");
      setPreviewUrl(data?.previewUrl || null);
    } catch {
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 font-sans" dir="rtl">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-40 transition-transform duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)}px ${mousePosition.y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 500)}px, rgba(220, 38, 38, 0.12) 0%, transparent 40%),
                         radial-gradient(circle at ${(typeof window !== 'undefined' ? window.innerWidth : 1000) - (mousePosition.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 500))}px ${(typeof window !== 'undefined' ? window.innerHeight : 1000) - (mousePosition.y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 500))}px, rgba(163, 230, 53, 0.08) 0%, transparent 35%)`
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800/30 rounded-full mix-blend-screen filter blur-[100px] animate-glow" />
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-lg mx-4 sm:mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-red-900/10 hover:border-white/20">
          
          {/* Subtle Top Gradient Border */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />

          <div className="p-8 sm:p-12">
            
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 shadow-inner mb-6 relative group">
                <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="material-symbols-outlined text-3xl text-zinc-300 group-hover:text-white transition-colors relative z-10">lock_reset</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 mb-3 tracking-tight">
                بازیابی رمز عبور
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                ایمیل متصل به حساب کاربری خود را وارد کنید تا لینک امن برای تنظیم مجدد رمز عبور را دریافت نمایید.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
              
              {/* Messages Container */}
              <div className="flex flex-col gap-3">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <span className="material-symbols-outlined text-lg mt-0.5">error_outline</span>
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {message && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400 text-sm animate-fade-in shadow-[0_0_15px_rgba(132,204,22,0.1)]">
                    <span className="material-symbols-outlined text-lg mt-0.5">check_circle</span>
                    <span className="leading-relaxed">{message}</span>
                  </div>
                )}

                {previewUrl && (
                  <div className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm shadow-xl animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-sky-400">science</span>
                      <p className="font-bold text-sky-400">محیط توسعه (Local Test)</p>
                    </div>
                    <p className="mb-4 leading-relaxed opacity-80 text-xs">
                      به دلیل عدم دسترسی به سرور ایمیل در محیط محلی، لینک زیر تولید شده است:
                    </p>
                    <a href={previewUrl} className="group inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 border border-sky-500/20 transition-all font-medium text-xs">
                      <span>باز کردن لینک امن</span>
                      <span className="material-symbols-outlined text-[1rem] group-hover:translate-x-[2px] transition-transform">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Advanced Custom Input */}
              <div className="relative group/input mt-2">
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-transparent opacity-0 transition-opacity duration-300 blur-md ${isFocused ? 'opacity-100' : ''}`} />
                <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/50 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  <div className="pl-5 pr-4 py-4 text-zinc-500 group-focus-within/input:text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                  </div>
                  <div className="flex-1 relative h-14">
                    <label 
                      className={`absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 transition-all duration-300 pointer-events-none origin-right
                        ${email || isFocused ? '-translate-y-[1.2rem] scale-[0.8] font-bold text-red-400 opacity-100' : 'text-sm'}`}
                    >
                      آدرس ایمیل
                    </label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      className="absolute inset-0 w-full h-full bg-transparent text-white pt-4 px-0 outline-none text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 mt-4">
                <button 
                  disabled={isSubmitting} 
                  type="submit" 
                  className="relative group overflow-hidden w-full h-14 rounded-2xl font-bold text-white transition-all disabled:opacity-70 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-800 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] transition-opacity mix-blend-overlay" />
                  <div className="absolute top-0 inset-x-0 h-px bg-white/20" />
                  
                  <div className="relative flex items-center justify-center gap-2 h-full w-full">
                    <span>{isSubmitting ? "در حال اعتبارسنجی..." : "ارسال لینک بازیابی"}</span>
                    <span className={`material-symbols-outlined text-lg ${isSubmitting ? 'animate-spin' : 'group-hover:-translate-x-1 transition-transform'}`} dir="ltr">
                      {isSubmitting ? "progress_activity" : "arrow_forward"}
                    </span>
                  </div>
                </button>
                
                <Link 
                  href="/auth/login" 
                  className="group flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-zinc-400 font-medium hover:text-white hover:bg-zinc-800/50 transition-all text-sm"
                >
                  بازگشت به صفحه ورود
                </Link>
              </div>

            </form>
          </div>
        </div>
        
        {/* Footer Text */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          &copy; {new Date().getFullYear()} Persian Mafia Companion. تمامی حقوق محفوظ است.
        </p>
      </div>
    </div>
  );
}
