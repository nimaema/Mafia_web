import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileLandingLogin } from "@/components/auth/MobileLandingLogin";

const quietMarks = ["لابی زنده", "گزارش دقیق", "سناریوی پویا"];
const lobbyPreviewPlayers = ["نیما", "سارا", "آرش", "مینا"];

export default function Home() {
  return (
    <main className="app-page min-h-screen overflow-hidden" dir="rtl">
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(132,204,22,0.09),transparent_18rem),linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:auto,3.5rem_3.5rem,3.5rem_3.5rem] opacity-80 dark:bg-[linear-gradient(180deg,rgba(190,242,100,0.06),transparent_18rem),linear-gradient(90deg,rgba(96,165,250,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(96,165,250,0.055)_1px,transparent_1px)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(190,242,100,0.62),transparent)]" />
      </div>

      <MobileLandingLogin />

      {/* Desktop Header */}
      <header className="app-container relative z-10 hidden items-center justify-between py-6 md:flex">
        <Link href="/" className="motion-reveal flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] shadow-[var(--pm-shadow-soft)]">
            <span className="material-symbols-outlined text-3xl text-[var(--pm-primary)]">theater_comedy</span>
          </div>
          <div>
            <p className="text-xl font-black">مافیا بورد</p>
            <p className="text-xs font-black tracking-widest text-[var(--pm-muted)]">PLAYMAFIA</p>
          </div>
        </Link>

        <div className="motion-reveal flex items-center gap-4">
          <ThemeToggle compact />
          <Link href="/auth/login" className="pm-button pm-button-secondary px-6">
            ورود
          </Link>
        </div>
      </header>

      {/* Desktop Landing */}
      <section className="app-container relative z-10 hidden min-h-[calc(100dvh-6.5rem)] items-center justify-center pb-16 md:flex">
        <div className="mx-auto grid w-full max-w-[70rem] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-10 text-center lg:text-right">
            <div className="motion-pop mx-auto grid size-32 place-items-center rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface)] shadow-[var(--pm-shadow)] lg:mx-0">
              <span className="material-symbols-outlined text-[4rem] text-[var(--pm-primary)] drop-shadow-[0_0_20px_var(--pm-primary-glow)]">theater_comedy</span>
            </div>

            <div className="motion-reveal">
              <span className="pm-chip mb-6">
                اپ مدیریت بازی مافیا
              </span>
              <h1 className="text-6xl font-black leading-[1.1] sm:text-7xl lg:text-[5.5rem]">
                مافیا بورد
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg font-bold leading-relaxed text-[var(--pm-muted)] lg:mx-0">
                لابی، نقش‌ها، تایمر و گزارش بازی در یک تجربه ساده و شیک. طراحی شده برای گرداننده‌های حرفه‌ای.
              </p>
            </div>

            <div className="motion-reveal mx-auto flex w-full max-w-md flex-col gap-4 sm:flex-row lg:mx-0">
              <Link href="/auth/login" className="pm-button pm-button-primary min-h-[3.5rem] flex-1 text-[1.1rem]">
                <span className="material-symbols-outlined text-2xl">login</span>
                ورود
              </Link>
              <Link href="/auth/register" className="pm-button pm-button-secondary min-h-[3.5rem] flex-1 text-[1.1rem]">
                <span className="material-symbols-outlined text-2xl">person_add</span>
                ثبت نام
              </Link>
            </div>

            <div className="motion-reveal mx-auto flex max-w-2xl flex-wrap justify-center gap-3 lg:mx-0 lg:justify-start">
              {quietMarks.map((item) => (
                <span key={item} className="pm-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="motion-pop pm-card relative overflow-hidden p-6 text-right shadow-[var(--pm-shadow)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--pm-primary)] opacity-80 shadow-[0_0_15px_var(--pm-primary)]" />
            <div className="flex items-start justify-between gap-4 pt-4">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">نمونه لابی</p>
                <h2 className="mt-2 text-2xl font-black">جمعه شب</h2>
                <p className="mt-1 text-sm font-bold text-[var(--pm-muted)]">سناریوی کلاسیک ۱۰ نفره</p>
              </div>
              <span className="pm-chip pm-chip-primary font-mono text-sm">
                #482913
              </span>
            </div>

            <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4">
              <div className="mb-4 flex items-center justify-between text-sm font-black">
                <span className="text-[var(--pm-muted)]">بازیکنان حاضر</span>
                <span className="text-[var(--pm-text)]">۴ / ۱۰</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--pm-line)]">
                <span className="block h-full w-2/5 rounded-full bg-[var(--pm-primary)] shadow-[0_0_10px_var(--pm-primary)]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {lobbyPreviewPlayers.map((player) => (
                  <div key={player} className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] px-3 shadow-[var(--pm-shadow-soft)] transition-colors hover:border-[var(--pm-primary)]">
                    <span className="grid size-9 place-items-center rounded-[var(--radius-xs)] bg-[var(--pm-surface-strong)] text-[0.8rem] font-black text-[var(--pm-text)]">
                      {player[0]}
                    </span>
                    <span className="min-w-0 truncate text-[0.95rem] font-black">{player}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["timer", "تایمر"],
                ["theater_comedy", "نقش‌ها"],
                ["summarize", "گزارش"],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3 text-center transition-colors hover:bg-[var(--pm-surface-strong)]">
                  <span className="material-symbols-outlined text-2xl text-[var(--pm-primary)]">{icon}</span>
                  <p className="mt-2 text-[0.7rem] font-black tracking-widest text-[var(--pm-muted)]">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
