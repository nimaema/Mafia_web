import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const quietMarks = ["لابی زنده", "گزارش دقیق", "سناریوی پویا"];

export default function Home() {
  return (
    <main className="app-page min-h-screen overflow-hidden text-zinc-950 dark:text-white" dir="rtl">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-20 size-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-300/8" />
        <div className="absolute bottom-8 right-8 size-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/8" />
      </div>

      <section className="relative z-10 flex min-h-[100dvh] flex-col justify-between px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.1rem)] md:hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-950/8 bg-white/72 px-3 py-2 text-[11px] font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/52">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
            PlayMafia
          </div>
          <ThemeToggle nav />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center">
          <div className="motion-pop relative grid size-28 place-items-center rounded-[2rem] border border-zinc-950/6 bg-white shadow-2xl shadow-zinc-950/10 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/35">
            <div className="absolute inset-2 rounded-[1.55rem] bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.28),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.9),rgba(236,254,255,0.68))] dark:bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.2),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            <span className="material-symbols-outlined relative text-6xl text-cyan-700 dark:text-cyan-100">theater_comedy</span>
          </div>

          <h1 className="motion-reveal mt-7 text-4xl font-black leading-tight">مافیا بورد</h1>
          <p className="motion-reveal mt-3 max-w-[17rem] text-sm font-bold leading-7 text-zinc-600 dark:text-white/58">
            لابی، نقش، تایمر و گزارش بازی در یک اپ سبک و آماده اجرا.
          </p>

          <div className="motion-reveal mt-8 grid w-full gap-3">
            <Link href="/auth/login" className="pm-button pm-button-primary min-h-14 w-full rounded-[1.15rem] text-base">
              <span className="material-symbols-outlined text-xl">login</span>
              ورود به اپ
            </Link>
            <Link href="/auth/register" className="pm-button pm-button-secondary min-h-12 w-full rounded-[1.15rem] text-sm">
              ساخت حساب جدید
            </Link>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2">
          {quietMarks.map((item) => (
            <span key={item} className="rounded-2xl border border-zinc-950/8 bg-white/68 px-2 py-2 text-center text-[10px] font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/44">
              {item}
            </span>
          ))}
        </div>
      </section>

      <header className="app-container relative z-10 hidden items-center justify-between py-5 md:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl border border-zinc-950/5 bg-white text-zinc-950 shadow-lg shadow-zinc-950/8 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:shadow-black/20">
            <span className="material-symbols-outlined text-2xl text-cyan-700 dark:text-cyan-100">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black">مافیا بورد</p>
            <p className="text-[11px] font-black text-zinc-500 dark:text-white/48">PlayMafia</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/auth/login" className="hidden min-h-10 items-center rounded-full border border-zinc-950/10 bg-white px-4 text-sm font-black text-zinc-950 shadow-sm shadow-zinc-950/5 transition-all hover:border-cyan-500/35 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.11] sm:inline-flex">
            ورود
          </Link>
        </div>
      </header>

      <section className="app-container relative z-10 hidden min-h-[calc(100dvh-5.5rem)] items-center justify-center pb-12 md:flex">
        <div className="mx-auto grid w-full max-w-4xl gap-8 text-center">
          <div className="motion-pop mx-auto grid size-28 place-items-center rounded-[2rem] border border-zinc-950/6 bg-white shadow-2xl shadow-zinc-950/8 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/35">
            <span className="material-symbols-outlined text-6xl text-cyan-700 dark:text-cyan-100">theater_comedy</span>
          </div>

          <div className="motion-reveal">
            <p className="mx-auto inline-flex min-h-9 items-center rounded-full border border-zinc-950/8 bg-white/72 px-4 text-xs font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/54">
              اپ مدیریت بازی مافیا
            </p>
            <h1 className="mt-5 text-5xl font-black leading-tight sm:text-7xl">
              مافیا بورد
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-8 text-zinc-600 dark:text-white/58 sm:text-lg">
              لابی، نقش‌ها، تایمر و گزارش بازی در یک تجربه ساده و شیک.
            </p>
          </div>

          <div className="motion-reveal mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/login" className="pm-button pm-button-primary min-h-14 flex-1 rounded-full text-base">
              <span className="material-symbols-outlined text-xl">login</span>
              ورود
            </Link>
            <Link href="/auth/register" className="pm-button pm-button-secondary min-h-14 flex-1 rounded-full text-base">
              ثبت نام
            </Link>
          </div>

          <div className="motion-reveal mx-auto flex max-w-xl flex-wrap justify-center gap-2">
            {quietMarks.map((item) => (
              <span key={item} className="rounded-full border border-zinc-950/8 bg-white/68 px-3 py-2 text-xs font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/44">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
