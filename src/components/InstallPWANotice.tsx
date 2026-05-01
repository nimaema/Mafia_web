"use client";

import { useEffect, useState } from "react";
import { usePwaInstallState } from "@/hooks/usePwaInstallState";

const PWA_NOTICE_KEY = "pwa-install-fullscreen-dismissed-at";
const PWA_NOTICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const installBenefits = [
  {
    icon: "fullscreen",
    title: "صفحه تمام‌قد",
    text: "نوار مرورگر حذف می‌شود و پنجره‌های لابی، انتخاب بازیکن و گزارش زیر ناوبری گیر نمی‌کنند.",
  },
  {
    icon: "timer",
    title: "تایمر قابل اتکا",
    text: "تایمر گرداننده و هشدار پایان زمان در حالت نصب‌شده پایدارتر و مناسب اجرای واقعی بازی است.",
  },
  {
    icon: "edit_note",
    title: "گزارش پیشرفته بازی",
    text: "ثبت اتفاقات روز و شب، انتخاب هدف‌ها و کنترل‌های حساس روی موبایل فقط در حالت PWA باز می‌شود.",
  },
];

const afterInstallTips = [
  "بعد از نصب، از آیکن مافیا بورد روی صفحه اصلی وارد شوید.",
  "اگر هنوز صفحه مرورگر را می‌بینید، برنامه را از تب مرورگر باز کرده‌اید نه از آیکن نصب‌شده.",
  "اگر دوباره وارد صفحه ورود شدید، مطمئن شوید آدرس دامنه همان دامنه اصلی سایت است و Secret سرور بعد از بیلد تغییر نکرده است.",
];

function recentlyDismissed() {
  if (typeof window === "undefined") return true;
  const seenAt = Number(localStorage.getItem(PWA_NOTICE_KEY) || 0);
  return Number.isFinite(seenAt) && Date.now() - seenAt < PWA_NOTICE_COOLDOWN_MS;
}

function markDismissed() {
  localStorage.setItem(PWA_NOTICE_KEY, String(Date.now()));
}

export function InstallPWANotice() {
  const pwa = usePwaInstallState();
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  useEffect(() => {
    if (!pwa.ready || !pwa.isMobileBrowser || recentlyDismissed()) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 650);
    return () => window.clearTimeout(timer);
  }, [pwa.ready, pwa.isMobileBrowser]);

  const close = () => {
    markDismissed();
    setVisible(false);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") close();
    setInstallPrompt(null);
  };

  if (!visible || !pwa.isMobileBrowser) return null;

  return (
    <div className="fixed inset-0 z-[260] bg-zinc-950/85 text-right backdrop-blur-xl" dir="rtl">
      <section className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl shadow-black/50 dark:bg-zinc-950 sm:m-auto sm:mt-4 sm:h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-xl sm:border sm:border-white/15">
        <header className="shrink-0 border-b border-white/10 bg-zinc-950 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lime-500 text-zinc-950 shadow-lg shadow-lime-500/25">
                <span className="material-symbols-outlined text-3xl">{pwa.guide.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">PWA MODE</p>
                <h2 className="mt-1 text-2xl font-black leading-8">نصب مافیا بورد</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition-all hover:bg-white hover:text-zinc-950"
              aria-label="بستن راهنمای نصب"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <p className="mt-4 text-sm font-bold leading-7 text-zinc-200">
            برای موبایل، مافیا بورد مثل یک اپ واقعی طراحی شده است. نصب PWA باعث می‌شود بازی تمام‌صفحه باز شود و کنترل‌های حساس مثل تایمر، گزارش شب و ابزارهای پیشرفته لابی بدون مزاحمت نوار مرورگر کار کنند.
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["تمام‌صفحه", "تایمر بهتر", "گزارش پیشرفته"].map((item) => (
              <span key={item} className="min-w-max rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black text-lime-200">
                {item}
              </span>
            ))}
          </div>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <section className="grid gap-2">
            {installBenefits.map((benefit) => (
              <article key={benefit.title} className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <span className="material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xl text-white dark:bg-white dark:text-zinc-950">
                  {benefit.icon}
                </span>
                <div>
                  <p className="text-sm font-black text-zinc-950 dark:text-white">{benefit.title}</p>
                  <p className="mt-1 text-xs font-bold leading-6 text-zinc-600 dark:text-zinc-300">{benefit.text}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-lime-500/25 bg-lime-500/10">
            <div className="flex items-center justify-between gap-3 border-b border-lime-500/20 bg-white/75 p-3 dark:bg-zinc-950/55">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-lime-700 dark:text-lime-300">راهنمای دقیق نصب</p>
                <h3 className="mt-1 text-base font-black text-zinc-950 dark:text-white">{pwa.guide.label}</h3>
              </div>
              <span className="rounded-lg bg-lime-500 px-2.5 py-1 text-[10px] font-black text-zinc-950">مرورگر شما</span>
            </div>

            <ol className="grid gap-2 p-3">
              {pwa.guide.steps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-lime-500 text-sm font-black text-zinc-950">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold leading-7 text-zinc-700 dark:text-zinc-200">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xl text-white">tips_and_updates</span>
              <div>
                <p className="text-sm font-black text-zinc-950 dark:text-white">بعد از نصب چک کنید</p>
                <ul className="mt-2 grid gap-2">
                  {afterInstallTips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-xs font-bold leading-6 text-sky-800 dark:text-sky-200">
                      <span className="material-symbols-outlined mt-0.5 text-sm">check_circle</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-bold leading-6 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
            {pwa.guide.note}
          </p>
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] dark:border-white/10 dark:bg-zinc-900/95">
          <div className="grid gap-2">
            {installPrompt && (
              <button type="button" onClick={install} className="ui-button-primary min-h-12 w-full">
                <span className="material-symbols-outlined text-xl">download</span>
                نصب مستقیم برنامه
              </button>
            )}
            <button type="button" onClick={close} className="ui-button-secondary min-h-11 w-full">
              فعلاً ادامه می‌دهم
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
