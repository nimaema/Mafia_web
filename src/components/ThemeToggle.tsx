"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${compact ? "h-10 w-10" : "h-10 w-full"} animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800`}></div>;
  }

  const isDark = theme === "dark";

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
