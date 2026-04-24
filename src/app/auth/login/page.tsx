"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);
    
    if (result.success) {
      router.push("/dashboard/user");
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-surface-dim text-on-surface min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-white rounded-xl shadow-lg border border-zinc-200 p-8 flex flex-col gap-8 relative overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <header className="flex flex-col gap-3 items-center text-center relative z-10">
          <span className="material-symbols-outlined text-4xl text-lime-500 mb-2">admin_panel_settings</span>
          <h1 className="text-2xl font-bold">مدیریت مافیا</h1>
          
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full mt-4 border border-zinc-200 dark:border-zinc-700">
            <button className="flex-1 py-2 rounded-full bg-lime-500 text-zinc-950 font-medium shadow-sm transition-all">ورود</button>
            <Link href="/auth/register" className="flex-1 py-2 rounded-full text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-all text-center">ثبت‌نام</Link>
          </div>
        </header>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500 px-1">ایمیل</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
              <input name="email" required type="email" dir="ltr" placeholder="name@example.com" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm text-zinc-500">رمز عبور</label>
              <Link href="/auth/forgot-password" className="text-sm text-lime-600 dark:text-lime-400 hover:opacity-80 transition-opacity">فراموشی رمز؟</Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
              <input name="password" required type="password" dir="ltr" placeholder="••••••••" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-lime-500 text-zinc-950 text-lg font-semibold rounded-lg py-3 mt-4 hover:bg-lime-600 transition-colors shadow-sm">
            ورود به حساب
          </button>
        </form>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span className="text-xs text-zinc-500">یا</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        <button onClick={() => signIn('google')} type="button" className="relative z-10 w-full flex items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
          </svg>
          <span className="font-medium">ادامه با گوگل</span>
        </button>
      </main>
    </div>
  );
}
