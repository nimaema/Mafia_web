import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: "groups", title: "لابی زنده", text: "کد اختصاصی، ظرفیت بازیکن و وضعیت بازی در یک نمای سریع." },
  { icon: "account_tree", title: "سناریوی دقیق", text: "نقش‌ها، تعداد نفرات و چینش بازی برای گرداننده شفاف می‌ماند." },
  { icon: "analytics", title: "گزارش عملکرد", text: "تاریخچه بازی، برد و باخت و نقش‌های قبلی بازیکنان ثبت می‌شود." },
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
          <div className="hidden w-36 sm:block">
            <ThemeToggle />
          </div>
          <Link href="/auth/login" className="ui-button-secondary">
            ورود
          </Link>
          <Link href="/auth/register" className="ui-button-primary hidden sm:inline-flex">
            شروع
          </Link>
        </div>
      </header>

      <main className="app-container grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_520px]">
        <section className="flex max-w-2xl flex-col gap-6">
          <div className="ui-muted inline-flex w-fit items-center gap-2 px-3 py-2">
            <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">bolt</span>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">برای گرداننده‌ها و بازیکنان جدی</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
              مدیریت بازی مافیا، منظم‌تر و سریع‌تر.
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-400 sm:text-lg">
              لابی بسازید، بازیکنان را هماهنگ کنید، نقش‌ها را مخفی توزیع کنید و بعد از بازی همه چیز را در داشبورد ببینید.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="ui-button-primary min-h-12 px-6">
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              شروع بازی
            </Link>
            <Link href="/auth/login" className="ui-button-secondary min-h-12 px-6">
              ورود به حساب
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="ui-card p-4">
                <span className="material-symbols-outlined mb-3 text-lime-600 dark:text-lime-400">{feature.icon}</span>
                <h2 className="mb-1 font-black text-zinc-950 dark:text-white">{feature.title}</h2>
                <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="ui-kicker">لابی فعال</p>
                <h2 className="text-xl font-black text-zinc-950 dark:text-white">شب معارفه</h2>
              </div>
              <span className="rounded-lg bg-lime-500 px-3 py-1 text-sm font-black text-zinc-950">8/12</span>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-3 gap-3">
              {["کد", "سناریو", "وضعیت"].map((label, index) => (
                <div key={label} className="ui-muted p-3">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                  <p className="mt-1 font-black text-zinc-950 dark:text-white">
                    {index === 0 ? "#402" : index === 1 ? "کلاسیک" : "در انتظار"}
                  </p>
                </div>
              ))}
            </div>

            <div className="ui-muted p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-black text-zinc-950 dark:text-white">ترکیب نقش‌ها</p>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">12 نفره</span>
              </div>
              <div className="space-y-3">
                {[
                  ["شهروند", "7", "bg-sky-500"],
                  ["مافیا", "4", "bg-red-500"],
                  ["مستقل", "1", "bg-amber-500"],
                ].map(([name, count, color]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="flex-1 text-sm font-bold text-zinc-700 dark:text-zinc-300">{name}</span>
                    <span className="text-sm font-black text-zinc-950 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="ui-muted flex aspect-square items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-400">person</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
