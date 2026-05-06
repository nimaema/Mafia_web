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
        className="group grid size-11 shrink-0 place-items-center rounded-full border border-zinc-950/8 bg-white/78 text-zinc-500 shadow-sm shadow-zinc-950/5 transition-all hover:border-cyan-500/35 hover:text-zinc-950 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/58 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className="material-symbols-outlined text-[1.25rem] text-cyan-700 dark:text-cyan-100">{icon}</span>
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
          : "group inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white/82 px-3 text-xs font-black text-zinc-700 transition-all hover:border-cyan-500/35 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:border-cyan-300/35 dark:hover:bg-white/[0.09]"
      }
      aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className="material-symbols-outlined grid size-8 place-items-center rounded-full bg-cyan-500/10 text-lg leading-none text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
        {icon}
      </span>
      <span className={compact ? "hidden text-right sm:inline" : "min-w-0 truncate text-right"}>
        {label}
      </span>
    </button>
  );
}
