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
          className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 opacity-70"
          title="تنظیم تم"
        >
          <span className="material-symbols-outlined text-2xl">contrast</span>
          <span className="text-[10px] font-black">تم</span>
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
        className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/[0.06] dark:hover:text-white"
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className="material-symbols-outlined text-2xl">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
        <span className="text-[10px] font-black">{isDark ? "تم روشن" : "تم تاریک"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={compact ? "ui-button-secondary min-h-10 px-3 text-xs" : "ui-button-secondary w-full justify-start px-3"}
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className="material-symbols-outlined text-xl">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      <span className={compact ? "hidden sm:inline" : "truncate"}>
        {isDark ? "تم روشن" : "تم تاریک"}
      </span>
    </button>
  );
}
