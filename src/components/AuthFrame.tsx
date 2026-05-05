import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthFrame({
  title,
  subtitle,
  icon,
  children,
  active,
}: {
  title: string;
  subtitle: string;
  icon: string;
  children: ReactNode;
  active?: "login" | "register";
}) {
  return (
    <div className="pm-app-bg flex min-h-screen items-center justify-center px-4 py-8 text-zinc-100" dir="rtl">
      <div className="fixed left-4 top-4 z-20">
        <ThemeToggle compact />
      </div>
      <main className="grid w-full max-w-5xl gap-5 md:grid-cols-[1fr_420px]">
        <section className="pm-surface hidden min-h-[620px] flex-col justify-between p-8 md:flex">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="material-symbols-outlined grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">theater_comedy</span>
              <div>
                <p className="font-black text-zinc-50">PlayMafia</p>
                <p className="text-xs font-bold text-cyan-100/70">اتاق فرمان بازی</p>
              </div>
            </Link>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">سیستم آماده</span>
          </div>

          <div className="max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Secure Gateway</p>
            <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight text-zinc-50">ورود به میز بازی، بدون شلوغی.</h1>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              همه چیز برای بازیکن و گرداننده در یک تجربه اپلیکیشنی: لابی زنده، نقش مخفی، گزارش بازی و مدیریت سناریو.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["sensors", "لابی زنده"],
              ["shield_lock", "ورود امن"],
              ["timeline", "گزارش دقیق"],
            ].map(([itemIcon, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <span className="material-symbols-outlined text-cyan-200">{itemIcon}</span>
                <p className="mt-3 text-xs font-black text-zinc-200">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pm-surface p-5 sm:p-7">
          <header className="mb-6 text-center">
            <Link href="/" className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 md:hidden">
              <span className="material-symbols-outlined text-[28px]">theater_comedy</span>
            </Link>
            <span className="material-symbols-outlined mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              {icon}
            </span>
            <h2 className="text-2xl font-black tracking-tight text-zinc-50">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p>
          </header>

          {active && (
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1">
              <Link href="/auth/login" className={`rounded-xl py-2.5 text-center text-sm font-black transition-all ${active === "login" ? "bg-cyan-300 text-slate-950" : "text-zinc-400 hover:text-zinc-100"}`}>
                ورود
              </Link>
              <Link href="/auth/register" className={`rounded-xl py-2.5 text-center text-sm font-black transition-all ${active === "register" ? "bg-cyan-300 text-slate-950" : "text-zinc-400 hover:text-zinc-100"}`}>
                ثبت‌نام
              </Link>
            </div>
          )}

          {children}
        </section>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-zinc-400">{label}</span>
      <span className="relative block">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[20px] text-zinc-500">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}
