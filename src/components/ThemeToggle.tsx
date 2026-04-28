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

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (nav) {
      return (
        <button
          type="button"
          disabled
          className="flex min-w-[4.7rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-zinc-500 opacity-70"
          title="تنظیم تم"
        >
          <span className="material-symbols-outlined flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-xl dark:bg-white/[0.06]">contrast</span>
          <span className="w-full truncate text-[10px] font-black leading-4">تم</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled
        className={compact ? "ui-button-secondary min-h-10 px-3 text-xs opacity-70" : "ui-button-secondary w-full justify-start px-3 opacity-70"}
        title="تنظیم تم"
      >
        <span className="material-symbols-outlined text-xl">contrast</span>
        <span className={compact ? "hidden sm:inline" : "truncate"}>تم</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  if (nav) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="group flex min-w-[4.7rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className="material-symbols-outlined flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-xl transition-all group-hover:bg-zinc-950 group-hover:text-white dark:bg-white/[0.06]">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{isDark ? "روشن" : "تاریک"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        compact
          ? "ui-button-secondary min-h-10 px-3 text-xs"
          : "group flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm font-black text-zinc-700 transition-all hover:bg-zinc-950 hover:text-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white dark:hover:text-zinc-950"
      }
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className={compact ? "material-symbols-outlined text-xl" : "material-symbols-outlined flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-xl text-zinc-600 transition-all group-hover:bg-white/15 group-hover:text-inherit dark:bg-white/[0.06] dark:text-zinc-300"}>
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      <span className={compact ? "hidden sm:inline" : "min-w-0 flex-1 truncate text-right"}>
        {isDark ? "تم روشن" : "تم تاریک"}
      </span>
    </button>
  );
}
