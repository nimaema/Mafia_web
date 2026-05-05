"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getUserStats } from "@/actions/dashboard";
import { getWaitingGames } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

export default function UserDashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    refreshData();
    const pusher = getPusherClient();
    const channel = pusher.subscribe("lobby");
    channel.bind("game-created", refreshActiveGames);
    channel.bind("game-started", refreshActiveGames);
    channel.bind("game-ended", refreshData);
    channel.bind("game-cancelled", refreshData);
    channel.bind("player-joined", refreshActiveGames);
    channel.bind("scenario-updated", refreshActiveGames);
    return () => pusher.unsubscribe("lobby");
  }, []);

  const refreshData = async () => {
    const res = await getUserStats();
    if (res) setData(res);
    refreshActiveGames();
  };

  const refreshActiveGames = async () => {
    setActiveGames(await getWaitingGames(Date.now()));
  };

  if (!mounted) {
    return <EmptyState icon="progress_activity" title="در حال آماده‌سازی اتاق فرمان..." />;
  }

  const wins = data?.statsData?.[0]?.value || 0;
  const losses = data?.statsData?.[1]?.value || 0;
  const recentGames = data?.recentGames || [];
  const roleHistory = [...(data?.roleHistory || [])].sort((a: any, b: any) => b.count - a.count).slice(0, 6);
  const totalRoles = roleHistory.reduce((sum: number, item: any) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-5">
      <CommandSurface className="p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                {data?.userImage || session?.user?.image ? (
                  <img src={data?.userImage || session?.user?.image || ""} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined grid h-full w-full place-items-center text-4xl text-cyan-100">person</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#192122] bg-emerald-300" />
            </div>
            <div className="min-w-0">
              <StatusChip tone="emerald" pulse>آنلاین</StatusChip>
              <h1 className="mt-2 truncate text-2xl font-black tracking-tight text-zinc-50">
                {data?.userName || session?.user?.name || "بازیکن"}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">خانه عملیاتی شما برای ورود سریع به بازی</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="برد" value={wins} tone="emerald" />
            <StatCell label="باخت" value={losses} tone={losses ? "rose" : "neutral"} />
            <StatCell label="بازی" value={recentGames.length} tone="cyan" />
          </div>
        </div>
      </CommandSurface>

      {data?.currentActiveGame && (
        <Link href={`/game/${data.currentActiveGame.id}`} className="block">
          <CommandSurface interactive className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <StatusChip tone="emerald" pulse>بازی فعال</StatusChip>
                <h2 className="mt-2 truncate text-xl font-black text-zinc-50">{data.currentActiveGame.scenarioName}</h2>
                <p className="mt-1 truncate text-sm text-zinc-400">گرداننده: {data.currentActiveGame.moderatorName}</p>
              </div>
              <CommandButton>
                ورود
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </CommandButton>
            </div>
          </CommandSurface>
        </Link>
      )}

      <section className="space-y-3">
        <SectionHeader title="لابی‌های زنده" eyebrow="Live Lobby Rail" icon="sensors" />
        {activeGames.length === 0 ? (
          <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="به محض ساخته شدن لابی، همین‌جا ظاهر می‌شود." />
        ) : (
          <div className="pm-scrollbar flex gap-3 overflow-x-auto pb-2">
            {activeGames.map((game) => (
              <Link key={game.id} href={`/lobby/${game.id}`} className="min-w-[265px]">
                <CommandSurface interactive className="h-full p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-zinc-50">{game.name}</p>
                      <p className="mt-1 font-mono text-xs font-black text-cyan-100">#{game.code}</p>
                    </div>
                    <StatusChip tone={game.status === "IN_PROGRESS" ? "amber" : "emerald"}>
                      {game.status === "IN_PROGRESS" ? "در بازی" : "آماده"}
                    </StatusChip>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="grid h-8 w-8 place-items-center rounded-full border border-[#192122] bg-white/10 text-[10px] font-black text-zinc-300">
                          {i + 1}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-black text-zinc-300">
                      {game.scenario?.roles?.reduce((a: any, b: any) => a + b.count, 0) || "?"} نفر
                    </span>
                  </div>
                </CommandSurface>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <section className="space-y-3">
          <SectionHeader
            title="آخرین بازی‌ها"
            eyebrow="Recent Ledger"
            icon="history"
            action={<CommandButton href="/dashboard/user/history" tone="ghost">بایگانی</CommandButton>}
          />
          {recentGames.length === 0 ? (
            <EmptyState icon="history_toggle_off" title="هنوز گزارشی ثبت نشده" />
          ) : (
            <div className="space-y-2">
              {recentGames.slice(0, 5).map((game: any) => (
                <button key={game.id} onClick={() => setSelectedHistoryGame(game)} className="pm-ledger-row flex w-full items-center justify-between gap-3 p-3 text-right">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`material-symbols-outlined grid h-11 w-11 shrink-0 place-items-center rounded-xl ${game.result === "WIN" ? "bg-emerald-300/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>
                      {game.result === "WIN" ? "emoji_events" : "close"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-zinc-50">{game.scenarioName}</p>
                      <p className="mt-1 truncate text-xs text-zinc-400">{game.roleName} · {game.date}</p>
                    </div>
                  </div>
                  <StatusChip tone={game.result === "WIN" ? "emerald" : "rose"}>
                    {game.result === "WIN" ? "برد" : "باخت"}
                  </StatusChip>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader title="ردیاب نقش" eyebrow="Role Insight" icon="analytics" />
          <CommandSurface className="p-4">
            {roleHistory.length === 0 ? (
              <EmptyState icon="theater_comedy" title="هنوز نقشی ثبت نشده" />
            ) : (
              <div className="space-y-3">
                {roleHistory.map((role: any, index: number) => (
                  <div key={role.role || index}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black">
                      <span className="text-zinc-200">{role.role}</span>
                      <span className="text-cyan-100">{role.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(12, (role.count / totalRoles) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CommandSurface>
        </section>
      </div>

      {selectedHistoryGame && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet w-full max-w-2xl overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusChip tone={selectedHistoryGame.result === "WIN" ? "emerald" : "rose"}>
                  {selectedHistoryGame.result === "WIN" ? "پیروزی" : "شکست"}
                </StatusChip>
                <h3 className="mt-3 text-2xl font-black text-zinc-50">{selectedHistoryGame.scenarioName}</h3>
                <p className="mt-1 text-sm text-zinc-400">{selectedHistoryGame.date} · گرداننده {selectedHistoryGame.moderatorName}</p>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatCell label="نقش شما" value={selectedHistoryGame.roleName} tone={selectedHistoryGame.result === "WIN" ? "emerald" : "rose"} />
              <StatCell label="بازیکنان" value={selectedHistoryGame.players?.length || 0} tone="cyan" />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {selectedHistoryGame.players?.map((player: any, idx: number) => (
                <div key={`${player.name}-${idx}`} className="pm-ledger-row flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-zinc-100">{player.name}</p>
                    <p className="mt-1 truncate text-xs text-zinc-400">{player.roleName}</p>
                  </div>
                  <StatusChip tone={player.alignment === "MAFIA" ? "rose" : player.alignment === "CITIZEN" ? "cyan" : "amber"}>
                    {player.alignment === "MAFIA" ? "مافیا" : player.alignment === "CITIZEN" ? "شهروند" : "مستقل"}
                  </StatusChip>
                </div>
              ))}
            </div>
            {selectedHistoryGame.nightEvents?.length > 0 && (
              <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                <p className="font-black text-cyan-100">گزارش عمومی بازی</p>
                <div className="mt-3 space-y-2">
                  {selectedHistoryGame.nightEvents.map((event: any) => (
                    <div key={event.id} className="pm-ledger-row p-3 text-xs leading-6">
                      <p className="font-black text-zinc-100">دور {event.nightNumber}: {event.abilityLabel}</p>
                      <p className="mt-1 text-zinc-500">{event.actorName || event.abilitySource || "نامشخص"} {event.wasUsed === false ? "بدون هدف" : `← ${event.targetName || "نامشخص"}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
