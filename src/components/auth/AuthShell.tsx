import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthShellProps = {
  icon: string;
  title: string;
  subtitle: string;
  activeTab?: "login" | "register";
  children: ReactNode;
  footer?: ReactNode;
};

const highlights = [
  { icon: "verified_user", title: "ورود امن", text: "همه بازیکن‌ها قبل از بازی حساب دارند." },
  { icon: "account_tree", title: "سناریوی زنده", text: "نقش‌ها و توانایی‌ها بعد از ورود آماده‌اند." },
  { icon: "phone_iphone", title: "موبایل‌محور", text: "فرم‌ها برای لمس و صفحه کوچک بازطراحی شده‌اند." },
];

export function AuthShell({ icon, title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <div className="app-page min-h-screen overflow-hidden text-zinc-950 dark:text-white" dir="rtl">
      <header className="app-container relative z-20 flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="pm-icon-primary size-11">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black">مافیا بورد</p>
            <p className="text-[11px] font-black text-cyan-700 dark:text-cyan-200/80">ورود به اتاق فرمان</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/" className="pm-button pm-button-secondary min-h-10 px-3 text-xs shadow-none sm:px-4 sm:text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            خانه
          </Link>
        </div>
      </header>

      <main className="app-container relative z-10 grid min-h-[calc(100dvh-5.25rem)] items-center gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="motion-reveal hidden lg:block">
          <div className="pm-chip pm-chip-primary">
            <span className="material-symbols-outlined text-base">lock_open</span>
            دسترسی حساب
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight">
            یک ورود کوتاه؛ بعدش مستقیم به لابی، نقش و گزارش بازی.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-zinc-600 dark:text-white/58">
            فرم‌ها جمع‌وجور شده‌اند تا آیکن، فیلد و متن‌ها فاصله اضافه نداشته باشند و روی موبایل مثل یک اپ واقعی حس شوند.
          </p>

          <div className="motion-list mt-8 grid gap-3 xl:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[1.25rem] border border-zinc-200 bg-white/80 p-4 shadow-2xl shadow-zinc-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/10">
                <span className="material-symbols-outlined grid size-11 place-items-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">{item.icon}</span>
                <h2 className="mt-4 font-black">{item.title}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-zinc-600 dark:text-white/52">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="motion-pop mx-auto w-full max-w-[440px] overflow-hidden rounded-3xl border border-zinc-200 bg-white/88 p-4 text-zinc-950 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/80 dark:text-white dark:shadow-black/40 sm:p-5">
          <header className="rounded-3xl border border-zinc-200 bg-white/72 p-4 text-center dark:border-white/10 dark:bg-black/30">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/12 dark:text-cyan-100">
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-600 dark:text-white/54">{subtitle}</p>
          </header>

          {activeTab && (
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-white/10 dark:bg-black/22">
              {activeTab === "login" ? (
                <>
                  <button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-zinc-950 shadow-lg shadow-cyan-900/10 dark:bg-white dark:text-zinc-950 dark:shadow-black/20">
                    ورود
                  </button>
                  <Link href="/auth/register" className="rounded-xl px-4 py-2.5 text-center text-sm font-black text-zinc-500 transition-colors hover:bg-white hover:text-zinc-950 dark:text-white/52 dark:hover:bg-white/[0.08] dark:hover:text-white">
                    ثبت نام
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded-xl px-4 py-2.5 text-center text-sm font-black text-zinc-500 transition-colors hover:bg-white hover:text-zinc-950 dark:text-white/52 dark:hover:bg-white/[0.08] dark:hover:text-white">
                    ورود
                  </Link>
                  <button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-zinc-950 shadow-lg shadow-cyan-900/10 dark:bg-white dark:text-zinc-950 dark:shadow-black/20">
                    ثبت نام
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-5">{children}</div>
          {footer && <div className="mt-5">{footer}</div>}
        </section>
      </main>
    </div>
  );
}
