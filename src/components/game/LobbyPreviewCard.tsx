import type { Alignment } from "@prisma/client";
import type { ReactNode } from "react";

type LobbyPlayer = {
  id: string;
  name: string;
  current?: boolean;
};

type LobbyRole = {
  id?: string;
  name: string;
  count: number;
  alignment?: Alignment;
};

type LobbyPreviewCardProps = {
  title: string;
  subtitle?: string;
  scenarioName: string;
  code: string;
  statusLabel: string;
  playerCount: number;
  capacity: number;
  moderatorName?: string;
  locked?: boolean;
  players: LobbyPlayer[];
  roleBreakdown: LobbyRole[];
  actionArea?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
};

function alignmentClass(alignment?: Alignment) {
  if (alignment === "CITIZEN") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  }
  if (alignment === "MAFIA") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  }
  if (alignment === "NEUTRAL") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }
  return "border-zinc-200 bg-white text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400";
}

function alignmentLabel(alignment?: Alignment) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "NEUTRAL") return "مستقل";
  return "نقش";
}

function getInitial(name: string) {
  const normalized = name.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "?";
}

export function LobbyPreviewCard({
  title,
  subtitle,
  scenarioName,
  code,
  statusLabel,
  playerCount,
  capacity,
  moderatorName,
  locked = false,
  players,
  roleBreakdown,
  actionArea,
  footer,
  compact = false,
}: LobbyPreviewCardProps) {
  const shownSeatCount = capacity > 0 ? Math.min(Math.max(capacity, players.length), 12) : Math.min(Math.max(players.length, 6), 12);
  const seatItems = Array.from({ length: shownSeatCount }, (_, index) => players[index] || null);
  const progress = capacity > 0 ? Math.min(100, Math.round((playerCount / capacity) * 100)) : 0;

  return (
    <article className="ui-card overflow-hidden">
      <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">groups</span>
            </div>
            <div>
              <p className="ui-kicker">جزئیات بازی</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                {subtitle || "همه اطلاعات اصلی لابی از همین‌جا دیده می‌شود."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-lime-500 px-3 py-1 text-xs font-black text-zinc-950">
              {statusLabel}
            </span>
            {locked && (
              <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-600 dark:text-amber-300">
                رمزدار
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="ui-muted p-3">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">کد بازی</p>
            <p className="mt-2 font-mono text-lg font-black text-zinc-950 dark:text-white">#{code}</p>
          </div>
          <div className="ui-muted p-3">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">سناریو</p>
            <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{scenarioName}</p>
          </div>
          <div className="ui-muted p-3">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">گرداننده</p>
            <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{moderatorName || "نامشخص"}</p>
          </div>
          <div className="ui-muted p-3">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">ظرفیت</p>
            <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
              {capacity ? `${playerCount} / ${capacity}` : `${playerCount} بازیکن`}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
            <span>پیشرفت تکمیل لابی</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10">
            <div className="h-2 rounded-full bg-lime-500 transition-[width]" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-zinc-950 dark:text-white">بازیکنان حاضر</h3>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {capacity - playerCount > 0 ? `${capacity - playerCount} جای خالی` : "تکمیل شده"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {seatItems.map((player, index) =>
                player ? (
                  <div key={player.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-sm font-black text-zinc-950">
                        {getInitial(player.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{player.name}</p>
                        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">جایگاه {index + 1}</p>
                      </div>
                      {player.current && (
                        <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 text-[10px] font-black text-lime-600 dark:text-lime-300">
                          شما
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-seat-${index}`}
                    className="rounded-lg border border-dashed border-zinc-200 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-white/[0.03]">
                        <span className="material-symbols-outlined text-base">person_add</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">صندلی آزاد</p>
                        <p className="mt-1 text-[10px] text-zinc-400">جایگاه {index + 1}</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-zinc-950 dark:text-white">ترکیب سناریو</h3>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {roleBreakdown.length ? `${roleBreakdown.length} نقش` : "در انتظار انتخاب"}
              </span>
            </div>

            {roleBreakdown.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {roleBreakdown.map((role) => (
                  <div key={role.id || role.name} className="ui-muted p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-zinc-950 dark:text-white">{role.name}</p>
                        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">{alignmentLabel(role.alignment)}</p>
                      </div>
                      <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                        x{role.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <span className="material-symbols-outlined text-3xl text-zinc-400">account_tree</span>
                <p className="mt-3 text-sm font-black text-zinc-950 dark:text-white">سناریو هنوز انتخاب نشده</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">بعد از انتخاب سناریو، ترکیب نقش‌ها اینجا دیده می‌شود.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {compact && (
        <div className="border-t border-zinc-200 p-5 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {roleBreakdown.length === 0 && (
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                سناریو انتخاب نشده
              </span>
            )}
            {roleBreakdown.slice(0, 3).map((role) => (
              <span key={role.id || role.name} className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                {role.name} x{role.count}
              </span>
            ))}
            {roleBreakdown.length > 3 && (
              <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                +{roleBreakdown.length - 3} نقش
              </span>
            )}
          </div>
        </div>
      )}

      {actionArea && <div className="border-t border-zinc-200 p-5 dark:border-white/10">{actionArea}</div>}
      {footer && <div className="border-t border-zinc-200 px-5 py-4 dark:border-white/10">{footer}</div>}
    </article>
  );
}
