"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePwaInstallState } from "@/hooks/usePwaInstallState";

const PWA_LOGIN_PROMPT_KEY = "pwa-install-login-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const installBenefits = [
  { icon: "fullscreen", title: "تمام‌صفحه", text: "بدون نوار مرورگر" },
  { icon: "touch_app", title: "دسترسی سریع", text: "از Home Screen" },
  { icon: "phone_iphone", title: "نمای پایدار", text: "مثل اپ موبایل" },
];

const afterInstallTips = [
  "بعد از نصب، از آیکن مافیا بورد روی صفحه اصلی وارد شوید.",
  "اگر هنوز صفحه مرورگر را می‌بینید، برنامه را از تب مرورگر باز کرده‌اید نه از آیکن نصب‌شده.",
  "اگر دوباره وارد صفحه ورود شدید، دامنه، HTTPS و Secret سرور باید ثابت بمانند.",
];

export function InstallPWANotice() {
  const pwa = usePwaInstallState();
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const promptKey =
    session?.user?.id && session.expires
      ? `${PWA_LOGIN_PROMPT_KEY}:${session.user.id}:${session.expires}`
      : "";

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  useEffect(() => {
    if (
      !pwa.ready ||
      !pwa.isMobileBrowser ||
      status !== "authenticated" ||
      !session?.user?.id ||
      !promptKey ||
      sessionStorage.getItem(promptKey) === "1"
    ) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 500);
    return () => window.clearTimeout(timer);
  }, [promptKey, pwa.ready, pwa.isMobileBrowser, session?.user?.id, status]);

  const close = () => {
    if (promptKey) sessionStorage.setItem(promptKey, "1");
    setVisible(false);
    setExpanded(false);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") close();
    setInstallPrompt(null);
  };

  if (!visible || !pwa.isMobileBrowser) return null;

  if (!expanded) {
    return (
      <div className="fixed right-0 top-[42dvh] z-[260] md:hidden" dir="rtl">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group flex min-h-32 w-11 flex-col items-center justify-center gap-2 rounded-l-2xl border border-r-0 border-cyan-500/30 bg-zinc-950/95 py-3 text-white shadow-2xl shadow-zinc-950/25 backdrop-blur-xl transition-all active:scale-[0.98]"
          aria-label="باز کردن راهنمای نصب برنامه"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-500 text-zinc-950 shadow-sm shadow-cyan-500/25">
            <span className="material-symbols-outlined text-xl">{pwa.guide.icon}</span>
          </span>
          <span className="grid place-items-center text-[10px] font-black leading-4 [writing-mode:vertical-rl]">
            نصب اپ
          </span>
          <span className="material-symbols-outlined text-base text-cyan-300 transition-transform group-hover:-translate-x-0.5">chevron_left</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-zinc-950/82 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-right backdrop-blur-xl sm:items-center sm:p-4" dir="rtl">
      <section className="motion-pop flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/50 dark:bg-zinc-950 sm:max-h-[calc(100dvh-2rem)]">
        <header className="shrink-0 border-b border-white/10 bg-zinc-950 px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/25">
                <span className="material-symbols-outlined text-2xl">{pwa.guide.platformIcon}</span>
                <span className="absolute -bottom-1 -left-1 flex size-5 items-center justify-center rounded-md border border-zinc-950 bg-white text-zinc-950">
                  <span className="material-symbols-outlined text-sm">{pwa.guide.icon}</span>
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">{pwa.guide.platformLabel} PWA</p>
                <h2 className="mt-0.5 text-xl font-black leading-7">نصب مافیا بورد</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition-all hover:bg-white hover:text-zinc-950"
              aria-label="بستن راهنمای نصب تا ورود بعدی"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <p className="mt-2 text-xs font-bold leading-5 text-zinc-300">
            همه امکانات در مرورگر هم فعال است؛ نصب فقط ورود سریع‌تر و نمای تمام‌صفحه می‌دهد.
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {installBenefits.map((item) => (
              <span key={item.title} className="rounded-lg border border-white/10 bg-white/10 p-2 text-center">
                <span className="material-symbols-outlined text-base text-cyan-300">{item.icon}</span>
                <span className="mt-0.5 block text-[10px] font-black text-white">{item.title}</span>
                <span className="mt-0.5 block truncate text-[9px] font-bold text-zinc-400">{item.text}</span>
              </span>
            ))}
          </div>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <section className="overflow-hidden rounded-xl border border-cyan-500/25 bg-cyan-500/10">
            <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 bg-white/80 p-2.5 dark:bg-zinc-950/55">
              <div className="flex min-w-0 items-center gap-2">
                <span className="material-symbols-outlined flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-lg text-zinc-950">
                  {pwa.guide.platformIcon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-cyan-700 dark:text-cyan-300">راهنمای دقیق نصب</p>
                  <h3 className="mt-0.5 truncate text-sm font-black text-zinc-950 dark:text-white">{pwa.guide.label}</h3>
                </div>
              </div>
              <span className="material-symbols-outlined flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-lg text-white dark:bg-white dark:text-zinc-950">
                {pwa.guide.icon}
              </span>
            </div>

            <ol className="grid gap-1.5 p-2.5">
              {pwa.guide.steps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70">
                  <span className="relative flex size-9 items-center justify-center rounded-lg bg-cyan-500 text-zinc-950">
                    <span className="material-symbols-outlined text-lg">{pwa.guide.stepIcons[index] || "touch_app"}</span>
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-zinc-950 text-[8px] font-black text-white dark:bg-white dark:text-zinc-950">
                      {index + 1}
                    </span>
                  </span>
                  <span className="pt-0.5 text-xs font-bold leading-5 text-zinc-700 dark:text-zinc-200">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <details className="group mt-2 overflow-hidden rounded-lg border border-sky-500/20 bg-sky-500/10">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black text-zinc-950 dark:text-white">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-sky-600 dark:text-sky-300">tips_and_updates</span>
                بعد از نصب
              </span>
              <span className="material-symbols-outlined text-lg text-zinc-400 transition-transform group-open:rotate-180">keyboard_arrow_down</span>
            </summary>
            <ul className="grid gap-1.5 border-t border-sky-500/15 p-2.5">
              {afterInstallTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-[11px] font-bold leading-5 text-sky-800 dark:text-sky-200">
                  <span className="material-symbols-outlined mt-0.5 text-sm">check_circle</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-[11px] font-bold leading-5 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
            {pwa.guide.note}
          </p>
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-white/10 dark:bg-zinc-900/95">
          <div className="grid gap-2">
            {installPrompt && (
              <button type="button" onClick={install} className="ui-button-primary min-h-11 w-full">
                <span className="material-symbols-outlined text-xl">download</span>
                نصب مستقیم برنامه
              </button>
            )}
            <button type="button" onClick={close} className="ui-button-secondary min-h-10 w-full">
              بستن تا ورود بعدی
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
