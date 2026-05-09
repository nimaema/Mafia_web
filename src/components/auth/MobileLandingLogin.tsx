import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function MobileLandingLogin() {
  return (
    <section className="pm-mobile-app-landing relative z-10 flex min-h-[100dvh] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)] md:hidden">
      <header className="motion-reveal mx-auto flex w-full max-w-sm items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)] shadow-[var(--pm-shadow-soft)]">
            <span className="material-symbols-outlined text-2xl text-[var(--pm-primary)]">theater_comedy</span>
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black leading-6">مافیا بورد</span>
            <span className="block text-[0.68rem] font-black text-[var(--pm-muted)]">اتاق بازی</span>
          </span>
        </Link>
        <ThemeToggle nav />
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">
        <div className="motion-pop pm-card p-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-4 py-8 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-[var(--radius-lg)] border border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)] shadow-[var(--pm-shadow-soft)]">
              <span className="material-symbols-outlined text-4xl">theater_comedy</span>
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight text-[var(--pm-text)]">خوش آمدید</h1>
            <p className="mx-auto mt-3 max-w-[15rem] text-sm font-bold leading-6 text-[var(--pm-muted)]">
              برای شروع، وارد شوید یا حساب جدید بسازید.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <Link href="/auth/login" className="pm-button-primary min-h-[3.35rem] w-full text-base">
              <span className="material-symbols-outlined text-xl">login</span>
              ورود
            </Link>
            <Link href="/auth/register" className="pm-button pm-button-secondary min-h-[3.35rem] w-full text-base">
              <span className="material-symbols-outlined text-xl">person_add</span>
              ثبت نام
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
