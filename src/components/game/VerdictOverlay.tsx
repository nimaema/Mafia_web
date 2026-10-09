"use client";

import { useEffect } from "react";
import { MaskMark } from "@/components/brand/MaskMark";
import { hueColor } from "@/lib/playerColor";

type VerdictOverlayProps = {
  name: string;
  hue: number;
  isMe: boolean;
  onDone: () => void;
};

/** The elimination moment: the player's own mask cracks on a pomegranate field. */
export function VerdictOverlay({ name, hue, isMe, onDone }: VerdictOverlayProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`${name} از بازی بیرون رفت. برای بستن لمس کنید`}
      className="nq-grain fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-verdict px-6 text-center text-verdict-ink animate-[phase-in_520ms_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      <span
        className="relative z-10 grid size-48 rotate-[-5deg] place-items-center rounded-[3.2rem] text-white shadow-[0_30px_60px_oklch(0.2_0.1_22/0.5)]"
        style={{ backgroundColor: hueColor(hue) }}
      >
        <MaskMark className="w-36" />
        <svg viewBox="0 0 190 190" className="absolute inset-0 size-full animate-[crack_700ms_400ms_cubic-bezier(0.16,1,0.3,1)_both]" fill="none" aria-hidden>
          <path d="M108 18 96 62l14 18-18 30 10 22-8 40" stroke="var(--color-verdict)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        </svg>
      </span>
      <span className="nq-display relative z-10 mt-10 text-[4.2rem] leading-none">{isMe ? "شما رفتید" : `${name} رفت`}</span>
      <span className="relative z-10 mt-4 max-w-xs text-base font-semibold leading-7 opacity-90">
        {isMe ? "نقابتان شکست. از اینجا بازی را تماشا کنید و چیزی لو ندهید." : "یک نقاب شکست. بازی بدون او ادامه دارد."}
      </span>
    </button>
  );
}
