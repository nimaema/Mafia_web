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
          className="flex min-w-[4.9rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-zinc-500 opacity-70"
          title="تنظیم تم"
        >
          <span className="flex h-7 w-11 items-center rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.06]">
            <span className="size-5 rounded-full bg-white shadow-sm" />
          </span>
          <span className="w-full truncate text-[10px] font-black leading-4">تم</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled
        className={compact ? "ui-button-secondary min-h-10 px-3 text-xs opacity-70" : "flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 bg-white/80 px-2.5 py-2 text-xs font-black text-zinc-500 opacity-70 dark:border-white/10 dark:bg-white/[0.04]"}
        title="تنظیم تم"
      >
        <span className="material-symbols-outlined grid size-8 place-items-center rounded-lg bg-zinc-100 text-base leading-none dark:bg-white/[0.06]">contrast</span>
        <span className={compact ? "hidden sm:inline" : "truncate"}>تم</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  if (nav) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="group flex min-w-[4.9rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className={`relative flex h-7 w-11 items-center rounded-full border p-1 transition-all ${
          isDark
            ? "border-lime-400/30 bg-zinc-950 shadow-inner shadow-black/40"
            : "border-amber-300/40 bg-amber-100 shadow-inner shadow-amber-300/30"
        }`}>
          <span className={`absolute text-[14px] transition-opacity ${isDark ? "right-2 text-lime-300 opacity-100" : "right-2 text-amber-600 opacity-0"}`}>
            <span className="material-symbols-outlined text-[14px]">dark_mode</span>
          </span>
          <span className={`absolute text-[14px] transition-opacity ${isDark ? "left-2 text-zinc-500 opacity-0" : "left-2 text-amber-600 opacity-100"}`}>
            <span className="material-symbols-outlined text-[14px]">light_mode</span>
          </span>
          <span className={`relative z-10 size-5 rounded-full bg-white shadow-sm shadow-zinc-950/20 transition-transform ${isDark ? "-translate-x-4" : "translate-x-0"}`} />
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{isDark ? "روشن" : "تاریک"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        compact
          ? "group inline-flex min-h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 text-xs font-black text-zinc-700 shadow-sm shadow-zinc-950/5 transition-all hover:border-lime-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
          : "group grid w-full grid-cols-[2rem_minmax(0,1fr)_2.75rem] items-center gap-2.5 rounded-xl border border-zinc-200 bg-white/80 px-2.5 py-2 text-xs font-black text-zinc-700 shadow-sm shadow-zinc-950/5 transition-all hover:border-lime-500/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
      }
      aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className={`material-symbols-outlined grid size-8 place-items-center rounded-lg text-base leading-none ${
        isDark ? "bg-lime-500/10 text-lime-300" : "bg-amber-500/10 text-amber-600"
      }`}>
        {isDark ? "dark_mode" : "light_mode"}
      </span>
      <span className={compact ? "hidden sm:inline" : "min-w-0 truncate text-right"}>
        {isDark ? "تاریک فعال" : "روشن فعال"}
      </span>
      <span className={`relative flex h-6 w-10 shrink-0 items-center rounded-full border p-0.5 transition-all ${
        isDark
          ? "border-lime-400/30 bg-zinc-950 shadow-inner shadow-black/50"
          : "border-amber-300/50 bg-amber-100 shadow-inner shadow-amber-300/30"
      }`}>
        <span className={`absolute right-1.5 grid place-items-center text-[13px] leading-none transition-opacity ${isDark ? "text-lime-300 opacity-100" : "opacity-0"}`}>
          <span className="material-symbols-outlined text-[13px]">dark_mode</span>
        </span>
        <span className={`absolute left-1.5 grid place-items-center text-[13px] leading-none transition-opacity ${isDark ? "opacity-0" : "text-amber-600 opacity-100"}`}>
          <span className="material-symbols-outlined text-[13px]">light_mode</span>
        </span>
        <span className={`relative z-10 size-5 rounded-full bg-white shadow-sm shadow-zinc-950/20 transition-transform ${isDark ? "-translate-x-4" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
