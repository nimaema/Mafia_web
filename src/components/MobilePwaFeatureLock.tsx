"use client";

import type { ReactNode } from "react";
import { usePwaInstallState } from "@/hooks/usePwaInstallState";

type MobilePwaFeatureLockProps = {
  children: ReactNode;
  title: string;
  description: string;
  icon?: string;
  compact?: boolean;
  className?: string;
};

export function MobilePwaFeatureLock({
  children,
  title,
  description,
  icon = "lock",
  compact = false,
  className = "",
}: MobilePwaFeatureLockProps) {
  const pwa = usePwaInstallState();

  if (!pwa.ready || !pwa.isMobileBrowser) {
    return <>{children}</>;
  }

  const visibleSteps = compact ? pwa.guide.steps.slice(0, 2) : pwa.guide.steps;

  return (
    <div className={`rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-right ${className}`} dir="rtl">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-2xl text-zinc-950 shadow-sm shadow-amber-500/20">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-base font-black text-zinc-950 dark:text-white">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-amber-800 dark:text-amber-300">{description}</p>
        </div>
      </div>

      <div className={compact ? "mt-3 grid gap-2" : "mt-4 grid gap-2"}>
        {visibleSteps.map((step, index) => (
          <div key={step} className="flex gap-2 rounded-lg border border-amber-500/15 bg-white/75 p-2 dark:bg-zinc-950/45">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-[10px] font-black text-white dark:bg-white dark:text-zinc-950">
              {index + 1}
            </span>
            <span className="text-xs font-bold leading-5 text-zinc-700 dark:text-zinc-300">{step}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-lg border border-zinc-200 bg-white/80 p-2 text-[11px] font-bold leading-5 text-zinc-500 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-400">
        دسکتاپ و تبلت بدون محدودیت کار می‌کنند؛ این قفل فقط برای موبایل داخل مرورگر است.
      </p>
    </div>
  );
}
