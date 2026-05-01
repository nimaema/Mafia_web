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
      <span className={`absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${alive ? "bg-lime-500" : "bg-red-500"}`} />
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

  if (compact) {
    const previewPlayers = players.slice(0, 6);
    const previewRoles = roleBreakdown.slice(0, 4);

    return (
      <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/35">
        <div className="border-b border-zinc-200 bg-zinc-50/90 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-zinc-950 shadow-sm shadow-lime-500/20">
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
            <span className="shrink-0 rounded-lg bg-lime-500 px-2.5 py-1.5 text-[10px] font-black text-zinc-950">
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
                <div className="h-full rounded-full bg-lime-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {seatsLeft === null ? "ظرفیت نامشخص" : seatsLeft === 0 ? "لابی تکمیل" : `${seatsLeft} ظرفیت باقی‌مانده`}
                </span>
                <span className="text-lime-700 dark:text-lime-300">{progress}% تکمیل</span>
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
              title="جزئیات سناریو در نسخه نصب‌شده"
              description="روی موبایل، ترکیب کامل نقش‌ها و ابزارهای پیشرفته لابی داخل PWA فعال می‌شود."
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
    <article className="ui-card overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-b border-zinc-200 dark:border-white/10 xl:border-b-0 xl:border-l">
          <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-zinc-950 shadow-sm shadow-lime-500/20">
                  <span className="material-symbols-outlined text-3xl">groups</span>
                </div>
                <div className="min-w-0">
                  <p className="ui-kicker">اتاق انتظار</p>
                  <h2 className="mt-1 truncate text-3xl font-black text-zinc-950 dark:text-white">{title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {subtitle || "وضعیت لابی، ظرفیت، بازیکنان و ترکیب سناریو در یک نمای منظم دیده می‌شود."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-lime-500 px-3 py-1.5 text-xs font-black text-zinc-950">
                  {statusLabel}
                </span>
                {locked && (
                  <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-600 dark:text-amber-300">
                    رمزدار
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/50">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">کد ورود</p>
                <p className="mt-2 font-mono text-2xl font-black tracking-wide text-zinc-950 dark:text-white">#{code}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/50">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">سناریو</p>
                <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{scenarioName}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/50">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">گرداننده</p>
                <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{moderatorName || "نامشخص"}</p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <span>ظرفیت لابی</span>
                <span className="font-black text-zinc-950 dark:text-white">
                  {capacity ? `${playerCount} / ${capacity}` : `${playerCount} بازیکن`}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-lime-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400">
                  {seatsLeft === null ? "ظرفیت بعد از انتخاب سناریو مشخص می‌شود" : seatsLeft === 0 ? "لابی تکمیل است" : `${seatsLeft} ظرفیت باقی‌مانده`}
                </span>
                <span className="font-black text-lime-700 dark:text-lime-300">{progress}% تکمیل</span>
              </div>
            </div>
          </div>

          {!compact && (
            <div className="p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="ui-kicker">فهرست بازیکنان</p>
                  <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">حاضر در لابی</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                    {capacity > 0 ? `${playerCount} از ${capacity}` : `${playerCount} نفر`}
                  </span>
                  <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-lime-700 dark:text-lime-300">
                    {aliveCount} فعال
                  </span>
                  {eliminatedCount > 0 && (
                    <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-600 dark:text-red-300">
                      {eliminatedCount} حذف‌شده
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/60">
                {players.length ? (
                  players.map((player, index) => {
                    const alive = player.isAlive !== false;
                    return (
                    <div
                      key={player.id}
                      className={`group relative grid gap-3 border-b border-zinc-200 p-3 transition-all last:border-b-0 dark:border-white/10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                        alive ? "bg-white hover:bg-lime-500/[0.04] dark:bg-transparent dark:hover:bg-white/[0.04]" : "bg-red-500/10"
                      }`}
                    >
                      <div className={`absolute inset-y-3 right-0 w-1 rounded-l-full ${alive ? "bg-lime-500" : "bg-red-500"}`} />
                      <div className="flex min-w-0 items-center gap-3 pr-1">
                        <PlayerAvatar player={player} alive={alive} />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{player.name}</p>
                            {player.current && (
                              <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-[9px] font-black text-lime-700 dark:text-lime-300">شما</span>
                            )}
                          </div>
                          <p className={alive ? "mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400" : "mt-1 text-[10px] font-bold text-red-600 dark:text-red-300"}>
                            {alive ? "آماده ورود به بازی" : "از بازی حذف شده"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                          #{index + 1}
                        </span>
                        <span className={alive ? "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300" : "rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-600 dark:text-red-300"}>
                          {alive ? "فعال" : "حذف‌شده"}
                        </span>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center gap-3 bg-zinc-50 p-6 text-center dark:bg-white/[0.03]">
                    <div className="flex size-14 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950">
                      <span className="material-symbols-outlined text-3xl">group_add</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-950 dark:text-white">هنوز کسی به لابی نپیوسته است</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">لینک یا کد ورود را برای بازیکنان بفرستید تا فهرست زنده اینجا پر شود.</p>
                    </div>
                  </div>
                )}
              </div>

              {seatsLeft !== null && seatsLeft > 0 && (
                <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3 text-sm font-bold leading-6 text-sky-700 dark:text-sky-300">
                  ظرفیت باقی‌مانده برای این سناریو: {seatsLeft} نفر
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col bg-white dark:bg-zinc-950/20">
          <div className="relative overflow-hidden border-b border-zinc-200 bg-zinc-950 p-5 text-white dark:border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.28),transparent_28rem)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">سناریو</p>
                  <h3 className="mt-2 line-clamp-2 break-words text-xl font-black leading-7 text-white">{scenarioName}</h3>
                  <p className="mt-2 text-xs font-bold text-zinc-300">
                    {roleBreakdown.length ? `${roleBreakdown.length} نوع نقش، ${capacity || playerCount} ظرفیت` : "در انتظار انتخاب سناریو"}
                  </p>
                </div>
                <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-2xl text-zinc-950 shadow-sm shadow-lime-500/30">account_tree</span>
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
                title="جزئیات سناریو فقط در PWA موبایل"
                description="برای دیدن ترکیب کامل نقش‌ها و کنترل‌های پیشرفته لابی، برنامه را روی موبایل نصب کنید."
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

          {actionArea && <div className="border-t border-zinc-200 p-5 dark:border-white/10">{actionArea}</div>}
          {footer && <div className="border-t border-zinc-200 px-5 py-4 dark:border-white/10">{footer}</div>}
        </aside>
      </div>
    </article>
  );
}
