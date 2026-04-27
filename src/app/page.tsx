import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LobbyPreviewCard } from "@/components/game/LobbyPreviewCard";

const samplePlayers = [
  { id: "1", name: "پارسا" },
  { id: "2", name: "رها" },
  { id: "3", name: "امیر" },
  { id: "4", name: "آرزو" },
  { id: "5", name: "مانی" },
  { id: "6", name: "شایان" },
  { id: "7", name: "هستی" },
  { id: "8", name: "النا" },
];

const sampleRoles = [
  { id: "role-1", name: "شهروند ساده", count: 4, alignment: "CITIZEN" as const },
  { id: "role-2", name: "کارآگاه", count: 1, alignment: "CITIZEN" as const },
  { id: "role-3", name: "دکتر", count: 1, alignment: "CITIZEN" as const },
  { id: "role-4", name: "رئیس مافیا", count: 1, alignment: "MAFIA" as const },
  { id: "role-5", name: "سایلنسر", count: 1, alignment: "MAFIA" as const },
  { id: "role-6", name: "جوکر", count: 1, alignment: "NEUTRAL" as const },
];

const landingSignals = [
  { icon: "hub", title: "لابی منظم", text: "کد ورود، ظرفیت و بازیکنان در یک قاب روشن." },
  { icon: "account_tree", title: "سناریوی هماهنگ", text: "ترکیب نقش‌ها همان‌طور که در بازی استفاده می‌شود." },
  { icon: "verified_user", title: "ورود با حساب", text: "همه بازیکنان قبل از بازی ثبت‌نام می‌کنند." },
];

export default function Home() {
  return (
    <div className="app-page min-h-screen overflow-hidden" dir="rtl">
      <header className="app-container flex items-center justify-between py-4 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="ui-icon-accent">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black text-zinc-950 dark:text-white">مافیا بورد</p>
            <p className="ui-kicker">کنترل روم بازی</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/auth/login" className="ui-button-primary">
            <span className="material-symbols-outlined text-lg">login</span>
            ورود و شروع
          </Link>
        </div>
      </header>

      <main>
        <section className="relative border-y border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-zinc-950">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(132,204,22,0.10),transparent_34%),linear-gradient(225deg,rgba(14,165,233,0.10),transparent_30%)] dark:bg-[linear-gradient(135deg,rgba(132,204,22,0.13),transparent_34%),linear-gradient(225deg,rgba(14,165,233,0.10),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.045)_1px,transparent_1px)] bg-[size:44px_44px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

          <div className="app-container relative py-8 sm:py-10 lg:py-12">
            <div className="max-w-3xl">
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 text-sm font-black text-zinc-700 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200">
                <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">bolt</span>
                کنترل روم بازی‌های مافیا
              </div>

              <h1 className="mt-5 text-5xl font-black leading-tight text-zinc-950 dark:text-white sm:text-6xl lg:text-7xl">
                مافیا بورد
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                یک نمای مرتب برای ساخت لابی، انتخاب سناریو و اجرای بازی؛ بدون شلوغی اضافه و با همان زبان بصری که داخل پنل‌ها می‌بینید.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/auth/login" className="ui-button-primary min-h-12 px-5 text-base">
                  <span className="material-symbols-outlined text-xl">login</span>
                  ورود و شروع
                </Link>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-bold text-zinc-500 backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-400">
                  <span className="size-2 rounded-full bg-lime-500" />
                  ثبت‌نام برای همه بازیکنان
                </div>
              </div>
            </div>

            <div className="relative mt-8 max-w-5xl">
              <div className="pointer-events-none absolute -inset-x-4 bottom-8 top-10 rounded-lg border border-zinc-200/80 bg-zinc-100/70 shadow-2xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-black/30" />
              <div className="relative">
                <LobbyPreviewCard
                  title="شب معارفه"
                  subtitle="یک پیش‌نمایش جمع‌وجور از همان لابی واقعی."
                  scenarioName="کلاسیک ۹ نفره"
                  code="402981"
                  statusLabel="در انتظار شروع"
                  playerCount={samplePlayers.length}
                  capacity={9}
                  moderatorName="گرداننده حرفه‌ای"
                  players={samplePlayers}
                  roleBreakdown={sampleRoles}
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        <section className="app-container grid gap-3 py-5 sm:grid-cols-3 sm:py-6">
          {landingSignals.map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-black/20">
              <div className="flex items-start gap-3">
                <div className="ui-icon">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <div>
                  <h2 className="font-black text-zinc-950 dark:text-white">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
