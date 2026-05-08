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
        className="pm-icon-button group disabled:opacity-60"
        aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
        title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      >
        <span className="material-symbols-outlined text-[1.25rem]">{icon}</span>
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
          ? "pm-button-secondary group min-h-10 gap-2 rounded-[var(--radius-full)] px-2 text-xs disabled:opacity-60"
          : "pm-button-secondary group min-h-11 gap-2 rounded-[var(--radius-full)] px-3 text-xs disabled:opacity-60"
      }
      aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
      title={isDark ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
    >
      <span className="material-symbols-outlined grid size-8 place-items-center rounded-full bg-[var(--pm-primary)]/10 text-lg leading-none text-[var(--pm-primary)]">
        {icon}
      </span>
      <span className={compact ? "hidden text-right sm:inline" : "min-w-0 truncate text-right"}>
        {label}
      </span>
    </button>
  );
}
