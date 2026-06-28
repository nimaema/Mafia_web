"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getUserHistoryPage } from "@/actions/dashboard";
import { GameReportTimeline } from "@/components/game/GameReportTimeline";

type HistoryItem = {
  id: string;
  gameName: string;
  gameCode: string | null;
  roleName: string;
  roleAlignment: string;
  result: "WIN" | "LOSS" | "PENDING";
  date: string;
  scenarioName: string;
  scenarioDescription: string;
  moderatorName: string;
  playerCount: number;
  players: {
    name: string;
    roleName: string;
    alignment: string;
    isAlive?: boolean;
  }[];
  nightRecordsPublic?: boolean;
  nightEvents?: {
    id: string;
    nightNumber: number;
    abilityLabel: string;
    abilityChoiceLabel?: string | null;
    abilitySource?: string | null;
    actorName?: string | null;
    targetName?: string | null;
    actorAlignment?: string | null;
    wasUsed?: boolean;
    details?: {
      phase?: "NIGHT" | "DAY";
      methodKey?: string | null;
      methodLabel?: string | null;
      effectType?: string;
      secondaryTargetName?: string | null;
      extraTargets?: { id: string; name: string }[];
      targetLabels?: { label: string; playerName?: string | null }[];
      convertedRoleName?: string | null;
      previousRoleName?: string | null;
      sacrificePlayerName?: string | null;
      defensePlayers?: { id?: string | null; name: string; roleName?: string | null }[];
    } | null;
    note?: string | null;
  }[];
};

type HistoryPageData = {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

function resultMeta(result: HistoryItem["result"]) {
  if (result === "WIN") {
    return {
      label: "پیروزی",
      icon: "emoji_events",
      className: "pm-chip pm-chip-primary",
    };
  }

  if (result === "LOSS") {
    return {
      label: "شکست",
      icon: "close",
      className: "pm-chip pm-chip-danger",
    };
  }

  return {
    label: "نامشخص",
    icon: "pending",
    className: "pm-chip pm-chip-warning",
  };
}

function alignmentLabel(alignment: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: string) {
  if (alignment === "CITIZEN") return "pm-chip pm-chip-primary";
  if (alignment === "MAFIA") return "pm-chip pm-chip-danger";
  return "pm-chip pm-chip-warning";
}

export function HistoryClient({ initialData }: { initialData: HistoryPageData }) {
  const [data, setData] = useState(initialData);
  const [selectedGame, setSelectedGame] = useState<HistoryItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadPage = (page: number) => {
    startTransition(async () => {
      const nextData = await getUserHistoryPage(page, data.pageSize);
      setData(nextData);
      setSelectedGame(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const start = data.total === 0 ? 0 : data.page * data.pageSize + 1;
  const end = Math.min(data.total, (data.page + 1) * data.pageSize);
  const toFa = (n: number | string) => Number(n).toLocaleString("fa-IR");
  const pageWins = data.items.filter((g) => g.result === "WIN").length;
  const pageLosses = data.items.filter((g) => g.result === "LOSS").length;

  return (
    <div className="space-y-5" dir="rtl">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="pm-eyebrow">بایگانی</span>
          <h1 className="mt-1.5 font-display text-3xl font-bold text-[var(--pm-text)]">تاریخچهٔ تو</h1>
        </div>
        {data.total > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="pm-chip">{toFa(data.total)} بازی</span>
            <span className="pm-chip pm-chip-success">{toFa(pageWins)} برد</span>
            <span className="pm-chip pm-chip-danger">{toFa(pageLosses)} باخت</span>
          </div>
        )}
      </div>

      {data.items.length === 0 ? (
        <section className="pm-card flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] p-10 text-center">
          <span className="grid size-20 place-items-center rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-muted)]">
            <span className="material-symbols-outlined text-4xl">history_toggle_off</span>
          </span>
          <div>
            <p className="font-display text-xl font-bold text-[var(--pm-text)]">هنوز شبی ثبت نشده</p>
            <p className="mt-1 text-sm text-[var(--pm-muted)]">بعد از اولین بازی کامل، روایتش اینجا بایگانی می‌شود.</p>
          </div>
        </section>
      ) : (
        <>
          {/* ledger */}
          <div className="grid gap-2.5">
            {data.items.map((game) => {
              const result = resultMeta(game.result);
              const win = game.result === "WIN";
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="group grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/40 hover:shadow-[var(--pm-shadow-soft)] sm:gap-4 sm:p-4"
                >
                  <span className={`grid size-11 place-items-center rounded-full border ${win ? "border-[var(--pm-success)]/40 bg-[var(--pm-success)]/12 text-[var(--pm-success)]" : "border-[var(--pm-danger)]/40 bg-[var(--pm-danger)]/12 text-[var(--pm-danger)]"}`}>
                    <span className="material-symbols-outlined text-xl">{win ? "wb_twilight" : "bedtime"}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-lg font-bold text-[var(--pm-text)]">{game.scenarioName}</span>
                      {game.gameCode && <span className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--pm-primary)]" dir="ltr">#{game.gameCode}</span>}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-[var(--pm-muted)]">
                      <span className={`inline-flex items-center gap-1 ${game.roleAlignment === "MAFIA" ? "text-[var(--pm-danger)]" : game.roleAlignment === "CITIZEN" ? "text-[var(--pm-blue)]" : "text-[#a88adf]"}`}>
                        <span className="material-symbols-outlined text-sm">theater_comedy</span>{game.roleName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{game.moderatorName}</span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr">{game.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{toFa(game.playerCount)} نفر</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={result.className}><span className="material-symbols-outlined text-sm">{result.icon}</span>{result.label}</span>
                    <span className="material-symbols-outlined text-lg text-[var(--pm-muted)] transition-transform group-hover:-translate-x-1">chevron_left</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* pagination */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3 sm:flex-row">
            <p className="text-sm font-bold text-[var(--pm-muted)]">
              <span className="font-black text-[var(--pm-text)]" dir="ltr">{toFa(start)}–{toFa(end)}</span> از {toFa(data.total)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => loadPage(data.page - 1)} disabled={!data.hasPrevious || isPending} className="pm-button-secondary min-h-10 px-4 text-sm">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>قبلی
              </button>
              <button onClick={() => loadPage(data.page + 1)} disabled={!data.hasNext || isPending} className="pm-button-primary min-h-10 px-4 text-sm">
                {isPending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <span className="material-symbols-outlined text-lg">arrow_back</span>}بعدی
              </button>
            </div>
          </div>
        </>
      )}

      {selectedGame && (
        <div
          className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setSelectedGame(null)}
        >
          <section className="pm-card pm-safe-modal w-full max-w-3xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pm-line)] bg-[var(--pm-surface-strong)] p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-[var(--pm-primary)] uppercase">جزئیات بازی</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">{selectedGame.scenarioName}</h2>
                <p className="mt-2 text-sm text-[var(--pm-muted)]">
                  {selectedGame.date} | گرداننده: {selectedGame.moderatorName}
                </p>
              </div>
              <button onClick={() => setSelectedGame(null)} className="pm-button pm-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar max-h-[62vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["نتیجه", resultMeta(selectedGame.result).label, resultMeta(selectedGame.result).icon],
                  ["نقش شما", selectedGame.roleName, "theater_comedy"],
                  ["تعداد بازیکن", selectedGame.playerCount, "groups"],
                  ["کد بازی", selectedGame.gameCode ? `#${selectedGame.gameCode}` : "-", "tag"],
                ].map(([label, value, icon]) => (
                  <div key={label} className="pm-muted-card p-3">
                    <span className="material-symbols-outlined text-lg text-[var(--pm-muted)]">{icon as string}</span>
                    <p className="mt-2 truncate text-sm font-black text-[var(--pm-text)]">{value}</p>
                    <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedGame.players.map((player, index) => (
                  <div key={`${selectedGame.id}-${player.name}-${index}`} className="pm-muted-card flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[var(--pm-text)]">{player.name}</p>
                      <p className="mt-1 text-xs text-[var(--pm-muted)]">
                        {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                      </p>
                    </div>
                    <span className={`${alignmentClass(player.alignment)}`}>
                      {alignmentLabel(player.alignment)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedGame.nightEvents && selectedGame.nightEvents.length > 0 && (
                <GameReportTimeline
                  events={selectedGame.nightEvents}
                  title="گزارش منتشرشده بازی"
                  subtitle="اتفاقات مهم بازی با روایت خلاصه گرداننده نمایش داده می‌شود."
                  isPublic={selectedGame.nightRecordsPublic}
                  className="mt-5"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
