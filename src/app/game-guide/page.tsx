import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "راهنمای بازی مافیا | مافیا بورد",
  description: "راهنمای اجرای بازی مافیا با لابی، نقش‌ها، تایمر، رای‌گیری، توانایی‌های شب و گزارش نهایی در مافیا بورد.",
  alternates: {
    canonical: "/game-guide",
  },
  openGraph: {
    title: "راهنمای بازی مافیا | مافیا بورد",
    description: "راهنمای اجرای بازی مافیا با لابی، نقش‌ها، تایمر، رای‌گیری، توانایی‌های شب و گزارش نهایی.",
    url: "/game-guide",
    locale: "fa_IR",
    type: "article",
  },
};

const guideSections = [
  {
    icon: "login",
    title: "ورود و آماده‌سازی",
    text: "همه بازیکن‌ها باید حساب داشته باشند. ورود مهمان وجود ندارد. ثبت‌نام با گوگل ایمیل را تاییدشده ثبت می‌کند؛ ثبت‌نام با ایمیل نیاز به تایید ایمیل دارد.",
    points: ["ساخت حساب یا ورود با گوگل", "تایید ایمیل قبل از ورود کامل", "تکمیل نام و تصویر پروفایل", "ورود به داشبورد و انتخاب لابی"],
  },
  {
    icon: "groups",
    title: "لابی و شروع بازی",
    text: "گرداننده لابی را می‌سازد، سناریو را انتخاب یا شخصی‌سازی می‌کند و بازیکن‌ها بعد از ورود، کارت بازی فعال را در داشبورد می‌بینند.",
    points: ["انتخاب سناریوی آماده یا سفارشی", "هماهنگی تعداد نقش‌ها با تعداد بازیکن", "قفل شدن ظرفیت بعد از تکمیل", "انتقال خودکار بازیکنان به بازی بعد از شروع"],
  },
  {
    icon: "account_tree",
    title: "سناریو و نقش‌ها",
    text: "هر سناریو ترکیبی از نقش‌ها، جبهه‌ها و توانایی‌های شبانه است. بعضی نقش‌ها مثل پدرخوانده می‌توانند در سناریوهای مختلف توانایی متفاوت داشته باشند.",
    points: ["جبهه شهروند، مافیا یا مستقل", "تعداد هدف در هر استفاده از توانایی", "محدودیت استفاده در کل بازی یا هر شب", "امکان تغییر جبهه بازیکن در گزارش نهایی"],
  },
  {
    icon: "timer",
    title: "روز، چالش و رای‌گیری",
    text: "بازی با روز اول شروع می‌شود. گرداننده می‌تواند تایمر صحبت اصلی و تایمر چالش را کنترل کند و اتفاقات روز را مرحله‌به‌مرحله ثبت کند.",
    points: ["شروع و توقف تایمر اصلی", "تایمر جدا برای چالش", "ثبت دفاع‌ها و رای‌ها", "ثبت خروج با رای، تفنگ یا روش سناریویی"],
  },
  {
    icon: "dark_mode",
    title: "شب و توانایی‌ها",
    text: "در شب، گرداننده برای نقش‌های دارای توانایی، بازیکن هدف را از پنجره انتخاب بازیکن ثبت می‌کند. اگر توانایی استفاده نشود، نیازی به شلوغ کردن گزارش نیست.",
    points: ["شلیک مافیا یا انتخاب بدون شلیک", "ذخیره دکتر و محدودیت ذخیره خودش", "توانایی‌هایی مثل یاکوزا، خریداری و بازپرسی", "ثبت چند هدف برای نقش‌هایی مثل تفنگدار یا بازپرس"],
  },
  {
    icon: "summarize",
    title: "گزارش و تاریخچه",
    text: "بعد از پایان بازی، نتیجه، نقش‌ها، جبهه نهایی، اتفاقات روز و شب و گزارش منتشرشده در تاریخچه بازیکنان باقی می‌ماند.",
    points: ["انتخاب برنده توسط گرداننده", "قابل ویرایش بودن گزارش بعد از پایان", "انتشار عمومی گزارش برای بازیکنان همان بازی", "حفظ تاریخچه حتی اگر بازی اصلی حذف شود"],
  },
];

const phaseRows = [
  ["روز اول", "معرفی فضای بازی، صحبت آزاد، آماده‌سازی ذهنی و ثبت اتفاقات روز اگر لازم باشد."],
  ["شب اول", "گرداننده نقش‌ها را اجرا می‌کند و توانایی‌ها را با انتخاب بازیکن ثبت می‌کند."],
  ["روزهای بعد", "بحث، دفاع، رای‌گیری و حذف احتمالی بازیکن‌ها ثبت می‌شود."],
  ["شب‌های بعد", "توانایی‌ها بر اساس محدودیت سناریو ادامه پیدا می‌کند؛ اگر بازیکنی حذف شود در فهرست مرده‌ها می‌رود."],
  ["پایان بازی", "برنده بر اساس وضعیت نهایی جبهه‌ها ثبت می‌شود و گزارش قابل انتشار است."],
];

const quickRules = [
  "بازیکن حذف‌شده در فهرست پایین‌تر نمایش داده می‌شود و در تصمیم‌های بعدی نقش فعال ندارد.",
  "اگر بازیکن با شلیک مافیا هدف قرار بگیرد، گرداننده در پایان شب مرگ یا زنده‌ماندن او را تایید می‌کند.",
  "اگر مافیا از توانایی‌هایی مثل ناتو، یاکوزا یا خریداری استفاده کند، ممکن است همان شب شلیک معمولی نداشته باشد.",
  "برد یا باخت بازیکن بر اساس جبهه نهایی او محاسبه می‌شود، نه صرفا جبهه شروع بازی.",
  "گزارش خوب باید اتفاقات استفاده‌شده را واضح نشان دهد، اما استفاده‌نشدن هر گزینه را بی‌دلیل شلوغ نکند.",
];

export default function GameGuidePage() {
  return (
    <main className="app-page min-h-screen overflow-hidden text-zinc-950 dark:text-white" dir="rtl">
      <header className="app-container relative z-10 flex items-center justify-between gap-3 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="pm-icon-primary">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black">مافیا بورد</p>
            <p className="text-[11px] font-black text-cyan-700 dark:text-cyan-200">راهنمای بازی</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/dashboard/user" className="pm-button pm-button-secondary min-h-10 px-3 text-xs sm:px-4 sm:text-sm">
            داشبورد
            <span className="material-symbols-outlined text-lg">dashboard</span>
          </Link>
        </div>
      </header>

      <section className="app-container relative z-10 grid gap-6 pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center">
        <div className="motion-reveal">
          <div className="pm-chip pm-chip-primary">
            <span className="material-symbols-outlined text-base">menu_book</span>
            راهنمای کامل اجرا
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            از ورود تا گزارش نهایی، بازی را بدون ابهام اجرا کنید.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-zinc-600 dark:text-white/58">
            این صفحه هم جریان استفاده از اپ را توضیح می‌دهد، هم منطق اجرای مافیا در روز، شب، رای‌گیری، توانایی‌ها و تاریخچه را.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="pm-chip pm-chip-success">بدون مهمان</span>
            <span className="pm-chip pm-chip-primary">سناریوی قابل تنظیم</span>
            <span className="pm-chip pm-chip-warning">گزارش روز و شب</span>
          </div>
        </div>

        <aside className="pm-command pm-aurora motion-pop p-4">
          <div className="relative z-10 grid gap-3">
            {phaseRows.map(([phase, text], index) => (
              <div key={phase} className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3 rounded-2xl border border-zinc-200 bg-white/72 p-3 dark:border-white/10 dark:bg-black/20">
                <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/10 text-sm font-black text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
                  {index + 1}
                </span>
                <div>
                  <p className="font-black">{phase}</p>
                  <p className="mt-1 text-xs font-bold leading-6 text-zinc-600 dark:text-white/52">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="app-container pb-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {guideSections.map((section) => (
            <article key={section.title} className="pm-card motion-surface overflow-hidden p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined grid size-12 place-items-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
                  {section.icon}
                </span>
                <div>
                  <h2 className="text-xl font-black">{section.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-zinc-600 dark:text-white/54">{section.text}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {section.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-white/65 px-3 py-2 text-sm font-bold leading-6 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
                    <span className="material-symbols-outlined mt-0.5 text-base text-cyan-600 dark:text-cyan-300">check_circle</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-container pb-16">
        <div className="pm-command p-5">
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="pm-kicker">نکات مهم اجرای سالم</p>
              <h2 className="mt-2 text-2xl font-black">چیزهایی که وسط بازی نباید گم شوند</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-zinc-600 dark:text-white/54">
                این قواعد کمک می‌کند گزارش نهایی هم خوانا باشد، هم نتیجه و وضعیت بازیکنان را درست حساب کند.
              </p>
            </div>
            <div className="grid gap-2">
              {quickRules.map((rule) => (
                <div key={rule} className="rounded-2xl border border-zinc-200 bg-white/70 p-3 text-sm font-bold leading-7 text-zinc-700 dark:border-white/10 dark:bg-black/18 dark:text-white/68">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
