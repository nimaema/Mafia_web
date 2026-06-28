import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const ROLES = [
  { name: "پدرخوانده", tag: "مافیا", icon: "workspace_premium", tone: "var(--pm-danger)" },
  { name: "کارآگاه", tag: "شهر", icon: "search", tone: "var(--pm-blue)" },
  { name: "دکتر", tag: "شهر", icon: "health_and_safety", tone: "var(--pm-success)" },
  { name: "اسنایپر", tag: "شهر", icon: "gps_fixed", tone: "var(--pm-warning)" },
  { name: "ماتادور", tag: "مستقل", icon: "casino", tone: "var(--pm-violet)" },
];

const STEPS = [
  { k: "۰۱", t: "لابی بساز", d: "یک میز باز کن، کد بده، بازیکن‌ها سرِ میز بنشینند.", icon: "groups" },
  { k: "۰۲", t: "نقش‌ها را پخش کن", d: "سناریو را انتخاب کن؛ نقش‌ها مخفی و امن تقسیم می‌شوند.", icon: "playing_cards" },
  { k: "۰۳", t: "شب و روز را بچرخان", d: "شلیک، نجات، استعلام، رأی و اعدام — همه از یک کنسول.", icon: "dark_mode" },
  { k: "۰۴", t: "گزارش بگیر", d: "روایت کامل هر دور برای بازیکن‌ها منتشر می‌شود.", icon: "summarize" },
];

export default function Home() {
  return (
    <main className="app-page relative overflow-hidden" dir="rtl">
      {/* nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="مافیا بورد">
          <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--pm-primary)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]">
            <span className="material-symbols-outlined text-[1.4rem]">playing_cards</span>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-2xl font-bold text-[var(--pm-text)]">مافیا بورد</span>
            <span className="block text-[11px] font-bold text-[var(--pm-muted)]">اتاقِ بازی</span>
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <ThemeToggle compact />
          <Link href="/auth/login" className="pm-button-secondary min-h-11 px-4 text-sm">
            <span className="material-symbols-outlined text-xl">login</span>
            <span className="hidden sm:inline">ورود</span>
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <div className="max-w-2xl">
          <span className="pm-eyebrow">گردانندهٔ دیجیتالِ بازی مافیا</span>
          <h1 className="mt-5 font-display text-[clamp(3rem,9vw,6rem)] font-bold leading-[0.95] text-[var(--pm-text)]">
            بازی را اجرا کن،
            <br />
            <span className="bg-gradient-to-l from-[var(--pm-primary)] to-[var(--pm-blue)] bg-clip-text text-transparent">کاغذبازی با ما.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-9 text-[var(--pm-muted)]">
            لابی زنده، پخشِ امنِ نقش‌ها، چرخهٔ شب و روز و گزارشِ کامل هر دور — همه در یک کنسولِ سریع و روان. ساخته‌شده برای گرداننده‌ای که می‌خواهد فقط بازی کند.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="pm-button-primary min-h-12 px-6 text-base">
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              شروع کن
            </Link>
            <Link href="/auth/login" className="pm-button-secondary min-h-12 px-6 text-base">
              <span className="material-symbols-outlined text-xl">meeting_room</span>
              ورود به اتاق
            </Link>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-3">
            {[
              { v: "۱۲+", l: "نقشِ آماده" },
              { v: "∞", l: "لابی هم‌زمان" },
              { v: "۱۰۰٪", l: "گزارشِ دور" },
            ].map((s) => (
              <div key={s.l} className="pm-muted-card p-4">
                <p className="font-display text-3xl font-bold text-[var(--pm-text)]" dir="ltr">{s.v}</p>
                <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{s.l}</p>
              </div>
            ))}
          </dl>
        </div>

        {/* signature: a glowing role-card fan */}
        <div className="relative mx-auto flex min-h-[24rem] w-full max-w-sm items-center justify-center">
          <div className="pm-command relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden p-6">
            <div className="pm-aurora" />
            <div className="flex items-center justify-between">
              <span className="pm-eyebrow">کارتِ امشب</span>
              <span className="pm-chip pm-chip-danger">مافیا</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-24 place-items-center rounded-full border border-[var(--pm-danger)]/40 bg-[var(--pm-danger)]/12 text-[var(--pm-danger)] shadow-[0_0_40px_var(--pm-primary-glow)]">
                <span className="material-symbols-outlined text-[3rem]">local_fire_department</span>
              </span>
              <p className="font-display text-3xl font-bold text-[var(--pm-text)]">پدرخوانده</p>
              <p className="text-center text-sm font-semibold leading-6 text-[var(--pm-muted)]">سرِ مافیا؛ در استعلامِ کارآگاه، بی‌گناه دیده می‌شود.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="pm-muted-card px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-[var(--pm-muted)]">جبهه</p>
                <p className="font-black text-[var(--pm-danger)]">بدمن‌ها</p>
              </div>
              <div className="pm-muted-card px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-[var(--pm-muted)]">توانایی</p>
                <p className="font-black text-[var(--pm-text)]">شلیک شبانه</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* roles strip */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <span className="pm-eyebrow">نقش‌ها</span>
            <h2 className="mt-1.5 font-display text-3xl font-bold text-[var(--pm-text)]">هر کارت، یک سرنوشت</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ROLES.map((r) => (
            <div key={r.name} className="pm-card group relative overflow-hidden p-4">
              <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: r.tone }} />
              <span className="grid size-11 place-items-center rounded-[var(--radius-sm)] border" style={{ borderColor: `color-mix(in oklab, ${r.tone} 45%, transparent)`, background: `color-mix(in oklab, ${r.tone} 14%, transparent)`, color: r.tone }}>
                <span className="material-symbols-outlined text-xl">{r.icon}</span>
              </span>
              <p className="mt-3 font-display text-xl font-bold text-[var(--pm-text)]">{r.name}</p>
              <p className="text-xs font-bold" style={{ color: r.tone }}>{r.tag}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8">
        <div className="mb-5">
          <span className="pm-eyebrow">روندِ بازی</span>
          <h2 className="mt-1.5 font-display text-3xl font-bold text-[var(--pm-text)]">از لابی تا گزارش، در چهار قدم</h2>
        </div>
        <ol className="grid gap-3 md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.k} className="pm-card p-5">
              <div className="flex items-center justify-between">
                <span className="pm-icon-primary size-11"><span className="material-symbols-outlined text-xl">{s.icon}</span></span>
                <span className="font-display text-3xl font-bold text-[var(--pm-primary)]/40" dir="ltr">{s.k}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[var(--pm-text)]">{s.t}</h3>
              <p className="mt-1.5 text-[13px] font-semibold leading-7 text-[var(--pm-muted)]">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* final CTA */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        <div className="pm-command relative overflow-hidden rounded-[var(--radius-xl)] p-8 text-center sm:p-14">
          <div className="pm-aurora" />
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight text-[var(--pm-text)] sm:text-6xl">
            میزت آماده‌ست. <span className="bg-gradient-to-l from-[var(--pm-primary)] to-[var(--pm-blue)] bg-clip-text text-transparent">شروع کن.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="pm-button-primary min-h-12 px-7 text-base">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
              ساخت حساب
            </Link>
            <Link href="/auth/login" className="pm-button-secondary min-h-12 px-7 text-base">ورود به حساب</Link>
          </div>
        </div>
        <p className="mt-10 text-center text-xs font-bold text-[var(--pm-muted)]">مافیا بورد · ساخته‌شده برای گرداننده‌های ایرانی</p>
      </section>
    </main>
  );
}
