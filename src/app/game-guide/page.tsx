import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

type GuideAlignment = "CITIZEN" | "MAFIA" | "NEUTRAL";

function alignmentLabel(alignment?: string | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment?: string | null) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function alignmentIcon(alignment?: string | null) {
  if (alignment === "CITIZEN") return "verified_user";
  if (alignment === "MAFIA") return "local_police";
  return "casino";
}

function roleCountLabel(count: number) {
  return count > 1 ? `${count} نفر` : "۱ نفر";
}

async function getGuideLibrary() {
  try {
    const [roles, scenarios] = await Promise.all([
      prisma.mafiaRole.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          alignment: true,
        },
        orderBy: [{ alignment: "asc" }, { name: "asc" }],
      }),
      prisma.scenario.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          roles: {
            select: {
              count: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  alignment: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return { roles, scenarios, unavailable: false };
  } catch {
    return { roles: [], scenarios: [], unavailable: true };
  }
}

export default async function GameGuidePage() {
  const { roles, scenarios, unavailable } = await getGuideLibrary();
  const roleGroups = (["CITIZEN", "MAFIA", "NEUTRAL"] as GuideAlignment[])
    .map((alignment) => ({
      alignment,
      roles: roles.filter((role) => role.alignment === alignment),
    }))
    .filter((group) => group.roles.length > 0);

  return (
    <main className="app-page min-h-screen overflow-hidden text-[var(--pm-text)]" dir="rtl">
      <header className="app-container relative z-10 flex items-center justify-between gap-3 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="pm-icon-primary">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black">مافیا بورد</p>
            <p className="text-[11px] font-black text-cyan-700 dark:text-[var(--pm-primary)]">راهنمای بازی</p>
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
          <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[var(--pm-muted)] dark:text-white/58">
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
              <div key={phase} className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3 rounded-2xl border border-[var(--pm-line)] bg-white/72 p-3 dark:border-[var(--pm-line)] dark:bg-black/20">
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--pm-primary)]/10 text-sm font-black text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
                  {index + 1}
                </span>
                <div>
                  <p className="font-black">{phase}</p>
                  <p className="mt-1 text-xs font-bold leading-6 text-[var(--pm-muted)] dark:text-white/52">{text}</p>
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
                <span className="material-symbols-outlined grid size-12 place-items-center rounded-2xl bg-[var(--pm-primary)]/10 text-2xl text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
                  {section.icon}
                </span>
                <div>
                  <h2 className="text-xl font-black">{section.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[var(--pm-muted)] dark:text-white/54">{section.text}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {section.points.map((point) => (
                  <div key={point} className="flex items-start gap-2 rounded-xl border border-[var(--pm-line)] bg-white/65 px-3 py-2 text-sm font-bold leading-6 text-zinc-700 dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-white/68">
                    <span className="material-symbols-outlined mt-0.5 text-base text-[var(--pm-primary)] dark:text-[var(--pm-primary)]">check_circle</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-container pb-12">
        <div className="pm-command overflow-hidden p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="border-b border-[var(--pm-line)] p-5 dark:border-[var(--pm-line)] xl:border-b-0 xl:border-l">
              <p className="pm-kicker">کتابخانه عمومی بازی</p>
              <h2 className="mt-2 text-2xl font-black">نقش‌ها و سناریوها برای بازیکنان</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[var(--pm-muted)] dark:text-white/54">
                این بخش همان اطلاعاتی را نشان می‌دهد که بازیکن عادی برای شناخت سناریوها، تعداد نقش‌ها و توضیح کلی هر نقش لازم دارد؛ بدون نیاز به ورود به صفحات مدیریتی.
              </p>

              {unavailable ? (
                <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-bold leading-7 text-amber-700 dark:text-amber-300">
                  کتابخانه نقش‌ها و سناریوها فعلاً قابل بارگذاری نیست. بعد از اتصال دیتابیس، همین بخش به‌صورت خودکار از اطلاعات فعلی سایت پر می‌شود.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3">
                    <p className="text-2xl font-black text-[var(--pm-primary)]">{roles.length}</p>
                    <p className="mt-1 text-[10px] font-black text-cyan-700/70 dark:text-[var(--pm-primary)]/70">نقش ثبت‌شده</p>
                  </div>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                    <p className="text-2xl font-black text-violet-700 dark:text-violet-300">{scenarios.length}</p>
                    <p className="mt-1 text-[10px] font-black text-violet-700/70 dark:text-violet-300/70">سناریو</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 sm:col-span-1">
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {scenarios.reduce((max, scenario) => Math.max(max, scenario.roles.reduce((sum, item) => sum + item.count, 0)), 0)}
                    </p>
                    <p className="mt-1 text-[10px] font-black text-emerald-700/70 dark:text-emerald-300/70">بیشترین ظرفیت</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-0 lg:grid-cols-2 xl:min-h-[620px]">
              <div className="border-b border-[var(--pm-line)] p-4 dark:border-[var(--pm-line)] lg:border-b-0 lg:border-l">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-[var(--pm-primary)]">راهنمای نقش‌ها</p>
                    <h3 className="mt-1 text-lg font-black">نقش‌ها بر اساس جبهه</h3>
                  </div>
                  <span className="material-symbols-outlined grid size-10 place-items-center rounded-2xl bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">theater_comedy</span>
                </div>

                <div className="custom-scrollbar mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
                  {roleGroups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--pm-line)] p-5 text-center text-sm font-bold text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:text-[var(--pm-muted)]">
                      نقشی برای نمایش پیدا نشد.
                    </div>
                  ) : (
                    roleGroups.map((group) => (
                      <section key={group.alignment} className="overflow-hidden rounded-2xl border border-[var(--pm-line)] bg-white/62 dark:border-[var(--pm-line)] dark:bg-black/18">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 px-3 py-2.5 dark:border-[var(--pm-line)] dark:bg-white/[0.035]">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined grid size-9 place-items-center rounded-xl border text-lg ${alignmentClass(group.alignment)}`}>
                              {alignmentIcon(group.alignment)}
                            </span>
                            <p className="font-black">{alignmentLabel(group.alignment)}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${alignmentClass(group.alignment)}`}>
                            {group.roles.length} نقش
                          </span>
                        </div>
                        <div className="grid gap-2 p-2">
                          {group.roles.map((role) => (
                            <article key={role.id} className="rounded-2xl border border-[var(--pm-line)] bg-white p-3 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/55">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="break-words text-sm font-black leading-6 text-[var(--pm-text)]">{role.name}</h4>
                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-4 text-xs font-bold leading-6 text-[var(--pm-muted)] dark:text-white/58">
                                {role.description || "توضیحی برای این نقش ثبت نشده است."}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-violet-700 dark:text-violet-300">راهنمای سناریوها</p>
                    <h3 className="mt-1 text-lg font-black">ترکیب و توضیح سناریو</h3>
                  </div>
                  <span className="material-symbols-outlined grid size-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300">account_tree</span>
                </div>

                <div className="custom-scrollbar mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {scenarios.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--pm-line)] p-5 text-center text-sm font-bold text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:text-[var(--pm-muted)]">
                      سناریویی برای نمایش پیدا نشد.
                    </div>
                  ) : (
                    scenarios.map((scenario) => {
                      const totalPlayers = scenario.roles.reduce((sum, item) => sum + item.count, 0);
                      const roleSummary = scenario.roles
                        .slice()
                        .sort((left, right) => {
                          const leftAlignment = left.role?.alignment || "NEUTRAL";
                          const rightAlignment = right.role?.alignment || "NEUTRAL";
                          return leftAlignment.localeCompare(rightAlignment, "fa") || left.role.name.localeCompare(right.role.name, "fa");
                        });

                      return (
                        <article key={scenario.id} className="overflow-hidden rounded-2xl border border-[var(--pm-line)] bg-white shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/55">
                          <div className="border-b border-[var(--pm-line)] bg-zinc-50/80 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.035]">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="break-words text-base font-black leading-7 text-[var(--pm-text)]">{scenario.name}</h4>
                              <span className="shrink-0 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
                                {totalPlayers || "؟"} نفر
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-3 text-xs font-bold leading-6 text-[var(--pm-muted)] dark:text-white/58">
                              {scenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-3">
                            {roleSummary.length ? (
                              roleSummary.map((item) => (
                                <span key={`${scenario.id}-${item.role.id}`} className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${alignmentClass(item.role.alignment)}`}>
                                  {item.role.name} · {roleCountLabel(item.count)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-[var(--pm-line)] bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                                ترکیب نقش ثبت نشده
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-container pb-16">
        <div className="pm-command p-5">
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="pm-kicker">نکات مهم اجرای سالم</p>
              <h2 className="mt-2 text-2xl font-black">چیزهایی که وسط بازی نباید گم شوند</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[var(--pm-muted)] dark:text-white/54">
                این قواعد کمک می‌کند گزارش نهایی هم خوانا باشد، هم نتیجه و وضعیت بازیکنان را درست حساب کند.
              </p>
            </div>
            <div className="grid gap-2">
              {quickRules.map((rule) => (
                <div key={rule} className="rounded-2xl border border-[var(--pm-line)] bg-white/70 p-3 text-sm font-bold leading-7 text-zinc-700 dark:border-[var(--pm-line)] dark:bg-black/18 dark:text-white/68">
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
