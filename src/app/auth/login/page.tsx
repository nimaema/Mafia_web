"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useActionState<string | null, FormData>(
    async (prevState, formData) => {
      const result = await loginUser(formData);
      if (result.success) {
        if (result.role === "ADMIN") {
          router.push("/dashboard/admin");
        } else if (result.role === "MODERATOR") {
          router.push("/dashboard/moderator");
        } else {
          router.push("/dashboard/user");
        }
        return null;
      }
      return "ایمیل یا رمز عبور اشتباه است";
    },
    null
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-zinc-950 overflow-hidden font-sans" dir="rtl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-lime-500/20 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[150px] mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-[420px] backdrop-blur-2xl bg-zinc-900/60 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 p-10 flex flex-col gap-8 transition-all hover:border-white/20 hover:shadow-[0_8px_40px_rgba(132,204,22,0.1)]">
        
        <header className="flex flex-col gap-2 items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 p-[2px] shadow-lg shadow-lime-500/20 mb-2">
            <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl bg-gradient-to-br from-lime-400 to-emerald-500 bg-clip-text text-transparent">admin_panel_settings</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ورود به سیستم</h1>
          <p className="text-sm text-zinc-400 font-medium">به پلتفرم مدیریت مافیا خوش آمدید</p>
        </header>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-950/50 rounded-xl w-full border border-white/5 relative">
          <div className="w-1/2 absolute top-1 bottom-1 right-1 bg-white/10 rounded-lg shadow-sm border border-white/5 transition-all"></div>
          <button className="flex-1 py-2.5 text-sm font-bold text-white relative z-10">ورود</button>
          <Link href="/auth/register" className="flex-1 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 text-center relative z-10 transition-colors">ثبت نام</Link>
        </div>

        <form action={setError} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 px-1">ایمیل</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">mail</span>
              <input name="email" required type="email" dir="ltr" placeholder="name@example.com" 
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-zinc-400">رمز عبور</label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-lime-400 hover:text-lime-300 transition-colors">فراموشی رمز؟</Link>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lime-400 transition-colors">lock</span>
              <input name="password" required type="password" dir="ltr" placeholder="••••••••" 
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner" 
              />
            </div>
          </div>
          
          <button type="submit" className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-2">
            <span className="absolute inset-0 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"></span>
            <div className="relative flex items-center justify-center gap-2 bg-zinc-900 px-4 py-3.5 rounded-xl transition-all group-hover:bg-transparent">
              <span className="text-white font-bold text-sm tracking-wide group-hover:text-zinc-950 transition-colors">ورود به حساب</span>
              <span className="material-symbols-outlined text-white text-sm group-hover:text-zinc-950 transition-colors">arrow_back</span>
            </div>
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-l from-white/10 to-transparent"></div>
          <span className="text-xs font-medium text-zinc-500">یا ورود با</span>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        <button onClick={() => signIn('google')} type="button" className="w-full flex items-center justify-center gap-3 bg-zinc-950/50 border border-white/10 hover:border-white/20 rounded-xl py-3.5 hover:bg-white/5 transition-all group shadow-sm">
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
          </svg>
          <span className="font-semibold text-sm text-zinc-300 group-hover:text-white transition-colors">ادامه با گوگل</span>
        </button>
      </main>
    </div>
  );
}
