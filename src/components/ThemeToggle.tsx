"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  /** "drench" sits on a full-color phase surface (night hero, auth band). */
  tone?: "default" | "drench";
  className?: string;
  /** Legacy props from older screens; both render the icon button. */
  compact?: boolean;
  nav?: boolean;
};

export function ThemeToggle({ tone = "default", className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isNight = mounted ? resolvedTheme !== "light" : true;
  const label = isNight ? "حالت روز" : "حالت شب";
  const toneClass =
    tone === "drench"
      ? "bg-moon/12 text-moon hover:bg-moon/20 hover:text-moon"
      : "";

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={() => setTheme(isNight ? "light" : "dark")}
      className={`nq-icon-btn ${toneClass} ${className}`}
      aria-label={label}
      title={label}
    >
      {isNight ? <Sun size={20} weight="bold" aria-hidden /> : <Moon size={20} weight="bold" aria-hidden />}
    </button>
  );
}
