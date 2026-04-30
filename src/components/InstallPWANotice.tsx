"use client";

import { useEffect, useState } from "react";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPWANotice() {
  const [visible, setVisible] = useState(false);
  const durationMs = 6500;

  useEffect(() => {
    if (isStandaloneDisplay() || sessionStorage.getItem("pwa-install-notice-seen") === "true") {
      return;
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("pwa-install-notice-seen", "true");
    }, 900);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 7200);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setVisible(true);
      sessionStorage.setItem("pwa-install-notice-seen", "true");
      window.setTimeout(() => setVisible(false), durationMs);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm overflow-hidden rounded-lg border border-lime-500/25 bg-white/95 text-right shadow-xl shadow-zinc-950/10 backdrop-blur-xl dark:border-lime-400/20 dark:bg-zinc-950/95 md:bottom-6 md:left-6 md:right-auto">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="بستن راهنمای نصب"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
      <div className="p-3 pl-11">
      <div className="flex items-start gap-3">
        <div className="ui-icon-accent size-9">
          <span className="material-symbols-outlined text-xl">add_to_home_screen</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-zinc-950 dark:text-white">افزودن به صفحه اصلی</p>
          <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            از منوی مرورگر گزینه Add to Home Screen یا Install App را بزنید.
          </p>
        </div>
      </div>
      </div>
      <div className="h-1 bg-zinc-100 dark:bg-white/10">
        <div className="h-full bg-lime-500" style={{ animation: `pwa-progress ${durationMs}ms linear forwards` }} />
      </div>
      <style>{`
        @keyframes pwa-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
