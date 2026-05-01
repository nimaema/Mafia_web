"use client";

import { useEffect, useState } from "react";
import { usePwaInstallState } from "@/hooks/usePwaInstallState";

const PWA_NOTICE_KEY = "pwa-install-fullscreen-dismissed-at";
const PWA_NOTICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

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
    <div className="fixed inset-0 z-[260] flex bg-zinc-950/80 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-right backdrop-blur-xl" dir="rtl">
      <section className="relative m-auto flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/15 bg-white shadow-2xl shadow-black/40 dark:bg-zinc-950">
        <div className="relative overflow-hidden bg-zinc-950 p-5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.28),transparent_18rem)]" />
          <button
            type="button"
            onClick={close}
            className="absolute left-3 top-3 z-10 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition-all hover:bg-white hover:text-zinc-950"
            aria-label="بستن راهنمای نصب"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="relative pl-10">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lime-500 text-zinc-950 shadow-lg shadow-lime-500/25">
                <span className="material-symbols-outlined text-3xl">{pwa.guide.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">PWA MODE</p>
                <h2 className="mt-1 text-2xl font-black leading-8">نصب مافیا بورد</h2>
              </div>
            </div>
            <p className="mt-4 text-sm font-bold leading-7 text-zinc-300">
              روی موبایل، تجربه کامل برنامه با نسخه نصب‌شده فعال می‌شود: صفحه تمام‌قد، تایمر پایدارتر، گزارش بازی و کنترل‌های دقیق‌تر لابی.
            </p>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-zinc-950 dark:text-white">{pwa.guide.label}</p>
              <span className="rounded-lg bg-lime-500 px-2.5 py-1 text-[10px] font-black text-zinc-950">راهنمای مرورگر شما</span>
            </div>
            <ol className="mt-4 grid gap-3">
              {pwa.guide.steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/70">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold leading-6 text-zinc-700 dark:text-zinc-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-sm font-bold leading-6 text-sky-700 dark:text-sky-300">
            {pwa.guide.note}
          </div>
        </div>

        <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
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
      </section>
    </div>
  );
}
