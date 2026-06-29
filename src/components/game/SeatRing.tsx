"use client";

import type { ReactNode } from "react";

const r2 = (n: number) => Math.round(n * 100) / 100;

export type SeatPlayer = {
  name: string;
  image?: string | null;
  isAlive?: boolean;
  isYou?: boolean;
};

type SeatRingProps = {
  capacity?: number;
  players: SeatPlayer[];
  mode?: "lobby" | "play";
  center?: ReactNode;
  onSeatClick?: (index: number, player: SeatPlayer) => void;
  className?: string;
};

function initial(name?: string | null) {
  const t = name?.trim();
  return t ? t.slice(0, 1) : "؟";
}

/** The night table — players around a circle. Adapts to both themes via --pm-*. */
export function SeatRing({ capacity, players, mode = "lobby", center, onSeatClick, className }: SeatRingProps) {
  const total = Math.max(capacity || 0, players.length, mode === "play" ? players.length : 6);
  const aliveCount = players.filter((p) => p.isAlive !== false).length;
  const seats = Array.from({ length: total });

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[22rem] ${className || ""}`}>
      <div className="absolute inset-[15%] rounded-full border border-[var(--pm-line)] bg-[radial-gradient(circle,var(--pm-primary-soft),transparent_72%)] shadow-[inset_0_2px_30px_rgba(0,0,0,0.25)]" />
      <div className="absolute inset-[15%] grid place-items-center px-6 text-center">
        {center ?? (
          <div>
            <p className="font-display text-3xl font-bold text-[var(--pm-text)]" dir="ltr">
              {players.length.toLocaleString("fa-IR")}
              {capacity ? <span className="text-[var(--pm-muted)]">/{capacity.toLocaleString("fa-IR")}</span> : null}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-[var(--pm-muted)]">
              {mode === "play" ? `${aliveCount.toLocaleString("fa-IR")} زنده` : "نشسته پشت میز"}
            </p>
          </div>
        )}
      </div>

      {seats.map((_, i) => {
        const a = (-90 + (i / total) * 360) * (Math.PI / 180);
        const x = r2(50 + 42 * Math.cos(a));
        const y = r2(50 + 42 * Math.sin(a));
        const player = players[i];
        const occupied = Boolean(player);
        const out = mode === "play" && occupied && player!.isAlive === false;
        const you = occupied && player!.isYou;
        const clickable = occupied && onSeatClick;

        return (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onSeatClick!(i, player!) : undefined}
              title={player?.name}
              className={`grid size-[2.7rem] place-items-center overflow-hidden rounded-full border text-xs font-black transition-all duration-300 sm:size-12 ${
                out
                  ? "border-[var(--pm-danger)]/45 bg-[var(--pm-danger)]/12 text-[var(--pm-danger)] opacity-60"
                  : occupied
                    ? "border-[var(--pm-primary)]/45 bg-[var(--pm-surface-strong)] text-[var(--pm-text)]"
                    : "border-dashed border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-muted)]"
              } ${you ? "ring-2 ring-[var(--pm-primary)] ring-offset-2 ring-offset-[var(--pm-bg)]" : ""} ${clickable ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--pm-primary)]" : ""}`}
              style={occupied && !out ? { boxShadow: "0 0 14px var(--pm-primary-glow)" } : undefined}
            >
              {out ? (
                <span className="material-symbols-outlined text-base">person_off</span>
              ) : occupied ? (
                player!.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={player!.image} alt="" className="size-full object-cover" />
                ) : player!.name?.trim() ? (
                  initial(player!.name)
                ) : (
                  <span className="size-2 rounded-full bg-[var(--pm-primary)]" />
                )
              ) : (
                (i + 1).toLocaleString("fa-IR")
              )}
            </button>
            {occupied && player!.name?.trim() && (
              <span className="absolute inset-x-1/2 mt-1 w-16 -translate-x-1/2 truncate text-center text-[9px] font-bold text-[var(--pm-muted)]">{player!.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
