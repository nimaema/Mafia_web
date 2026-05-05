"use client";

import { useEffect, useState } from "react";
import { CommandButton } from "@/components/CommandUI";

export function InstallPWAButton({ compact = false }: { compact?: boolean }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    setIsInstallable(!window.matchMedia("(display-mode: standalone)").matches);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    setOpen(false);
  };

  if (!isInstallable) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition-all hover:border-cyan-300/45"
            : "flex h-11 items-center justify-between gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 text-sm font-black text-cyan-100 transition-all hover:border-cyan-300/45"
        }
      >
        <span className="material-symbols-outlined text-[20px]">app_shortcut</span>
        {!compact && <span>نصب اپ</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[240] flex items-end justify-center bg-black/60 p-3 backdrop-blur-md md:items-center" dir="rtl">
          <div className="pm-safe-sheet pm-surface flex w-full max-w-lg flex-col gap-4 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">PWA</p>
                <h3 className="text-xl font-black text-zinc-50">تجربه اپلیکیشن را فعال کن</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  نصب PlayMafia باعث می‌شود بازی تمام‌صفحه، سریع‌تر و شبیه اپ اصلی روی گوشی باز شود.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid gap-2 text-sm text-zinc-300">
              {[
                ["ios_share", "iPhone Safari", "دکمه Share را بزن، سپس Add to Home Screen را انتخاب کن."],
                ["android", "Chrome Android", "منوی سه‌نقطه را باز کن و Install app یا Add to Home screen را بزن."],
                ["devices", "مرورگرهای دیگر", "از منوی مرورگر گزینه نصب یا افزودن به صفحه اصلی را انتخاب کن."],
              ].map(([icon, title, text]) => (
                <div key={title} className="pm-ledger-row flex items-center gap-3 p-3">
                  <span className="material-symbols-outlined grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">{icon}</span>
                  <div>
                    <p className="font-black text-zinc-100">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <CommandButton onClick={handleInstall} disabled={!deferredPrompt} className="flex-1">
                <span className="material-symbols-outlined text-[18px]">download</span>
                نصب سریع
              </CommandButton>
              <CommandButton tone="ghost" onClick={() => setOpen(false)}>
                بعدا
              </CommandButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
