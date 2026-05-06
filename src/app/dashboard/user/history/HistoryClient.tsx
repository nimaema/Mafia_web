"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getUserHistoryPage } from "@/actions/dashboard";

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
      effectType?: string;
      secondaryTargetName?: string | null;
      extraTargets?: { id: string; name: string }[];
      targetLabels?: { label: string; playerName?: string | null }[];
      convertedRoleName?: string | null;
      previousRoleName?: string | null;
    } | null;
    note?: string | null;
  }[];
};

function effectLabel(effectType?: string) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
}

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
      className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    };
  }

  if (result === "LOSS") {
    return {
      label: "شکست",
      icon: "close",
      className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",
    };
  }

  return {
    label: "نامشخص",
    icon: "pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };
}

function alignmentLabel(alignment: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: string) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
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
      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="ui-kicker">بایگانی بازی‌ها</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">تاریخچه بازی‌های من</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              هر صفحه ۱۰ بازی را با سناریو، نقش، نتیجه، گرداننده و ترکیب بازیکنان نشان می‌دهد.
            </p>
          </div>
          <Link href="/dashboard/user" className="ui-button-secondary min-h-11 px-4">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
            بازگشت به داشبورد
          </Link>
        </div>
      </section>

      {data.items.length === 0 ? (
        <section className="ui-card flex min-h-[420px] flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="ui-icon size-16">
            <span className="material-symbols-outlined text-4xl text-zinc-400">history</span>
          </div>
          <div>
            <p className="font-black text-zinc-950 dark:text-white">هنوز هیچ بازی ثبت نشده است</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">بعد از پایان بازی‌ها، جزئیاتشان اینجا نمایش داده می‌شود.</p>
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
                <article key={game.id} className="ui-card overflow-hidden transition-all hover:border-cyan-500/25 hover:shadow-lg hover:shadow-zinc-950/5 dark:hover:shadow-black/20">
                  <div className="border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-black text-zinc-950 dark:text-white">{game.scenarioName}</h2>
                          {game.gameCode && (
                            <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                              #{game.gameCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {game.scenarioDescription || game.gameName}
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-black ${result.className}`}>
                        <span className="material-symbols-outlined text-base">{result.icon}</span>
                        {result.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">نقش شما</p>
                        <p className="mt-2 truncate font-black text-zinc-950 dark:text-white">{game.roleName}</p>
                      </div>
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">گرداننده</p>
                        <p className="mt-2 truncate font-black text-zinc-950 dark:text-white">{game.moderatorName}</p>
                      </div>
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">تاریخ</p>
                        <p className="mt-2 truncate font-black text-zinc-950 dark:text-white">{game.date}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">ترکیب بازیکنان</p>
                        <span className="text-xs font-black text-zinc-950 dark:text-white">{game.playerCount} نفر</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewPlayers.map((player, index) => (
                          <span key={`${game.id}-${player.name}-${index}`} className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(player.alignment)}`}>
                            {player.name}: {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                          </span>
                        ))}
                        {extraPlayers > 0 && (
                          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                            +{extraPlayers} بازیکن دیگر
                          </span>
                        )}
                      </div>
                    </div>

                    <button onClick={() => setSelectedGame(game)} className="ui-button-secondary min-h-10 w-full">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      جزئیات کامل بازی
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="ui-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
              نمایش <span className="font-black text-zinc-950 dark:text-white">{start}</span> تا{" "}
              <span className="font-black text-zinc-950 dark:text-white">{end}</span> از{" "}
              <span className="font-black text-zinc-950 dark:text-white">{data.total}</span> بازی
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadPage(data.page - 1)}
                disabled={!data.hasPrevious || isPending}
                className="ui-button-secondary min-h-10 px-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                ۱۰ بازی قبلی
              </button>
              <button
                onClick={() => loadPage(data.page + 1)}
                disabled={!data.hasNext || isPending}
                className="ui-button-primary min-h-10 px-4"
              >
                {isPending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
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
          <section className="ui-card pm-safe-modal w-full max-w-3xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="min-w-0">
                <p className="ui-kicker">جزئیات بازی</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{selectedGame.scenarioName}</h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedGame.date} | گرداننده: {selectedGame.moderatorName}
                </p>
              </div>
              <button onClick={() => setSelectedGame(null)} className="ui-button-secondary size-10 p-0">
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
                  <div key={label} className="ui-muted p-3">
                    <span className="material-symbols-outlined text-lg text-zinc-400">{icon}</span>
                    <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedGame.players.map((player, index) => (
                  <div key={`${selectedGame.id}-${player.name}-${index}`} className="ui-muted flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{player.name}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                      </p>
                    </div>
                    <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(player.alignment)}`}>
                      {alignmentLabel(player.alignment)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedGame.nightEvents && selectedGame.nightEvents.length > 0 && (
                <div className="mt-5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-300">dark_mode</span>
                    <p className="text-sm font-black text-zinc-950 dark:text-white">رکوردهای منتشرشده شب</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedGame.nightEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-cyan-500/20 bg-white p-3 text-xs leading-6 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-zinc-950 dark:text-white">
                            شب {event.nightNumber}: {event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}
                          </p>
                          <span className={event.wasUsed === false ? "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300" : "rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:text-cyan-300"}>
                            {event.wasUsed === false ? "استفاده نشد" : "استفاده شد"}
                          </span>
                          {event.details?.effectType && event.details.effectType !== "NONE" && (
                            <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
                              {effectLabel(event.details.effectType)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1">
                          {event.actorName || event.abilitySource || (event.actorAlignment ? alignmentLabel(event.actorAlignment) : "نامشخص")}
                          {event.wasUsed === false ? " ← بدون هدف" : ` ← ${event.targetName || "نامشخص"}`}
                        </p>
                      {Array.isArray(event.details?.targetLabels) && event.details.targetLabels.length > 0 && (
                        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                          گزینه‌ها: {event.details.targetLabels.map((target) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ")}
                        </p>
                      )}
                      {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && event.details?.secondaryTargetName && (
                        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                          {event.details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: {event.details.secondaryTargetName}
                        </p>
                      )}
                      {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && Array.isArray(event.details?.extraTargets) && event.details.extraTargets.length > 0 && (
                        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                          هدف‌های اضافه: {event.details.extraTargets.map((target: { name: string }) => target.name).join("، ")}
                        </p>
                      )}
                        {event.details?.convertedRoleName && (
                          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                            تبدیل نقش: {event.details.previousRoleName || "نقش قبلی"} ← {event.details.convertedRoleName}
                          </p>
                        )}
                        {event.note && <p className="mt-1 text-zinc-500 dark:text-zinc-400">{event.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
