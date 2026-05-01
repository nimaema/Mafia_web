import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const desktopFeatures = [
  { icon: "groups", title: "لابی و ورود", text: "ساخت بازی، ورود با کد، کنترل ظرفیت و وضعیت بازیکنان در یک نمای زنده." },
  { icon: "account_tree", title: "سناریو و نقش", text: "تعریف سناریو، نقش‌ها، توانایی‌های شب و نسخه‌های مختلف برای هر جمع." },
  { icon: "edit_note", title: "گزارش گرداننده", text: "ثبت اتفاقات روز و شب، حذف‌ها، تغییر نقش و انتشار گزارش بعد از بازی." },
];

const desktopStats = [
  { label: "مدیریت نقش", value: "دقیق", icon: "theater_comedy", tone: "text-lime-600 dark:text-lime-300" },
  { label: "گزارش بازی", value: "مرحله‌ای", icon: "edit_calendar", tone: "text-sky-600 dark:text-sky-300" },
  { label: "کنترل اجرا", value: "زنده", icon: "sensors", tone: "text-amber-600 dark:text-amber-300" },
];

const desktopWorkflow = [
  { step: "۱", title: "لابی بسازید", text: "کد ورود، رمز اختیاری و ظرفیت بازی را آماده کنید." },
  { step: "۲", title: "سناریو را بچینید", text: "از کتابخانه انتخاب کنید یا سناریوی سفارشی بسازید." },
  { step: "۳", title: "بازی را اجرا کنید", text: "نقش‌ها، تایمر و گزارش روز و شب کنار گرداننده می‌مانند." },
];

export default function Home() {
  return (
    <div className="app-page min-h-screen overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-zinc-950 px-6 py-10 text-white md:hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="pointer-events-none absolute inset-x-8 top-20 h-44 rounded-full bg-lime-500/10 blur-3xl" />

        <main className="relative z-10 flex w-full max-w-xs flex-col items-center text-center">
          <div className="flex size-24 items-center justify-center rounded-[2rem] bg-lime-500 text-zinc-950 shadow-2xl shadow-lime-500/25">
            <span className="material-symbols-outlined text-5xl">theater_comedy</span>
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight">مافیا بورد</h1>
          <p className="mt-3 whitespace-nowrap text-sm font-bold text-zinc-300">کنترل سریع و امن بازی‌های مافیا</p>
          <Link href="/auth/login" className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-lime-500 px-5 text-base font-black text-zinc-950 shadow-xl shadow-lime-500/20 transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-xl">login</span>
            ورود و شروع بازی
          </Link>
        </main>
      </div>

      <div className="hidden md:block" dir="rtl">
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
            <Link href="/join" className="ui-button-secondary">
              <span className="material-symbols-outlined text-lg">vpn_key</span>
              ورود با کد
            </Link>
            <ThemeToggle compact />
            <Link href="/auth/login" className="ui-button-primary">
              <span className="material-symbols-outlined text-lg">login</span>
              ورود و شروع
            </Link>
          </div>
        </header>

        <main>
          <section className="relative border-y border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-zinc-950">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(132,204,22,0.10),transparent_34%),linear-gradient(225deg,rgba(14,165,233,0.10),transparent_30%)] dark:bg-[linear-gradient(135deg,rgba(132,204,22,0.13),transparent_34%),linear-gradient(225deg,rgba(14,165,233,0.10),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.045)_1px,transparent_1px)] bg-[size:44px_44px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />

            <div className="app-container relative grid min-h-[calc(100vh-5.25rem)] gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
              <div>
                <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 text-sm font-black text-zinc-700 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200">
                  <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">bolt</span>
                  اپ مدیریت بازی‌های مافیا
                </div>

                <h1 className="mt-5 text-6xl font-black leading-tight text-zinc-950 dark:text-white lg:text-7xl">
                  مافیا بورد
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                  ساخت بازی، انتخاب سناریو، کنترل نقش‌ها و گزارش نهایی در یک تجربه منظم برای بازیکن و گرداننده.
                </p>

                <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                  {desktopStats.map((item) => (
                    <div key={item.label} className="rounded-lg border border-zinc-200 bg-white/80 p-3 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/65">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`material-symbols-outlined text-xl ${item.tone}`}>{item.icon}</span>
                        <span className="text-lg font-black text-zinc-950 dark:text-white">{item.value}</span>
                      </div>
                      <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/auth/login" className="ui-button-primary min-h-12 px-5 text-base">
                    <span className="material-symbols-outlined text-xl">login</span>
                    ورود و شروع
                  </Link>
                  <Link href="/join" className="ui-button-secondary min-h-12 px-5 text-base">
                    <span className="material-symbols-outlined text-xl">vpn_key</span>
                    ورود با کد
                  </Link>
                </div>
              </div>

              <aside className="ui-card overflow-hidden bg-white/95 backdrop-blur dark:bg-zinc-900/85">
                <div className="border-b border-zinc-200 bg-zinc-950 p-5 text-white dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">LIVE ROOM</p>
                      <h2 className="mt-2 text-2xl font-black">اتاق کنترل بازی</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">نمایی از چیزی که گرداننده و بازیکنان در جریان بازی می‌بینند.</p>
                    </div>
                    <span className="material-symbols-outlined flex size-12 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-3xl text-zinc-950 shadow-sm shadow-lime-500/20">dashboard</span>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-lime-700 dark:text-lime-300">سناریوی فعال</p>
                        <p className="mt-1 text-xl font-black text-zinc-950 dark:text-white">کاپو ۱۲ نفره</p>
                      </div>
                      <span className="rounded-lg bg-lime-500 px-3 py-1 text-xs font-black text-zinc-950">در حال تکمیل</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                      <div className="h-full w-3/4 rounded-full bg-lime-500" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        ["شهروند", "۷", "text-sky-600 dark:text-sky-300"],
                        ["مافیا", "۴", "text-red-600 dark:text-red-300"],
                        ["مستقل", "۱", "text-amber-600 dark:text-amber-300"],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-white/10 dark:bg-zinc-950/60">
                          <p className={`text-lg font-black ${color}`}>{value}</p>
                          <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {[
                      ["timer", "تایمر گرداننده", "نوبت اصلی و چالش"],
                      ["person_search", "انتخاب بازیکن", "برای ثبت اتفاقات"],
                      ["public", "گزارش عمومی", "بعد از پایان بازی"],
                    ].map(([icon, title, text]) => (
                      <div key={title} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/55">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-lg text-white dark:bg-white dark:text-zinc-950">{icon}</span>
                          <div>
                            <p className="text-sm font-black text-zinc-950 dark:text-white">{title}</p>
                            <p className="mt-0.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">{text}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-lg text-lime-500">check_circle</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="app-container grid gap-5 py-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-3 sm:grid-cols-3">
              {desktopFeatures.map((item) => (
                <div key={item.title} className="ui-card p-4">
                  <div className="ui-icon-accent">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <h2 className="mt-4 font-black text-zinc-950 dark:text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>

            <aside className="ui-card overflow-hidden">
              <div className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="ui-kicker">روند استفاده</p>
                <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">از ساخت لابی تا گزارش نهایی</h2>
              </div>
              <div className="grid gap-3 p-4">
                {desktopWorkflow.map((item) => (
                  <div key={item.step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-lime-500 text-sm font-black text-zinc-950">{item.step}</span>
                    <div>
                      <p className="font-black text-zinc-950 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
