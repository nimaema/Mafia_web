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
        className="group grid size-11 shrink-0 place-items-center rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-muted)] transition-all hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-surface)] hover:text-[var(--pm-primary)] disabled:opacity-60"
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
          ? "group inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-2 text-xs font-black text-[var(--pm-text)] transition-all hover:border-[var(--pm-primary)]/35 hover:bg-[var(--pm-surface)] disabled:opacity-60"
          : "group inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-3 text-xs font-black text-[var(--pm-text)] transition-all hover:border-[var(--pm-primary)]/35 hover:bg-[var(--pm-surface)] disabled:opacity-60"
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
