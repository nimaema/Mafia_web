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
  /** Total seats to draw (defaults to max of capacity and players). */
  capacity?: number;
  players: SeatPlayer[];
  /** "lobby" hides alive/dead styling; "play" shows eliminated seats. */
  mode?: "lobby" | "play";
  /** Center content (defaults to a seated/total counter). */
  center?: ReactNode;
  /** Tap a seat (only fired for occupied seats). */
  onSeatClick?: (index: number, player: SeatPlayer) => void;
  className?: string;
};

function initial(name?: string | null) {
  const t = name?.trim();
  return t ? t.slice(0, 1) : "؟";
}

/**
 * The night table — players arranged around a circle. Used in the lobby
 * (seats filling up) and the game console (alive / eliminated roster).
 */
export function SeatRing({ capacity, players, mode = "lobby", center, onSeatClick, className }: SeatRingProps) {
  const total = Math.max(capacity || 0, players.length, mode === "play" ? players.length : 6);
  const aliveCount = players.filter((p) => p.isAlive !== false).length;
  const seats = Array.from({ length: total });

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[22rem] ${className || ""}`}>
      {/* table felt */}
      <div className="absolute inset-[15%] rounded-full border border-[var(--pm-line)] bg-[radial-gradient(circle,var(--pm-primary-soft),transparent_72%)] shadow-[inset_0_2px_30px_rgba(0,0,0,0.3)]" />
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
        const x = r2(50 + 43 * Math.cos(a));
        const y = r2(50 + 43 * Math.sin(a));
        const player = players[i];
        const occupied = Boolean(player);
        const out = occupied && player.isAlive === false;
        const clickable = occupied && Boolean(onSeatClick);

        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, width: "20%" }}
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onSeatClick!(i, player!) : undefined}
              className={`group flex w-full flex-col items-center gap-1 outline-none ${clickable ? "cursor-pointer" : "cursor-default"}`}
              aria-label={occupied ? player!.name : `صندلی ${i + 1} خالی`}
            >
              <span
                className={`grid size-[clamp(2rem,9vw,2.7rem)] place-items-center overflow-hidden rounded-full border text-sm font-black transition-all ${
                  out
                    ? "border-[var(--pm-danger)]/45 bg-[var(--pm-danger)]/12 text-[var(--pm-danger)] opacity-70"
                    : occupied
                      ? "border-[var(--pm-primary)]/45 bg-[var(--pm-surface-strong)] text-[var(--pm-text)] shadow-[0_0_14px_var(--pm-primary-glow)]"
                      : "border-dashed border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-muted)]"
                } ${clickable ? "group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-[var(--pm-primary)]" : ""} ${
                  player?.isYou ? "ring-2 ring-[var(--pm-primary)] ring-offset-2 ring-offset-[var(--pm-bg)]" : ""
                }`}
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
                  <span className="text-[10px] font-black opacity-60" dir="ltr">{(i + 1).toLocaleString("fa-IR")}</span>
                )}
              </span>
              {occupied && (
                <span className={`max-w-[5.5rem] truncate text-[10px] font-bold ${out ? "text-[var(--pm-danger)] line-through" : "text-[var(--pm-muted)]"}`}>
                  {player!.isYou ? "تو" : player!.name}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
