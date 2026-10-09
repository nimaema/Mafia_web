"use client";

import { useEffect } from "react";
import { Crescent } from "@/components/brand/Crescent";
import { MaskMark } from "@/components/brand/MaskMark";
import { PHASE_COPY, PHASE_SURFACE, phaseTitle, type Phase } from "@/lib/phase";

type PhaseTitleCardProps = {
  phase: Phase;
  phaseNumber: number;
  subtitle?: string;
  onDone: () => void;
  /** Milliseconds before the card dismisses itself. */
  duration?: number;
};

/** Full-screen poster shown on every phone when the moderator moves the game to a new phase. */
export function PhaseTitleCard({ phase, phaseNumber, subtitle, onDone, duration = 3600 }: PhaseTitleCardProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [onDone, duration]);

  const title = phaseTitle(phase, phaseNumber);
  const [first, ...rest] = title.split(" ");

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`${title}. برای بستن لمس کنید`}
      className={`nq-grain fixed inset-0 z-[60] flex flex-col overflow-hidden text-right ${PHASE_SURFACE[phase]} animate-[phase-in_520ms_cubic-bezier(0.16,1,0.3,1)_both]`}
    >
      {phase === "NIGHT" ? <Crescent className="pointer-events-none absolute -left-24 top-24 w-80 text-moon" /> : null}
      {phase === "DAY" ? (
        <span className="pointer-events-none absolute -left-20 top-16 size-80 rounded-full bg-[oklch(0.92_0.11_88)] shadow-[0_0_0_36px_oklch(0.92_0.11_88/0.18),0_0_0_80px_oklch(0.92_0.11_88/0.1)]" aria-hidden />
      ) : null}
      {phase === "VOTE" ? <MaskMark className="pointer-events-none absolute -left-16 top-24 w-96 rotate-[-12deg] text-verdict-ink opacity-10" /> : null}
      <span className="relative z-10 mt-auto px-6 pb-[max(env(safe-area-inset-bottom),2.5rem)] sm:px-12">
        {subtitle ? <span className="block text-base font-bold opacity-80">{subtitle}</span> : null}
        <span className="nq-display mt-3 block text-[6.5rem] leading-[0.95] sm:text-[8rem]">
          {first}
          {rest.length ? (
            <>
              <br />
              {rest.join(" ")}
            </>
          ) : null}
        </span>
        <span className="mt-5 block max-w-sm text-lg font-semibold leading-8 opacity-90">{PHASE_COPY[phase]}</span>
      </span>
    </button>
  );
}
