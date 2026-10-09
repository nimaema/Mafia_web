"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EyeSlash, HandTap } from "@phosphor-icons/react";
import { MaskMark } from "@/components/brand/MaskMark";
import { FactionTag } from "@/components/ui/Tag";

type RoleCardProps = {
  name: string | null | undefined;
  description?: string | null;
  alignment?: string | null;
  /** Seconds the card stays face up before hiding itself. */
  autoHide?: number;
};

const FACE: Record<string, string> = {
  CITIZEN: "var(--color-citizen)",
  MAFIA: "var(--color-mafia)",
  NEUTRAL: "var(--color-independent)",
};

/**
 * The secret role card. Face down by default; a tap flips it, another tap
 * (or the auto-hide timer) turns it back over so nobody at the table catches it.
 */
export function RoleCard({ name, description, alignment, autoHide = 12 }: RoleCardProps) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  const color = FACE[alignment || ""] || "var(--color-accent)";

  const hide = useCallback(() => {
    setRevealed(false);
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const toggle = () => {
    if (revealed) return hide();
    setRevealed(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRevealed(false), autoHide * 1000);
  };

  // Hide when the app goes to the background or the phone locks.
  useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && hide();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [hide]);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={revealed}
        aria-label={revealed ? `نقش شما: ${name || "بدون نقش"}. برای پنهان کردن لمس کنید` : "برای دیدن نقش خود لمس کنید"}
        className="group relative aspect-[3/4] w-full max-w-[19rem] [perspective:1400px]"
      >
        <span
          className={`relative block size-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
            revealed ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Back */}
          <span className="nq-khatam absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[1.6rem] border border-accent/50 bg-surface text-accent [backface-visibility:hidden]">
            <span className="absolute inset-3.5 rounded-[1.15rem] border border-accent/30" />
            <MaskMark className="relative w-28" />
            <span className="relative flex items-center gap-2 rounded-full bg-canvas px-4 py-2 text-sm font-extrabold text-fg">
              <HandTap size={18} weight="bold" aria-hidden />
              دیدن نقش من
            </span>
          </span>

          {/* Face */}
          <span
            className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[1.6rem] border bg-surface px-6 pb-6 pt-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }}
          >
            <span className="absolute inset-x-0 top-0 h-2/3 opacity-20" style={{ background: `radial-gradient(70% 60% at 50% 0%, ${color}, transparent)` }} />
            <span className="relative" style={{ color }}>
              <MaskMark className="w-28" />
            </span>
            <span className="relative mt-2 text-sm font-bold text-muted">شما هستید</span>
            <span className="nq-display relative text-[3.3rem] leading-[1.15]" style={{ color }}>
              {name || "بدون نقش"}
            </span>
            <FactionTag alignment={alignment} className="relative mt-1" />
            <span className="relative mt-auto line-clamp-5 text-[0.92rem] font-medium leading-7 text-muted">
              {description || "توضیحی برای این نقش ثبت نشده است. از گرداننده بپرسید."}
            </span>
          </span>
        </span>
      </button>
      <p className="mt-3 flex h-6 items-center gap-1.5 text-sm font-bold text-muted" aria-live="polite">
        {revealed ? (
          <>
            <EyeSlash size={16} weight="bold" aria-hidden />
            دوباره لمس کنید تا پنهان شود
          </>
        ) : (
          "فقط وقتی کسی نگاه نمی‌کند باز کنید."
        )}
      </p>
    </div>
  );
}
