"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Link from "next/link";
import { getUserStatsSafe } from "@/actions/dashboard";
import { getWaitingGamesSafe } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { usePresenceSnapshot } from "@/hooks/usePresenceSnapshot";
import type { PresenceSnapshot } from "@/lib/presence";

type DashboardData = {
  statsData: any[];
  roleHistory: any[];
  recentGames: any[];
  currentActiveGame?: any;
  userName?: string | null;
  userImage?: string | null;
};

const ROLE_CHART_COLORS = ["#84cc16", "#0ea5e9", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#71717a"];

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-white/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">{icon}</span>
      <div>
        <p className="font-black text-zinc-800 dark:text-zinc-200">{title}</p>
        <p className="mt-1 max-w-sm text-xs font-bold leading-6 text-zinc-500 dark:text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function resultMeta(result: string) {
  if (result === "WIN") {
    return {
      label: "برد",
      icon: "emoji_events",
      className: "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300",
    };
  }

  if (result === "LOSS") {
    return {
      label: "باخت",
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

function effectLabel(effectType?: string) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
}

function gameCapacity(game: any) {
  return game?.scenario?.roles?.reduce((total: number, role: any) => total + role.count, 0) || 0;
}

function playerCount(game: any) {
  return game?._count?.players || game?.playerCount || 0;
}

function SectionIntro({ kicker, title, text, action }: { kicker: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-600 dark:text-lime-400">{kicker}</p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{title}</h2>
        {text && <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function LobbyTile({ game, large = false }: { game: any; large?: boolean }) {
  const capacity = gameCapacity(game);
  const joinedPlayers = playerCount(game);
  const seatsLeft = capacity ? Math.max(capacity - joinedPlayers, 0) : null;
  const progress = capacity ? Math.min(100, Math.round((joinedPlayers / capacity) * 100)) : 0;
  const isFull = capacity ? joinedPlayers >= capacity : false;

  return (
    <Link
      href={`/lobby/${game.id}`}
      className={`group relative grid overflow-hidden rounded-lg border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#f0fdf4_100%)] shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-lime-500/35 hover:shadow-xl hover:shadow-zinc-950/10 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(9,9,11,0.95)_0%,rgba(24,24,27,0.95)_52%,rgba(20,83,45,0.22)_100%)] ${
        large ? "min-h-64 p-5" : "min-h-48 p-4"
      }`}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
      <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-lime-400 via-sky-400 to-transparent opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-lime-500/25 bg-lime-500/10 text-lime-700 shadow-inner dark:text-lime-300">
            <span className="material-symbols-outlined text-xl">groups</span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black text-lime-600 dark:text-lime-400">لابی باز</p>
              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${isFull ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"}`}>
                {isFull ? "تکمیل" : "قابل ورود"}
              </span>
            </div>
            <h3 className={`${large ? "text-2xl leading-9" : "text-base leading-7"} mt-1 line-clamp-2 break-words font-black text-zinc-950 dark:text-white`}>{game.name}</h3>
            <p className="mt-1 line-clamp-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
          </div>
        </div>
        <span className="rounded-lg border border-zinc-200 bg-white/80 px-2 py-1 font-mono text-[10px] font-black text-zinc-600 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300">
          #{game.code}
        </span>
      </div>

      <div className="mt-5 self-end space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-black text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-sky-500">person_check</span>
              {joinedPlayers}{capacity ? ` از ${capacity}` : ""} نفر
            </span>
            <span className={isFull ? "text-amber-600 dark:text-amber-300" : "text-lime-700 dark:text-lime-300"}>
              {seatsLeft === null ? "ظرفیت نامشخص" : seatsLeft === 0 ? "آماده شروع" : `${seatsLeft} جای خالی`}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200/70 ring-1 ring-zinc-950/5 dark:bg-white/10 dark:ring-white/10">
            <div className="h-full rounded-full bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <span className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-zinc-950 px-3 text-xs font-black text-white transition-colors group-hover:bg-lime-500 group-hover:text-zinc-950 dark:bg-white dark:text-zinc-950">
          ورود به لابی
          <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
        </span>
      </div>
    </Link>
  );
}

function ActiveGameTile({ game }: { game: any }) {
  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative overflow-hidden rounded-lg border border-lime-500/25 bg-zinc-950 p-4 text-white shadow-xl shadow-zinc-950/10 transition-all hover:-translate-y-0.5 hover:border-lime-400/60 hover:shadow-2xl hover:shadow-lime-500/10"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.26),transparent_18rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_16rem)]" />
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 shadow-sm shadow-lime-500/30">
            <span className="material-symbols-outlined text-xl">sports_esports</span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black text-lime-300">بازی در جریان</p>
              <span className="rounded-lg border border-lime-300/20 bg-lime-300/10 px-2 py-0.5 text-[10px] font-black text-lime-200">فعال برای شما</span>
            </div>
            <h3 className="mt-1 line-clamp-2 break-words text-lg font-black leading-7 text-white">{game.scenarioName || "بازی مافیا"}</h3>
            <p className="mt-1 truncate text-xs font-bold text-zinc-300">گرداننده: {game.moderatorName || "نامشخص"}</p>
          </div>
        </div>
      </div>
      <span className="relative mt-5 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg bg-lime-400 px-3 text-xs font-black text-zinc-950 transition-colors group-hover:bg-lime-300">
        ورود به بازی
        <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
      </span>
    </Link>
  );
}

function PresenceFaces({ presence }: { presence: PresenceSnapshot }) {
  const members = presence.members.slice(0, 4);

  return (
    <div className="flex items-center gap-3">
      <div className="-space-x-2 space-x-reverse">
        {members.length > 0 ? members.map((member) => (
          <span key={member.id} className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-800 text-xs font-black text-white">
            {member.image ? <img src={member.image} alt="" className="size-full object-cover" /> : (member.name || "ک").slice(0, 1)}
          </span>
        )) : (
          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-800 text-lime-300">
            <span className="material-symbols-outlined text-base">group</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-black text-white">{presence.updatedAt ? presence.count : "..."} نفر آنلاین</p>
        <p className="mt-0.5 text-[10px] font-bold text-zinc-400">بازیکن‌های حاضر در اپ</p>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const presence = usePresenceSnapshot();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [dashboardError, setDashboardError] = useState("");
  const [activeGamesError, setActiveGamesError] = useState("");
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    refreshData();

    const pusher = getPusherClient();
    const channel = pusher.subscribe("lobby");
    channel.bind("game-created", refreshActiveGames);
    channel.bind("lobby-updated", refreshData);

    return () => {
      channel.unbind("game-created", refreshActiveGames);
      channel.unbind("lobby-updated", refreshData);
      pusher.unsubscribe("lobby");
    };
  }, []);

  const refreshData = async () => {
    getUserStatsSafe().then((res) => {
      if (res.data) setData(res.data);
      setDashboardError(res.success ? "" : res.error || "اطلاعات داشبورد بارگذاری نشد.");
    });
    refreshActiveGames();
  };

  const refreshActiveGames = async () => {
    const result = await getWaitingGamesSafe(Date.now());
    setActiveGames(result.data);
    setActiveGamesError(result.success ? "" : result.error || "لابی‌های باز بارگذاری نشدند.");
  };

  const statsData = data?.statsData || [
    { name: "پیروزی‌ها", value: 0, color: "#84cc16" },
    { name: "شکست‌ها", value: 0, color: "#ef4444" },
  ];
  const roleHistory = data?.roleHistory || [];
  const recentGames = data?.recentGames || [];
  const wins = statsData.find((item) => item.name.includes("پیروزی"))?.value || 0;
  const losses = statsData.find((item) => item.name.includes("شکست"))?.value || 0;
  const totalGames = wins + losses;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;
  const displayName = data?.userName || session?.user?.name || "بازیکن";
  const displayImage = data?.userImage || session?.user?.image;
  const mostPlayedRole = roleHistory.reduce((best: any | null, item: any) => {
    if (!best || item.count > best.count) return item;
    return best;
  }, null);
  const latestGame = recentGames[0];
  const primaryLobby = activeGames[0];

  const welcomeText = useMemo(() => {
    if (data?.currentActiveGame) return "بازی فعال";
    if (activeGames.length > 0) return `${activeGames.length} لابی آماده`;
    return "آماده بازی بعدی";
  }, [activeGames.length, data?.currentActiveGame]);

  if (!mounted) {
    return (
      <div className="grid gap-4">
        <div className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" />
          <div className="h-96 animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10 dark:border-white/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/10 sm:size-14">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="size-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-lime-300 sm:text-4xl">person</span>
                )}
                <span className="absolute bottom-1.5 right-1.5 size-3 rounded-full border-2 border-zinc-950 bg-lime-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300 sm:tracking-[0.18em]">داشبورد</p>
                  <span className="max-w-32 truncate rounded-lg border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-black text-zinc-200 sm:max-w-none">{welcomeText}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-black leading-7 sm:text-2xl sm:leading-8">{displayName}</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden flex-wrap gap-2 text-[10px] font-black text-zinc-200 lg:flex">
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
                  <span className="material-symbols-outlined text-base text-lime-300">sports_esports</span>
                  {totalGames} بازی
                </span>
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
                  <span className="material-symbols-outlined text-base text-amber-300">emoji_events</span>
                  {wins} برد
                </span>
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
                  <span className="material-symbols-outlined text-base text-sky-300">trending_up</span>
                  {winRate}% برد
                </span>
              </div>
              <div className="hidden lg:block">
                <PresenceFaces presence={presence} />
              </div>
              {data?.currentActiveGame ? (
                <Link href={`/game/${data.currentActiveGame.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-3 text-xs font-black text-zinc-950 transition-all hover:bg-lime-300 sm:px-4 sm:text-sm">
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  <span className="hidden sm:inline">ادامه</span>
                  <span className="sr-only">ادامه بازی</span>
                </Link>
              ) : primaryLobby ? (
                <Link href={`/lobby/${primaryLobby.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-xs font-black text-zinc-950 transition-all hover:bg-lime-300 sm:px-4 sm:text-sm">
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span className="hidden sm:inline">ورود</span>
                  <span className="sr-only">ورود سریع</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-3 hidden flex-wrap gap-2 text-[10px] font-black text-zinc-200 sm:flex lg:hidden">
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
              <span className="material-symbols-outlined text-base text-lime-300">sports_esports</span>
              {totalGames} بازی
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
              <span className="material-symbols-outlined text-base text-amber-300">emoji_events</span>
              {wins} برد
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3">
              <span className="material-symbols-outlined text-base text-sky-300">trending_up</span>
              {winRate}% برد
            </span>
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <span className="material-symbols-outlined text-xl">cloud_off</span>
          <p className="leading-6">{dashboardError}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_56%,#f0fdf4_100%)] p-4 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.9)_0%,rgba(9,9,11,0.96)_58%,rgba(20,83,45,0.18)_100%)] sm:p-5">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
          <SectionIntro kicker="اتاق‌های زنده" title={data?.currentActiveGame ? "بازی فعال و لابی‌ها" : "لابی‌های فعال"} />

          <div className="mt-5">
            {activeGamesError ? (
              <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
            ) : !data?.currentActiveGame && activeGames.length === 0 ? (
              <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود." />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {data?.currentActiveGame && <ActiveGameTile game={data.currentActiveGame} />}
                {activeGames.slice(0, 6).map((game) => (
                  <LobbyTile key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 sm:p-5">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-sky-400 via-lime-400 to-amber-400" />
            <SectionIntro kicker="فرم بازی" title="نمای عملکرد" />
            <div className="mt-5 grid gap-3">
              <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">نقش پرتکرار</p>
                    <p className="mt-2 truncate text-xl font-black text-zinc-950 dark:text-white">{mostPlayedRole?.role || "ثبت نشده"}</p>
                  </div>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300">
                    <span className="material-symbols-outlined">psychology</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">آخرین نتیجه</p>
                    {latestGame && (
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${resultMeta(latestGame.result).className}`}>
                        <span className="material-symbols-outlined text-sm">{resultMeta(latestGame.result).icon}</span>
                        {resultMeta(latestGame.result).label}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-black text-zinc-950 dark:text-white">{latestGame ? latestGame.scenarioName : "هنوز بازی کامل نشده"}</p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">درصد برد</p>
                    <p className="text-lg font-black text-lime-600 dark:text-lime-300">{winRate}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-l from-lime-400 to-sky-400" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white/90 p-4 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 sm:p-5">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-400 via-sky-400 to-lime-400" />
            <SectionIntro kicker="نقش‌ها" title="نقشه نقش‌ها" />
            {roleHistory.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
              </div>
            ) : (
              <>
                <div className="mt-4 h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Vazirmatn" }} />
                      <Pie data={roleHistory} dataKey="count" nameKey="role" innerRadius={46} outerRadius={76} paddingAngle={3} stroke="none">
                        {roleHistory.map((entry, index) => (
                          <Cell key={`role-slice-${entry.role}`} fill={ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid gap-2">
                  {roleHistory.map((role, index) => (
                    <div key={role.role} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-600 dark:text-zinc-300">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length] }} />
                        <span className="truncate">{role.role}</span>
                      </span>
                      <span className="font-black text-zinc-950 dark:text-white">{role.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

        </aside>
      </div>

      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_54%,#eff6ff_100%)] p-4 shadow-sm shadow-zinc-950/5 backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.9)_0%,rgba(9,9,11,0.96)_60%,rgba(12,74,110,0.18)_100%)] sm:p-5">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-sky-400 via-lime-400 to-amber-400" />
        <SectionIntro
          kicker="بازی‌های اخیر"
          title="آخرین بازی‌ها"
          text="۱۰ بازی آخر با نقش، نتیجه و گرداننده در همینجا دیده می‌شود."
          action={<Link href="/dashboard/user/history" className="ui-button-secondary min-h-10 px-3 text-xs">تاریخچه کامل</Link>}
        />

        <div className="mt-5 grid gap-2">
          {recentGames.length === 0 ? (
            <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
          ) : (
            recentGames.slice(0, 10).map((game: any, index: number) => {
              const result = resultMeta(game.result);

              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedHistoryGame(game)}
                  className="group relative grid w-full gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-white/90 p-3 text-right shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-lime-500/30 hover:shadow-lg hover:shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/75 dark:hover:bg-zinc-950 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-lime-400 via-sky-400 to-transparent opacity-75" />
                  <span className="hidden size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 sm:flex">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black text-zinc-950 dark:text-white">{game.scenarioName}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                      <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]">{game.roleName}</span>
                      <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]">{game.moderatorName}</span>
                      <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-white/10 dark:bg-white/[0.04]">{game.date}</span>
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${result.className}`}>
                      <span className="material-symbols-outlined text-sm">{result.icon}</span>
                      {result.label}
                    </span>
                    <span className="material-symbols-outlined text-base text-zinc-400 transition-transform group-hover:-translate-x-1">arrow_back</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedHistoryGame && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 pb-28 backdrop-blur sm:items-center sm:pb-4">
          <div className="ui-card max-h-[calc(100dvh-8rem)] w-full max-w-2xl overflow-y-auto p-5 sm:max-h-[90vh]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="ui-kicker">خلاصه بازی</p>
                <h3 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{selectedHistoryGame.scenarioName}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{selectedHistoryGame.date}</p>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="ui-button-secondary size-10 p-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="ui-muted p-4">
                <p className="text-xs font-bold text-zinc-500">نقش شما</p>
                <p className="mt-2 font-black text-zinc-950 dark:text-white">{selectedHistoryGame.roleName}</p>
              </div>
              <div className="ui-muted p-4">
                <p className="text-xs font-bold text-zinc-500">گرداننده</p>
                <p className="mt-2 font-black text-zinc-950 dark:text-white">{selectedHistoryGame.moderatorName}</p>
              </div>
              <div className="ui-muted p-4">
                <p className="text-xs font-bold text-zinc-500">نتیجه</p>
                <p className={`mt-2 font-black ${selectedHistoryGame.result === "WIN" ? "text-lime-600" : selectedHistoryGame.result === "LOSS" ? "text-red-500" : "text-amber-500"}`}>
                  {selectedHistoryGame.result === "WIN" ? "برد" : selectedHistoryGame.result === "LOSS" ? "باخت" : "نامشخص"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="mb-3 text-sm font-black text-zinc-700 dark:text-zinc-300">نقش‌های بازیکنان</h4>
              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {selectedHistoryGame.players?.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div>
                      <p className="text-sm font-black text-zinc-950 dark:text-white">{player.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                      </p>
                    </div>
                    <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${alignmentClass(player.alignment)}`}>
                      {alignmentLabel(player.alignment)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedHistoryGame.nightEvents?.length > 0 && (
              <div className="mt-5 rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lime-600 dark:text-lime-300">dark_mode</span>
                  <h4 className="text-sm font-black text-zinc-950 dark:text-white">رکوردهای منتشرشده شب</h4>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedHistoryGame.nightEvents.map((event: any) => (
                    <div key={event.id} className="rounded-lg border border-lime-500/20 bg-white p-3 text-xs leading-6 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-zinc-950 dark:text-white">
                          شب {event.nightNumber}: {event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}
                        </p>
                        <span className={event.wasUsed === false ? "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300" : "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-[10px] font-black text-lime-700 dark:text-lime-300"}>
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
                          گزینه‌ها: {event.details.targetLabels.map((target: { label: string; playerName?: string | null }) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ")}
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
        </div>
      )}
    </div>
  );
}
