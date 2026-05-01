import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const desktopFeatures = [
  { icon: "groups", title: "لابی و ورود", text: "ساخت بازی، ورود با کد و کنترل دسترسی بازیکنان." },
  { icon: "account_tree", title: "سناریو و نقش", text: "تعریف سناریو، نقش‌ها و توانایی‌های شب برای هر بازی." },
  { icon: "edit_note", title: "گزارش گرداننده", text: "ثبت اتفاقات روز و شب و انتشار گزارش برای بازیکنان." },
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

            <div className="app-container relative grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
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

              <aside className="grid gap-3">
                {desktopFeatures.map((item) => (
                  <div key={item.title} className="rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/75">
                    <div className="flex items-start gap-3">
                      <div className="ui-icon-accent">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <div>
                        <h2 className="font-black text-zinc-950 dark:text-white">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
