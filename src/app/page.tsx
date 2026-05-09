import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const quietMarks = ["لابی زنده", "گزارش دقیق", "سناریوی پویا"];
const lobbyPreviewPlayers = ["نیما", "سارا", "آرش", "مینا"];
const mobileQuickActions = [
  { href: "/auth/login", icon: "dashboard", label: "داشبورد", value: "ورود" },
  { href: "/auth/login", icon: "groups", label: "لابی", value: "۴/۱۰" },
  { href: "/auth/login", icon: "timer", label: "تایمر", value: "۱۲:۰۰" },
  { href: "/auth/register", icon: "person_add", label: "عضویت", value: "جدید" },
];
const mobileStatusRows = [
  { icon: "verified", label: "سناریو", value: "کلاسیک ۱۰ نفره" },
  { icon: "radio_button_checked", label: "وضعیت", value: "آماده شروع" },
  { icon: "summarize", label: "گزارش", value: "ثبت خودکار" },
];

export default function Home() {
  return (
    <main className="app-page min-h-screen overflow-hidden" dir="rtl">
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(132,204,22,0.09),transparent_18rem),linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:auto,3.5rem_3.5rem,3.5rem_3.5rem] opacity-80 dark:bg-[linear-gradient(180deg,rgba(190,242,100,0.06),transparent_18rem),linear-gradient(90deg,rgba(96,165,250,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(96,165,250,0.055)_1px,transparent_1px)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(190,242,100,0.62),transparent)]" />
      </div>

      {/* Mobile Landing */}
      <section className="pm-mobile-app-landing relative z-10 flex min-h-[100dvh] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)] md:hidden">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
          <header className="motion-reveal flex items-center justify-between gap-3">
            <Link href="/auth/login" className="flex min-w-0 items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface)] shadow-[var(--pm-shadow-soft)]">
                <span className="material-symbols-outlined text-2xl text-[var(--pm-primary)]">theater_comedy</span>
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-black leading-6">مافیا بورد</span>
                <span className="block text-[0.7rem] font-black text-[var(--pm-muted)]">اتاق بازی</span>
              </span>
            </Link>
            <ThemeToggle nav />
          </header>

          <div className="motion-reveal mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-black text-[var(--pm-muted)]">امشب</p>
              <h1 className="mt-1 text-3xl font-black leading-tight">جمعه شب</h1>
            </div>
            <span className="pm-chip pm-chip-primary font-mono text-xs">#482913</span>
          </div>

          <section className="motion-pop pm-command pm-aurora mt-4 overflow-hidden p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-black text-[var(--pm-primary)]">لابی فعال</p>
                <h2 className="mt-1 text-xl font-black">سناریوی کلاسیک</h2>
                <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">۴ بازیکن از ۱۰ نفر</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--pm-primary)] text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]">
                <span className="material-symbols-outlined text-2xl">play_arrow</span>
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <span className="block h-full w-2/5 rounded-full bg-[var(--pm-primary)] shadow-[0_0_16px_var(--pm-primary)]" />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {lobbyPreviewPlayers.map((player) => (
                  <span key={player} className="grid size-10 place-items-center rounded-[var(--radius-sm)] border-2 border-[var(--pm-surface)] bg-[var(--pm-surface-strong)] text-xs font-black shadow-sm">
                    {player[0]}
                  </span>
                ))}
              </div>
              <Link href="/auth/login" className="pm-button-primary min-h-10 px-4 text-sm">
                ورود
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </Link>
            </div>
          </section>

          <section className="motion-reveal mt-4 grid grid-cols-2 gap-3">
            {mobileQuickActions.map((item) => (
              <Link key={item.label} href={item.href} className="motion-surface min-h-[5.25rem] rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-white/92 p-3 shadow-[var(--pm-shadow-soft)] dark:bg-[#181d22]">
                <span className="flex items-center justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[#eaf3f8] text-[var(--pm-primary)] dark:bg-[#20272d]">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </span>
                  <span className="text-xs font-black text-[var(--pm-muted)]">{item.label}</span>
                </span>
                <span className="mt-3 block text-lg font-black text-[var(--pm-text)]">{item.value}</span>
              </Link>
            ))}
          </section>

          <section className="motion-reveal mt-4 grid gap-2">
            {mobileStatusRows.map((item) => (
              <Link key={item.label} href="/auth/login" className="motion-surface flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-white/70 px-3 shadow-[var(--pm-shadow-soft)] dark:bg-[#20272d]/88">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-[var(--pm-blue)]">{item.icon}</span>
                  <span className="text-xs font-black text-[var(--pm-muted)]">{item.label}</span>
                </span>
                <span className="truncate text-sm font-black">{item.value}</span>
              </Link>
            ))}
          </section>
        </div>

        <nav className="motion-reveal fixed inset-x-0 bottom-0 z-20 border-t border-[var(--pm-line)] bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 shadow-[0_-18px_45px_rgba(16,32,51,0.12)] backdrop-blur-2xl dark:bg-[#15181b]/94 dark:shadow-black/30">
          <div className="mx-auto grid w-full max-w-sm grid-cols-[1fr_1.35fr_1fr] items-center gap-2">
            <Link href="/auth/register" className="grid min-h-12 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[#eaf3f8] text-center text-[0.68rem] font-black text-[var(--pm-muted)] dark:bg-[#20272d]">
              <span className="material-symbols-outlined text-xl">person_add</span>
              عضویت
            </Link>
            <Link href="/auth/login" className="pm-button-primary min-h-14 text-base">
              <span className="material-symbols-outlined text-xl">login</span>
              ورود به اپ
            </Link>
            <Link href="/join" className="grid min-h-12 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[#eaf3f8] text-center text-[0.68rem] font-black text-[var(--pm-muted)] dark:bg-[#20272d]">
              <span className="material-symbols-outlined text-xl">tag</span>
              کد لابی
            </Link>
          </div>
        </nav>
      </section>

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
