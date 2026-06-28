import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SeatRing } from "@/components/game/SeatRing";

const SEATED_GUESTS = ["آرش", "نگار", "سهراب", "مونا", "بابک", "تینا", "کاوه", "رها"].map((name) => ({ name, isAlive: true }));

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
            <p className="font-display text-2xl font-bold leading-6 text-[var(--pm-text)]">مافیا بورد</p>
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
          <span className="pm-eyebrow">میز در انتظار</span>
          <h1 className="mt-4 max-w-2xl font-display text-6xl font-bold leading-[1.04] text-[var(--pm-text)]">
            یک صندلی سرِ میز، <span className="text-[var(--pm-primary)]">به نامِ توست.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-bold leading-8 text-[var(--pm-muted)]">
            وارد شو تا بنشینی پشت میز: لابی زنده، نقشِ مخفی و گزارشِ هر شب — همه آمادهٔ توست.
          </p>

          <div className="mt-7 grid items-center gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="pm-card rounded-[var(--radius-xl)] p-5">
              <SeatRing
                capacity={SEATED_GUESTS.length + 1}
                players={SEATED_GUESTS}
                center={
                  <div>
                    <span className="material-symbols-outlined text-2xl text-[var(--pm-primary)]">chair</span>
                    <p className="mt-1 font-display text-xl font-bold text-[var(--pm-text)]">میزِ شب</p>
                    <p className="text-[11px] font-bold text-[var(--pm-muted)]">یک جای خالی</p>
                  </div>
                }
              />
            </div>
            <div className="motion-list grid gap-2.5">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
                  <span className="pm-icon size-10 shrink-0 border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold leading-tight text-[var(--pm-text)]">{item.title}</h2>
                    <p className="mt-0.5 text-xs font-bold leading-5 text-[var(--pm-muted)]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="motion-pop mx-auto w-full max-w-[440px] pm-card p-4 sm:p-5">
          <header className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--pm-text)]">{title}</h2>
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
