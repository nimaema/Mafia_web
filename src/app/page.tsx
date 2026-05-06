import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const desktopSignals = [
  { icon: "stadia_controller", label: "لابی زنده", value: "کنترل سریع" },
  { icon: "account_tree", label: "سناریو", value: "قابل تنظیم" },
  { icon: "edit_note", label: "گزارش", value: "روز و شب" },
];

const desktopFlows = [
  { icon: "groups", title: "بازیکن‌ها", text: "ورود امن، نقش، تاریخچه و گزارش‌های منتشرشده." },
  { icon: "timer", title: "گرداننده", text: "لابی، تایمر، ثبت وقایع و نتیجه نهایی در یک اتاق فرمان." },
  { icon: "admin_panel_settings", title: "مدیر", text: "کنترل کاربران، نقش‌ها، سناریوها، بکاپ و آرشیو بازی‌ها." },
];

export default function Home() {
  return (
    <main className="app-page min-h-screen overflow-hidden text-zinc-950 dark:text-white" dir="rtl">
      <section className="fixed inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,168,150,0.16),transparent_16rem),radial-gradient(circle_at_bottom,rgba(109,93,246,0.12),transparent_17rem),linear-gradient(135deg,#f8fbfd_0%,#edf4f8_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,rgba(0,245,212,0.1),transparent_16rem),radial-gradient(circle_at_bottom,rgba(139,92,246,0.08),transparent_17rem),linear-gradient(135deg,#15171b_0%,#101216_100%)] md:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.9),transparent_14rem)] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.035),transparent_14rem)]" />
        <div className="relative z-10 flex w-full max-w-xs flex-col items-center text-center">
          <div className="motion-pop grid size-24 place-items-center rounded-[2rem] border border-cyan-500/15 bg-white/80 shadow-2xl shadow-cyan-900/10 backdrop-blur-2xl dark:border-white/12 dark:bg-white/[0.07] dark:shadow-cyan-500/10">
            <span className="material-symbols-outlined text-5xl text-cyan-700 dark:text-cyan-200">theater_comedy</span>
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight">مافیا بورد</h1>
          <p className="mt-3 whitespace-nowrap text-sm font-bold text-zinc-600 dark:text-white/68">اتاق فرمان ساده، سریع و امن بازی مافیا</p>
          <Link href="/auth/login" className="pm-button pm-button-primary mt-8 min-h-14 w-full text-base">
            <span className="material-symbols-outlined text-xl">login</span>
            ورود
          </Link>
        </div>
      </section>

      <div className="hidden min-h-screen md:block">
        <header className="app-container relative z-10 flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="pm-icon-primary">
              <span className="material-symbols-outlined text-xl">theater_comedy</span>
            </div>
            <div>
              <p className="text-lg font-black">مافیا بورد</p>
              <p className="text-[11px] font-black text-cyan-700 dark:text-cyan-200/80">PlayMafia Command</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/auth/login" className="pm-button pm-button-primary">
              <span className="material-symbols-outlined text-lg">login</span>
              ورود
            </Link>
          </div>
        </header>

        <section className="app-container relative z-10 grid min-h-[calc(100vh-5rem)] items-center gap-10 pb-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)]">
          <div className="motion-reveal">
            <div className="pm-chip pm-chip-primary">
              <span className="material-symbols-outlined text-base">bolt</span>
              سیستم اجرای بازی مافیا
            </div>
            <h1 className="mt-5 max-w-3xl text-6xl font-black leading-[1.12] lg:text-7xl">
              مافیا بورد
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-bold leading-9 text-zinc-600 dark:text-white/68">
              لابی، سناریو، تایمر، نقش‌ها و گزارش نهایی در یک تجربه یکپارچه برای بازیکن، گرداننده و مدیر.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/auth/login" className="pm-button pm-button-primary min-h-12 px-6 text-base">
                <span className="material-symbols-outlined text-xl">login</span>
                ورود به اپ
              </Link>
              <span className="pm-chip">
                <span className="material-symbols-outlined text-base text-emerald-300">verified_user</span>
                فقط کاربران ثبت‌نام‌شده
              </span>
            </div>

            <div className="motion-list mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {desktopSignals.map((item) => (
                <div key={item.label} className="pm-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="material-symbols-outlined text-2xl text-cyan-200">{item.icon}</span>
                    <span className="text-lg font-black">{item.value}</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-zinc-500 dark:text-white/50">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="pm-command pm-aurora motion-reveal p-4">
            <div className="relative z-10 grid gap-4">
              <div className="rounded-[1.2rem] border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">CONTROL ROOM</p>
                    <h2 className="mt-2 text-3xl font-black">نمای اجرای بازی</h2>
                    <p className="mt-2 max-w-xl text-sm font-bold leading-7 text-zinc-600 dark:text-white/58">
                      تجربه اصلی از همان ابتدا شبیه اپ طراحی شده: روشن، کم‌حاشیه و آماده استفاده وسط بازی.
                    </p>
                  </div>
                  <span className="material-symbols-outlined grid size-14 place-items-center rounded-2xl bg-cyan-300 text-3xl text-zinc-950">dashboard</span>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {desktopFlows.map((item) => (
                  <div key={item.title} className="rounded-[1.2rem] border border-zinc-200 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.055]">
                    <span className="material-symbols-outlined grid size-11 place-items-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-700 dark:bg-white/10 dark:text-cyan-100">{item.icon}</span>
                    <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-zinc-600 dark:text-white/54">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.2rem] border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-black text-cyan-700 dark:text-cyan-100">آماده برای موبایل و دسکتاپ</p>
                    <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-white/48">ناوبری پایین موبایل، پنل کناری دسکتاپ و پنجره‌های امن برای همه فرم‌ها.</p>
                  </div>
                  <Link href="/auth/login" className="pm-button pm-button-secondary bg-white text-zinc-950">
                    شروع
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
