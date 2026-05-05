import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const previewRows = [
  ["#PX-91", "در انتظار", "سناریو کلاسیک", "8/12"],
  ["#NR-44", "زنده", "پدرخوانده", "11/11"],
  ["#VK-02", "آماده", "کاپو", "10/10"],
];

export default function Home() {
  return (
    <div className="pm-app-bg min-h-screen overflow-hidden text-zinc-100" dir="rtl">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="material-symbols-outlined grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(0,229,255,0.22)]">
            theater_comedy
          </span>
          <span className="hidden font-black tracking-tight text-zinc-50 sm:block">PlayMafia</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/auth/login" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(0,229,255,0.18)]">
            ورود
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl place-items-center px-4 pb-8 md:grid-cols-[0.9fr_1.1fr] md:gap-10 md:px-6">
        <section className="flex w-full max-w-sm flex-col items-center text-center md:hidden">
          <span className="material-symbols-outlined mb-5 grid h-24 w-24 place-items-center rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 text-5xl text-cyan-100">
            theater_comedy
          </span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-50">PlayMafia</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">لابی، نقش و گزارش بازی در یک اپ سریع.</p>
          <Link href="/auth/login" className="mt-7 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-center text-sm font-black text-slate-950">
            ورود به بازی
          </Link>
        </section>

        <section className="hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Mafia Command App</p>
          <h1 className="mt-4 max-w-xl text-6xl font-black leading-tight tracking-tight text-zinc-50">
            اتاق فرمان مدرن برای هر بازی مافیا.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-zinc-400">
            بازیکن‌ها سریع وارد لابی می‌شوند، گرداننده بازی را کنترل می‌کند، و گزارش نهایی تمیز و قابل‌اشتراک می‌ماند.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/auth/login" className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950">
              ورود
            </Link>
            <Link href="/auth/register" className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-zinc-100">
              ساخت حساب
            </Link>
          </div>
        </section>

        <section className="pm-surface hidden w-full max-w-md p-5 md:block">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Live Board</p>
              <h2 className="text-xl font-black text-zinc-50">لابی‌های فعال</h2>
            </div>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">Online</span>
          </div>

          <div className="space-y-2">
            {previewRows.map(([code, status, scenario, count]) => (
              <div key={code} className="pm-ledger-row flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-black text-cyan-100">{code}</p>
                  <p className="mt-1 truncate text-xs text-zinc-400">{scenario}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-zinc-100">{count}</p>
                  <p className="mt-1 text-[10px] font-bold text-emerald-200">{status}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
            <p className="text-xs font-black text-violet-100">ابزار گرداننده</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">تایمر، ثبت اتفاقات شب و روز، و گزارش نهایی در یک جریان یکپارچه.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
