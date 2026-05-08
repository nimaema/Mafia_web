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
    <div className="app-page min-h-screen overflow-hidden text-[var(--pm-text)]" dir="rtl">
      <header className="app-container relative z-20 flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="pm-icon size-11 text-[var(--pm-primary)] border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black text-[var(--pm-text)]">مافیا بورد</p>
            <p className="text-[11px] font-black tracking-wider text-[var(--pm-primary)] opacity-80">ورود به اتاق فرمان</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/" className="pm-button-secondary min-h-10 px-3 text-xs shadow-none sm:px-4 sm:text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            خانه
          </Link>
        </div>
      </header>

      <main className="app-container relative z-10 grid min-h-[calc(100dvh-5.25rem)] items-center gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="motion-reveal hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-3 py-1.5 text-sm font-black text-[var(--pm-primary)]">
            <span className="material-symbols-outlined text-base">lock_open</span>
            دسترسی حساب
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-[var(--pm-text)]">
            یک ورود کوتاه؛ بعدش مستقیم به لابی، نقش و گزارش بازی.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 pm-muted-card text-[var(--pm-text)] opacity-90">
            فرم‌ها جمع‌وجور شده‌اند تا آیکن، فیلد و متن‌ها فاصله اضافه نداشته باشند و روی موبایل مثل یک اپ واقعی حس شوند.
          </p>

          <div className="motion-list mt-8 grid gap-3 xl:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="pm-card p-4">
                <span className="material-symbols-outlined pm-icon size-11 text-[var(--pm-primary)] border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-2xl">{item.icon}</span>
                <h2 className="mt-4 font-black text-[var(--pm-text)]">{item.title}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[var(--pm-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="motion-pop mx-auto w-full max-w-[440px] pm-card p-4 sm:p-5">
          <header className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-[var(--pm-text)]">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--pm-muted)]">{subtitle}</p>
          </header>

          {activeTab && (
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-1">
              {activeTab === "login" ? (
                <>
                  <button className="pm-button-primary rounded-[var(--radius-sm)] py-2.5 text-sm">
                    ورود
                  </button>
                  <Link href="/auth/register" className="pm-button-secondary rounded-[var(--radius-sm)] py-2.5 text-sm border-transparent bg-transparent shadow-none hover:bg-[var(--pm-surface)] text-center">
                    ثبت نام
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="pm-button-secondary rounded-[var(--radius-sm)] py-2.5 text-sm border-transparent bg-transparent shadow-none hover:bg-[var(--pm-surface)] text-center">
                    ورود
                  </Link>
                  <button className="pm-button-primary rounded-[var(--radius-sm)] py-2.5 text-sm">
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
