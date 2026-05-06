"use client";

import type { Alignment } from "@prisma/client";
import type { ReactNode } from "react";
import { MobilePwaFeatureLock } from "@/components/MobilePwaFeatureLock";
import { ScenarioRoleComposition } from "@/components/ScenarioRoleComposition";

type LobbyPlayer = {
  id: string;
  name: string;
  current?: boolean;
  image?: string | null;
  isAlive?: boolean;
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
  mobileMinimal?: boolean;
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

function getInitial(name: string) {
  const normalized = name.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "?";
}

function PlayerAvatar({ player, alive, size = "md" }: { player: LobbyPlayer; alive: boolean; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "size-8 text-xs" : "size-11 text-sm";

  return (
    <div className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-lg font-black shadow-sm shadow-zinc-950/10 ${alive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-red-500 text-white"}`}>
      {player.image ? (
        <img src={player.image} alt="" className="size-full object-cover" />
      ) : (
        getInitial(player.name)
      )}
      <span className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${alive ? "bg-cyan-500" : "bg-red-500"}`} />
    </div>
  );
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
  mobileMinimal = false,
}: LobbyPreviewCardProps) {
  const progress = capacity > 0 ? Math.min(100, Math.round((playerCount / capacity) * 100)) : 0;
  const seatsLeft = capacity > 0 ? Math.max(capacity - playerCount, 0) : null;
  const aliveCount = players.filter((player) => player.isAlive !== false).length;
  const eliminatedCount = Math.max(0, players.length - aliveCount);
  const citizenCount = roleBreakdown.filter((role) => role.alignment === "CITIZEN").reduce((sum, role) => sum + role.count, 0);
  const mafiaCount = roleBreakdown.filter((role) => role.alignment === "MAFIA").reduce((sum, role) => sum + role.count, 0);
  const neutralCount = roleBreakdown.filter((role) => role.alignment === "NEUTRAL").reduce((sum, role) => sum + role.count, 0);
  const isFull = seatsLeft !== null && seatsLeft <= 0;
  const progressLabel = seatsLeft === null ? "ظرفیت بعد از انتخاب سناریو مشخص می‌شود" : isFull ? "لابی از نظر ظرفیت کامل است" : `${seatsLeft} نفر تا تکمیل ظرفیت`;

  if (compact) {
    const previewPlayers = players.slice(0, 6);
    const previewRoles = roleBreakdown.slice(0, 4);

    return (
      <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/35">
        <div className="border-b border-zinc-200 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-zinc-950 shadow-sm shadow-cyan-500/20">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div className="min-w-0">
                <p className={mobileMinimal ? "hidden sm:block ui-kicker" : "ui-kicker"}>اتاق انتظار</p>
                <h2 className="mt-1 truncate text-xl font-black text-zinc-950 dark:text-white sm:text-2xl">{title}</h2>
                <p className={mobileMinimal ? "mt-1 hidden text-xs leading-5 text-zinc-500 dark:text-zinc-400 sm:line-clamp-2" : "mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400"}>
                  {subtitle || "نمای زنده لابی، ظرفیت و ترکیب سناریو."}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-cyan-500 px-2.5 py-1.5 text-[10px] font-black text-zinc-950">
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-white/10 dark:bg-zinc-950/70">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">کد</p>
              <p className="mt-1 font-mono text-lg font-black text-zinc-950 dark:text-white">#{code}</p>
            </div>
            <div className="col-span-2 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-white/10 dark:bg-zinc-950/70">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">سناریو</p>
              <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">{scenarioName}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <span>ظرفیت لابی</span>
                <span className="font-black text-zinc-950 dark:text-white">
                  {capacity ? `${playerCount} / ${capacity}` : `${playerCount} بازیکن`}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-cyan-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {seatsLeft === null ? "ظرفیت نامشخص" : seatsLeft === 0 ? "لابی تکمیل" : `${seatsLeft} ظرفیت باقی‌مانده`}
                </span>
                <span className="text-cyan-700 dark:text-cyan-300">{progress}% تکمیل</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black text-zinc-950 dark:text-white">بازیکنان حاضر</p>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{moderatorName || "گرداننده"}</p>
              </div>
              {previewPlayers.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {previewPlayers.map((player, index) => {
                    const alive = player.isAlive !== false;
                    return (
                    <div key={player.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${alive ? "border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950/70" : "border-red-500/20 bg-red-500/10"}`}>
                      <PlayerAvatar player={player} alive={alive} size="sm" />
                      <div className="min-w-0">
                        <p className="max-w-24 truncate text-xs font-black text-zinc-950 dark:text-white">{player.current ? "شما" : player.name}</p>
                        <p className={alive ? "text-[9px] font-bold text-zinc-500 dark:text-zinc-400" : "text-[9px] font-bold text-red-600 dark:text-red-300"}>
                          {alive ? `بازیکن ${index + 1}` : "حذف‌شده"}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                  {players.length > previewPlayers.length && (
                    <div className="flex min-h-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                      +{players.length - previewPlayers.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs font-bold leading-5 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                  هنوز بازیکنی وارد لابی نشده است.
                </div>
              )}
            </div>
          </div>

          <aside className={mobileMinimal ? "hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:block" : "rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"}>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ["شهروند", citizenCount, "text-sky-500"],
                ["مافیا", mafiaCount, "text-red-500"],
                ["مستقل", neutralCount, "text-amber-500"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg bg-white p-2 text-center dark:bg-zinc-950/70">
                  <p className={`text-sm font-black ${color}`}>{value}</p>
                  <p className="mt-1 text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                </div>
              ))}
            </div>

            <MobilePwaFeatureLock
              compact
              icon="account_tree"
              title="جزئیات سناریو"
              description="ترکیب کامل نقش‌ها و ابزارهای پیشرفته لابی در همین بخش دیده می‌شود."
              className="mt-3"
            >
              <div className="mt-3 space-y-2">
                {previewRoles.map((role) => (
                  <div key={role.id || role.name} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-zinc-700 dark:text-zinc-300">{role.name}</span>
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                      x{role.count}
                    </span>
                  </div>
                ))}
                {roleBreakdown.length > previewRoles.length && (
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">+{roleBreakdown.length - previewRoles.length} نقش دیگر</p>
                )}
              </div>
            </MobilePwaFeatureLock>
          </aside>
        </div>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#ecfeff_100%)] shadow-xl shadow-zinc-950/10 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.94)_0%,rgba(9,9,11,0.98)_58%,rgba(0,168,150,0.22)_100%)] dark:shadow-black/35">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-cyan-400 via-sky-400 to-amber-400" />

      <header className="pm-contrast-surface relative overflow-hidden border-b border-zinc-200 bg-zinc-950 p-4 text-white dark:border-white/10 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.32),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_20rem)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-zinc-950 shadow-sm shadow-cyan-500/30 sm:size-14">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">groups</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">اتاق انتظار</p>
              <h2 className="mt-1 line-clamp-2 break-words text-2xl font-black leading-8 sm:text-3xl sm:leading-10">{title}</h2>
              <p className="mt-2 line-clamp-2 max-w-2xl text-xs font-bold leading-6 text-zinc-300 sm:text-sm">
                {subtitle || "وضعیت لابی، ظرفیت، بازیکنان و ترکیب سناریو در یک نمای منظم دیده می‌شود."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black sm:text-xs">
            <span className={`rounded-lg px-3 py-1.5 ${isFull ? "bg-cyan-400 text-zinc-950" : "bg-sky-400 text-sky-950"}`}>
              {statusLabel}
            </span>
            <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 font-mono text-white">
              #{code}
            </span>
            {locked && (
              <span className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-amber-200">
                رمزدار
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="order-2 min-w-0 xl:order-1 xl:border-l xl:border-zinc-200 xl:dark:border-white/10">
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <div className="rounded-lg border border-zinc-200 bg-white/85 p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/55">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">کد ورود</p>
              <p className="mt-2 font-mono text-2xl font-black tracking-wide text-zinc-950 dark:text-white">#{code}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white/85 p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/55">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">سناریو</p>
              <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{scenarioName}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white/85 p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/55">
              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">گرداننده</p>
              <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{moderatorName || "نامشخص"}</p>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <span>ظرفیت لابی</span>
                <span className="font-black text-zinc-950 dark:text-white">
                  {capacity ? `${playerCount} / ${capacity}` : `${playerCount} بازیکن`}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200/80 ring-1 ring-zinc-950/5 dark:bg-white/10 dark:ring-white/10">
                <div className="h-full rounded-full bg-gradient-to-l from-cyan-400 via-sky-400 to-amber-400 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400">{progressLabel}</span>
                <span className={isFull ? "font-black text-cyan-700 dark:text-cyan-300" : "font-black text-sky-700 dark:text-sky-300"}>{progress}% تکمیل</span>
              </div>
            </div>
          </div>

          {!compact && (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="ui-kicker">فهرست بازیکنان</p>
                  <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">حاضر در لابی</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                    {capacity > 0 ? `${playerCount} از ${capacity}` : `${playerCount} نفر`}
                  </span>
                  <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-700 dark:text-cyan-300">
                    {aliveCount} فعال
                  </span>
                  {eliminatedCount > 0 && (
                    <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-600 dark:text-red-300">
                      {eliminatedCount} حذف‌شده
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                {players.length ? (
                  players.map((player, index) => {
                    const alive = player.isAlive !== false;
                    return (
                      <div
                        key={player.id}
                        className={`group relative overflow-hidden rounded-lg border p-3 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 dark:shadow-black/20 ${
                          alive ? "border-zinc-200 bg-white/90 hover:border-cyan-500/25 dark:border-white/10 dark:bg-zinc-950/65" : "border-red-500/20 bg-red-500/10"
                        }`}
                      >
                        <span className={`absolute inset-y-0 right-0 w-1 ${alive ? "bg-cyan-500" : "bg-red-500"}`} />
                        <div className="flex min-w-0 items-center gap-3 pr-1">
                          <PlayerAvatar player={player} alive={alive} />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{player.current ? "شما" : player.name}</p>
                              {player.current && (
                                <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black text-cyan-700 dark:text-cyan-300">حساب شما</span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black">
                              <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                                بازیکن {index + 1}
                              </span>
                              <span className={alive ? "rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-cyan-700 dark:text-cyan-300" : "rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-600 dark:text-red-300"}>
                                {alive ? "آماده" : "حذف‌شده"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.03] sm:col-span-2 2xl:col-span-3">
                    <div className="flex size-14 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950">
                      <span className="material-symbols-outlined text-3xl">group_add</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-950 dark:text-white">هنوز کسی به لابی نپیوسته است</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">لینک یا کد ورود را برای بازیکنان بفرستید تا فهرست زنده اینجا پر شود.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="order-1 flex flex-col bg-white/70 dark:bg-zinc-950/20 xl:order-2">
          {actionArea && <div className="border-b border-zinc-200 p-4 dark:border-white/10 sm:p-5">{actionArea}</div>}
          <div className="pm-contrast-surface relative overflow-hidden border-b border-zinc-200 bg-zinc-950 p-5 text-white dark:border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.28),transparent_28rem)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">سناریو</p>
                  <h3 className="mt-2 line-clamp-2 break-words text-xl font-black leading-7 text-white">{scenarioName}</h3>
                  <p className="mt-2 text-xs font-bold text-zinc-300">
                    {roleBreakdown.length ? `${roleBreakdown.length} نوع نقش، ${capacity || playerCount} ظرفیت` : "در انتظار انتخاب سناریو"}
                  </p>
                </div>
                <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-2xl text-zinc-950 shadow-sm shadow-cyan-500/30">account_tree</span>
              </div>

              <div className="mt-5 overflow-hidden rounded-full bg-white/10">
                <div className="flex h-2.5">
                  {[
                    ["bg-sky-400", citizenCount],
                    ["bg-red-400", mafiaCount],
                    ["bg-amber-400", neutralCount],
                  ].map(([className, value]) => (
                    Number(value) > 0 && (
                      <span key={String(className)} className={String(className)} style={{ width: `${capacity ? Math.max(6, (Number(value) / capacity) * 100) : 0}%` }} />
                    )
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["شهروند", citizenCount, "text-sky-200"],
                  ["مافیا", mafiaCount, "text-red-200"],
                  ["مستقل", neutralCount, "text-amber-200"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-2 text-center backdrop-blur">
                    <p className={`text-base font-black ${color}`}>{value}</p>
                    <p className="mt-1 text-[9px] font-bold text-zinc-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5">
            {roleBreakdown.length ? (
              <MobilePwaFeatureLock
                icon="account_tree"
                title="جزئیات سناریو"
                description="ترکیب کامل نقش‌ها و کنترل‌های پیشرفته لابی در همین بخش در دسترس است."
              >
                <details className="group overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]" open={compact}>
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-zinc-950 dark:text-white">فهرست نقش‌ها</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{roleBreakdown.length} نقش در این سناریو</p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-400 transition-transform group-open:rotate-180">keyboard_arrow_down</span>
                  </summary>

                  <div className="custom-scrollbar max-h-[420px] overflow-y-auto border-t border-zinc-200 p-3 dark:border-white/10">
                    <ScenarioRoleComposition roles={roleBreakdown} compact />
                  </div>
                </details>
              </MobilePwaFeatureLock>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <span className="material-symbols-outlined text-3xl text-zinc-400">account_tree</span>
                <p className="mt-3 text-sm font-black text-zinc-950 dark:text-white">سناریو انتخاب نشده</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">بعد از انتخاب سناریو، نقش‌ها اینجا دیده می‌شوند.</p>
              </div>
            )}
          </div>

          {footer && <div className="border-t border-zinc-200 px-5 py-4 dark:border-white/10">{footer}</div>}
        </aside>
      </div>
    </article>
  );
}
