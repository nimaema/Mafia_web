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

  return (
    <div className="space-y-6" dir="rtl">
      <section className="pm-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[var(--pm-primary)] uppercase">بایگانی بازی‌ها</p>
            <h1 className="mt-1 text-3xl font-black text-[var(--pm-text)]">تاریخچه بازی‌های من</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pm-muted)]">
              هر صفحه ۱۰ بازی را با سناریو، نقش، نتیجه، گرداننده و ترکیب بازیکنان نشان می‌دهد.
            </p>
          </div>
          <Link href="/dashboard/user" className="pm-button pm-button-secondary min-h-11 px-4">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
            بازگشت به داشبورد
          </Link>
        </div>
      </section>

      {data.items.length === 0 ? (
        <section className="pm-card flex min-h-[420px] flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--pm-surface-strong)] text-[var(--pm-muted)] shadow-[var(--pm-shadow-soft)]">
            <span className="material-symbols-outlined text-4xl">history</span>
          </div>
          <div>
            <p className="font-black text-[var(--pm-text)]">هنوز هیچ بازی ثبت نشده است</p>
            <p className="mt-1 text-sm text-[var(--pm-muted)]">بعد از پایان بازی‌ها، جزئیاتشان اینجا نمایش داده می‌شود.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            {data.items.map((game) => {
              const result = resultMeta(game.result);
              const previewPlayers = game.players.slice(0, 4);
              const extraPlayers = Math.max(0, game.players.length - previewPlayers.length);

              return (
                <article key={game.id} className="pm-card overflow-hidden transition-all hover:border-[var(--pm-primary)]/50 hover:shadow-[0_0_20px_var(--pm-primary-glow)]">
                  <div className="border-b border-[var(--pm-line)] bg-[var(--pm-surface-strong)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-black text-[var(--pm-text)]">{game.scenarioName}</h2>
                          {game.gameCode && (
                            <span className="pm-chip bg-[var(--pm-surface)]">
                              #{game.gameCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--pm-muted)]">
                          {game.scenarioDescription || game.gameName}
                        </p>
                      </div>
                      <span className={`${result.className} inline-flex shrink-0 items-center gap-1`}>
                        <span className="material-symbols-outlined text-base">{result.icon}</span>
                        {result.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="pm-muted-card p-3">
                        <p className="text-[10px] font-bold text-[var(--pm-muted)]">نقش شما</p>
                        <p className="mt-2 truncate font-black text-[var(--pm-text)]">{game.roleName}</p>
                      </div>
                      <div className="pm-muted-card p-3">
                        <p className="text-[10px] font-bold text-[var(--pm-muted)]">گرداننده</p>
                        <p className="mt-2 truncate font-black text-[var(--pm-text)]">{game.moderatorName}</p>
                      </div>
                      <div className="pm-muted-card p-3">
                        <p className="text-[10px] font-bold text-[var(--pm-muted)]">تاریخ</p>
                        <p className="mt-2 truncate font-black text-[var(--pm-text)]">{game.date}</p>
                      </div>
                    </div>

                    <div className="pm-muted-card p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-[var(--pm-muted)]">ترکیب بازیکنان</p>
                        <span className="text-xs font-black text-[var(--pm-text)]">{game.playerCount} نفر</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewPlayers.map((player, index) => (
                          <span key={`${game.id}-${player.name}-${index}`} className={`${alignmentClass(player.alignment)}`}>
                            {player.name}: {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                          </span>
                        ))}
                        {extraPlayers > 0 && (
                          <span className="pm-chip bg-[var(--pm-surface)]">
                            +{extraPlayers} بازیکن دیگر
                          </span>
                        )}
                      </div>
                    </div>

                    <button onClick={() => setSelectedGame(game)} className="pm-button pm-button-secondary min-h-10 w-full">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      جزئیات کامل بازی
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="pm-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold text-[var(--pm-muted)]">
              نمایش <span className="font-black text-[var(--pm-text)]">{start}</span> تا{" "}
              <span className="font-black text-[var(--pm-text)]">{end}</span> از{" "}
              <span className="font-black text-[var(--pm-text)]">{data.total}</span> بازی
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadPage(data.page - 1)}
                disabled={!data.hasPrevious || isPending}
                className="pm-button pm-button-secondary min-h-10 px-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                ۱۰ بازی قبلی
              </button>
              <button
                onClick={() => loadPage(data.page + 1)}
                disabled={!data.hasNext || isPending}
                className="pm-button pm-button-primary min-h-10 px-4"
              >
                {isPending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-[var(--pm-surface-strong)] border-t-[var(--pm-text)]" />
                ) : (
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                )}
                ۱۰ بازی بعدی
              </button>
            </div>
          </section>
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
