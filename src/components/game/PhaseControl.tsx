"use client";

import { useState } from "react";
import { Gavel, Moon, Sun } from "@phosphor-icons/react";
import { setGamePhase, type GamePhaseInput } from "@/actions/game";
import { phaseTitle, type Phase } from "@/lib/phase";

type PhaseControlProps = {
  gameId: string;
  phase: Phase | null | undefined;
  phaseNumber: number;
  onChanged?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

const OPTIONS: { value: GamePhaseInput; label: string; Icon: typeof Moon; active: string }[] = [
  { value: "NIGHT", label: "شب", Icon: Moon, active: "bg-night text-moon" },
  { value: "DAY", label: "روز", Icon: Sun, active: "bg-day text-day-ink" },
  { value: "VOTE", label: "رأی‌گیری", Icon: Gavel, active: "bg-verdict text-verdict-ink" },
];

/** Moves every player's phone to a new phase (and shows them the phase title card). */
export function PhaseControl({ gameId, phase, phaseNumber, onChanged, onError, disabled }: PhaseControlProps) {
  const [pending, setPending] = useState<GamePhaseInput | null>(null);

  const move = async (next: GamePhaseInput) => {
    setPending(next);
    const result = await setGamePhase(gameId, next);
    setPending(null);
    if (result.error) onError?.(result.error);
    else onChanged?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-muted">
        گوشی بازیکنان: <span className="font-extrabold text-fg">{phaseTitle(phase ?? null, phaseNumber)}</span>
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="رفتن به مرحله بعد">
        {OPTIONS.map(({ value, label, Icon, active }) => {
          const current = phase === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => move(value)}
              disabled={disabled || pending !== null}
              aria-pressed={current}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-extrabold transition-colors disabled:opacity-60 ${current ? active : "bg-raised text-fg hover:bg-line"}`}
            >
              {pending === value ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : <Icon size={18} weight={current ? "fill" : "bold"} aria-hidden />}
              {value === "NIGHT" && phase !== "NIGHT" ? `شب ${(phaseNumber + 1).toLocaleString("fa-IR")}` : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
