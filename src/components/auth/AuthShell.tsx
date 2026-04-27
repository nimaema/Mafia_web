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
  {
    icon: "dashboard",
    title: "داشبورد یکپارچه",
    text: "ورود بازیکن، گرداننده و مدیر در یک تجربه هماهنگ جمع شده است.",
  },
  {
    icon: "account_tree",
    title: "سناریوهای دقیق",
    text: "ترکیب نقش‌ها، ظرفیت‌ها و روند لابی‌ها مرتب و قابل پیگیری می‌ماند.",
  },
  {
    icon: "install_mobile",
    title: "آماده برای موبایل",
    text: "نسخه وب‌اپ، تم روشن و تاریک، و ناوبری سریع برای استفاده روزمره.",
  },
];

export function AuthShell({ icon, title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <div className="app-page flex min-h-screen flex-col" dir="rtl">
      <header className="app-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="ui-icon-accent">
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
          </div>
          <div>
            <p className="text-lg font-black text-zinc-950 dark:text-white">مافیا بورد</p>
            <p className="ui-kicker">کنترل روم بازی</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link href="/" className="ui-button-secondary min-h-10 px-3 text-xs sm:px-4 sm:text-sm">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            صفحه اصلی
          </Link>
        </div>
      </header>

      <main className="app-container flex flex-1 items-center py-6 lg:py-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section className="hidden lg:flex flex-col gap-8 pl-8">
            <div className="space-y-4">
              <div className="ui-muted inline-flex w-fit items-center gap-2 px-3 py-2">
                <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">bolt</span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ورود به فضای مدیریت بازی</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black leading-tight text-zinc-950 dark:text-white">
                  اجرای بازی، مدیریت لابی و پیگیری نتیجه‌ها در یک جریان منظم.
                </h1>
                <p className="max-w-xl text-base leading-8 text-zinc-600 dark:text-zinc-400">
                  از همین‌جا وارد حساب شوید، سناریو بچینید، بازی‌ها را دنبال کنید و همه چیز را با همان زبان بصری مشترک ببینید.
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="ui-muted p-4">
                  <span className="material-symbols-outlined text-lg text-lime-600 dark:text-lime-400">{item.icon}</span>
                  <h2 className="mt-3 font-black text-zinc-950 dark:text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ui-card mx-auto w-full max-w-[440px] p-8 sm:p-10">
            <header className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-lg bg-lime-500/12 text-lime-600 ring-1 ring-lime-500/20 dark:text-lime-400">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              </div>
            </header>

            {activeTab && (
              <div className="mt-8 grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-zinc-950">
                {activeTab === "login" ? (
                  <>
                    <button className="rounded-lg bg-white px-4 py-2.5 text-sm font-black text-zinc-950 shadow-sm dark:bg-white/[0.08] dark:text-white">
                      ورود
                    </button>
                    <Link href="/auth/register" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white">
                      ثبت نام
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white">
                      ورود
                    </Link>
                    <button className="rounded-lg bg-white px-4 py-2.5 text-sm font-black text-zinc-950 shadow-sm dark:bg-white/[0.08] dark:text-white">
                      ثبت نام
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
