import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const quietMarks = ["لابی زنده", "گزارش دقیق", "سناریوی پویا"];
const lobbyPreviewPlayers = ["نیما", "سارا", "آرش", "مینا"];

export default function Home() {
  return (
    <main className="app-page min-h-screen overflow-hidden text-zinc-950 dark:text-white" dir="rtl">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-20 size-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-300/8" />
        <div className="absolute bottom-8 right-8 size-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/8" />
      </div>

      <section className="pm-mobile-app-landing relative z-10 flex min-h-[100dvh] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)] md:hidden">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-zinc-950/8 bg-white/68 px-3 py-2 text-[11px] font-black text-zinc-500 shadow-sm shadow-zinc-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:text-white/52">
            آماده بازی
          </span>
          <ThemeToggle nav />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center pb-5 text-center">
          <div className="motion-pop relative grid size-32 place-items-center rounded-[2.2rem] border border-zinc-950/6 bg-white shadow-2xl shadow-cyan-500/12 dark:border-white/10 dark:bg-white/[0.07] dark:shadow-black/35">
            <div className="absolute inset-2 rounded-[1.7rem] bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.34),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(236,254,255,0.74))] dark:bg-[radial-gradient(circle_at_35%_20%,rgba(34,211,238,0.22),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))]" />
            <span className="material-symbols-outlined relative text-7xl text-cyan-700 dark:text-cyan-100">theater_comedy</span>
          </div>

          <h1 className="motion-reveal mt-7 text-[2.65rem] font-black leading-tight">مافیا بورد</h1>
          <p className="motion-reveal mt-3 max-w-[16rem] text-[13px] font-bold leading-7 text-zinc-600 dark:text-white/58">
            لابی، نقش‌ها و گزارش بازی؛ مثل یک اپ واقعی، سریع و بی‌حاشیه.
          </p>

          <div className="motion-reveal mt-7 grid w-full grid-cols-3 gap-2 rounded-[1.5rem] border border-zinc-950/8 bg-white/62 p-2 shadow-lg shadow-zinc-950/6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
            {[
              ["groups", "لابی"],
              ["timer", "تایمر"],
              ["summarize", "گزارش"],
            ].map(([icon, label]) => (
              <div key={label} className="grid min-h-16 place-items-center rounded-[1.1rem] bg-white/72 text-center shadow-sm shadow-zinc-950/5 dark:bg-white/[0.055]">
                <span className="material-symbols-outlined text-xl text-cyan-700 dark:text-cyan-100">{icon}</span>
                <span className="mt-1 text-[10px] font-black text-zinc-500 dark:text-white/46">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="motion-reveal mx-auto w-full max-w-sm rounded-[1.75rem] border border-zinc-950/8 bg-white/86 p-3 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[#15171b]/92 dark:shadow-black/35">
          <Link href="/auth/login" className="pm-button pm-button-primary min-h-14 w-full rounded-[1.15rem] text-base">
            <span className="material-symbols-outlined text-xl">login</span>
            ورود به اپ
          </Link>
          <Link href="/auth/register" className="mt-2 flex min-h-12 items-center justify-center rounded-[1.15rem] text-sm font-black text-zinc-500 transition-colors hover:text-zinc-950 dark:text-white/52 dark:hover:text-white">
            ساخت حساب جدید
          </Link>
          <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-zinc-200 dark:bg-white/12" />
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
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-8 text-center lg:text-right">
            <div className="motion-pop mx-auto grid size-28 place-items-center rounded-[2rem] border border-zinc-950/6 bg-white shadow-2xl shadow-zinc-950/8 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/35 lg:mx-0">
              <span className="material-symbols-outlined text-6xl text-cyan-700 dark:text-cyan-100">theater_comedy</span>
            </div>

            <div className="motion-reveal">
              <p className="inline-flex min-h-9 items-center rounded-full border border-zinc-950/8 bg-white/72 px-4 text-xs font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/54">
                اپ مدیریت بازی مافیا
              </p>
              <h1 className="mt-5 text-5xl font-black leading-tight sm:text-7xl">
                مافیا بورد
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-8 text-zinc-600 dark:text-white/58 sm:text-lg lg:mx-0">
                لابی، نقش‌ها، تایمر و گزارش بازی در یک تجربه ساده و شیک.
              </p>
            </div>

            <div className="motion-reveal mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row lg:mx-0">
              <Link href="/auth/login" className="pm-button pm-button-primary min-h-14 flex-1 rounded-full text-base">
                <span className="material-symbols-outlined text-xl">login</span>
                ورود
              </Link>
              <Link href="/auth/register" className="pm-button pm-button-secondary min-h-14 flex-1 rounded-full text-base">
                ثبت نام
              </Link>
            </div>

            <div className="motion-reveal mx-auto flex max-w-xl flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
              {quietMarks.map((item) => (
                <span key={item} className="rounded-full border border-zinc-950/8 bg-white/68 px-3 py-2 text-xs font-black text-zinc-500 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/44">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="motion-reveal relative overflow-hidden rounded-[1.7rem] border border-zinc-950/8 bg-white/82 p-4 text-right shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/35">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-cyan-400 via-sky-400 to-amber-300" />
            <div className="flex items-start justify-between gap-4 pt-2">
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-100">نمونه لابی</p>
                <h2 className="mt-1 text-xl font-black">جمعه شب</h2>
                <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-white/48">سناریوی کلاسیک ۱۰ نفره</p>
              </div>
              <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs font-black text-cyan-700 dark:text-cyan-100">
                #482913
              </span>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-zinc-200 bg-zinc-50/80 p-3 dark:border-white/10 dark:bg-black/18">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-zinc-500 dark:text-white/46">بازیکنان حاضر</span>
                <span className="text-zinc-950 dark:text-white">۴ / ۱۰</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                <span className="block h-full w-2/5 rounded-full bg-gradient-to-l from-cyan-400 to-emerald-300" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {lobbyPreviewPlayers.map((player) => (
                  <div key={player} className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 dark:border-white/10 dark:bg-white/[0.045]">
                    <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                      {player[0]}
                    </span>
                    <span className="min-w-0 truncate text-sm font-black">{player}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["timer", "تایمر"],
                ["theater_comedy", "نقش‌ها"],
                ["summarize", "گزارش"],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-xl border border-zinc-200 bg-white/72 p-2 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="material-symbols-outlined text-lg text-cyan-700 dark:text-cyan-100">{icon}</span>
                  <p className="mt-1 text-[10px] font-black text-zinc-500 dark:text-white/46">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
