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

export default function Home() {
  return (
    <div className="app-page flex min-h-screen flex-col" dir="rtl">
      <header className="app-container flex items-center justify-between py-5">
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
            ورود و شروع
          </Link>
        </div>
      </header>

      <main className="app-container grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="flex max-w-2xl flex-col gap-5">
          <div className="ui-muted inline-flex w-fit items-center gap-2 px-3 py-2">
            <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">bolt</span>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ساده برای اجرا، دقیق برای مدیریت</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
              مدیریت بازی مافیا، تمیزتر و هماهنگ‌تر.
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-400 sm:text-lg">
              لابی بسازید، سناریو بچینید، بازیکنان را جمع کنید و همه جزئیات بازی را با همان نمایی که در داشبورد می‌بینید دنبال کنید.
            </p>
          </div>

        </section>

        <LobbyPreviewCard
          title="شب معارفه"
          subtitle="یک نمای کوتاه از همان جزئیات واقعی لابی."
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
      </main>
    </div>
  );
}
