"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  compact?: boolean;
  nav?: boolean;
};

export function ThemeToggle({ compact = false, nav = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : true;
  const label = isDark ? "روشن" : "تاریک";
  const icon = isDark ? "light_mode" : "dark_mode";

  if (nav) {
    return (
      <button
        type="button"
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="group flex min-w-[4.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-zinc-500 transition-all hover:bg-zinc-950/5 hover:text-zinc-950 disabled:opacity-60 dark:text-white/58 dark:hover:bg-white/8 dark:hover:text-white"
        aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className="relative grid size-8 place-items-center rounded-xl border border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.055]">
          <span className="material-symbols-outlined text-[1.15rem] text-cyan-700 dark:text-cyan-100">{icon}</span>
          <span className="absolute -left-0.5 -top-0.5 size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(0,245,212,0.75)]" />
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        compact
          ? "group inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white/82 px-2.5 text-xs font-black text-zinc-700 shadow-sm transition-all hover:border-cyan-500/35 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-cyan-300/35 dark:hover:bg-white/[0.1]"
          : "group grid w-full grid-cols-[2.25rem_minmax(0,1fr)_3rem] items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white/82 px-2.5 py-2 text-xs font-black text-zinc-700 transition-all hover:border-cyan-500/35 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:border-cyan-300/35 dark:hover:bg-white/[0.09]"
      }
      aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className="material-symbols-outlined grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-lg leading-none text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
        {icon}
      </span>
      <span className={compact ? "hidden text-right sm:inline" : "min-w-0 truncate text-right"}>
        {isDark ? "حالت تاریک" : "حالت روشن"}
      </span>
      <span className="relative flex h-7 w-12 shrink-0 items-center rounded-full border border-zinc-200 bg-zinc-950/8 p-1 shadow-inner shadow-zinc-950/10 dark:border-white/10 dark:bg-black/28 dark:shadow-black/20">
        <span className="absolute right-2 text-[12px] text-cyan-700 dark:text-cyan-200">
          <span className="material-symbols-outlined text-[12px]">dark_mode</span>
        </span>
        <span className="absolute left-2 text-[12px] text-amber-200">
          <span className="material-symbols-outlined text-[12px]">light_mode</span>
        </span>
        <span className={`relative z-10 size-5 rounded-full bg-white shadow-lg shadow-zinc-950/20 transition-transform dark:shadow-black/25 ${isDark ? "-translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
