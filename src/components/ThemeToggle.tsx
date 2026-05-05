"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={compact ? "h-10 w-10 rounded-xl bg-white/10" : "h-11 w-full rounded-xl bg-white/10"} />;
  }

  const isDark = theme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="تغییر تم"
      className={
        compact
          ? "grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/10"
          : "flex h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-zinc-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/10"
      }
    >
      <span className="material-symbols-outlined text-[20px]">{isDark ? "dark_mode" : "light_mode"}</span>
      {!compact && (
        <>
          <span>{isDark ? "تم تاریک" : "تم روشن"}</span>
          <span className="relative h-5 w-10 rounded-full bg-white/10">
            <span className={`absolute top-1 h-3 w-3 rounded-full bg-cyan-200 transition-all ${isDark ? "right-1" : "right-6"}`} />
          </span>
        </>
      )}
    </button>
  );
}
