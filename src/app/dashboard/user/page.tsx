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
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-white/10 dark:bg-[#151515]">
      <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-900 dark:text-white">{title}</p>
        <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function resultMeta(result: string) {
  if (result === "WIN") {
    return {
      label: "برد",
      icon: "emoji_events",
      className: "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
    };
  }

  if (result === "LOSS") {
    return {
      label: "باخت",
      icon: "close",
      className: "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    };
  }

  return {
    label: "نامشخص",
    icon: "pending",
    className: "border border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  };
}

function alignmentLabel(alignment: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: string) {
  if (alignment === "CITIZEN") return "border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400";
  if (alignment === "MAFIA") return "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  return "border border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400";
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">{kicker}</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">{title}</h2>
        {text && <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>}
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
      className={`group relative grid overflow-hidden border border-zinc-200 bg-white shadow-2xl transition-all hover:-translate-y-1 hover:border-red-500 dark:border-white/10 dark:bg-[#0e0e0e] ${
        large ? "min-h-64 p-6" : "min-h-48 p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black">
            <span className="material-symbols-outlined text-xl">groups</span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">لابی باز</p>
              <span className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${isFull ? "border-zinc-500 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300" : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                {isFull ? "تکمیل" : "قابل ورود"}
              </span>
            </div>
            <h3 className={`${large ? "text-2xl leading-9" : "text-base leading-7"} mt-2 line-clamp-2 break-words font-black uppercase tracking-tight text-zinc-900 dark:text-white`}>{game.name}</h3>
            <p className="mt-1 line-clamp-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
          </div>
        </div>
        <span className="border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[10px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          #{game.code}
        </span>
      </div>

      <div className="mt-6 self-end space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">person</span>
              {joinedPlayers}{capacity ? ` / ${capacity}` : ""}
            </span>
            <span className={isFull ? "text-zinc-500" : "text-red-600 dark:text-red-500"}>
              {seatsLeft === null ? "..." : seatsLeft === 0 ? "آماده" : `${seatsLeft} جای خالی`}
            </span>
          </div>
          <div className="mt-3 h-1 bg-zinc-100 dark:bg-white/5">
            <div className="h-full bg-red-600 transition-[width] duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <span className="inline-flex h-10 w-full items-center justify-center gap-2 bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-red-600 dark:bg-white dark:text-black dark:group-hover:bg-red-600 dark:group-hover:text-white">
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
      className="group relative overflow-hidden border border-red-500 bg-black p-5 text-white shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(220,38,38,0.3)]"
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <span className="material-symbols-outlined text-xl">sports_esports</span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">بازی در جریان</p>
              <span className="border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-400">فعال برای شما</span>
            </div>
            <h3 className="mt-2 line-clamp-2 break-words text-lg font-black uppercase tracking-tight text-white leading-tight">{game.scenarioName || "بازی مافیا"}</h3>
            <p className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-zinc-400">گرداننده: {game.moderatorName || "نامشخص"}</p>
          </div>
        </div>
      </div>
      <span className="relative mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-red-600 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-500">
        ورود به بازی
        <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
      </span>
    </Link>
  );
}

function PresenceFaces({ presence }: { presence: PresenceSnapshot }) {
  const members = presence.members.slice(0, 4);

  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-3 space-x-reverse">
        {members.length > 0 ? members.map((member) => (
          <span key={member.id} className="inline-flex size-9 items-center justify-center overflow-hidden border-2 border-zinc-900 bg-zinc-800 text-[10px] font-black text-white dark:border-[#0e0e0e]">
            {member.image ? <img src={member.image} alt="" className="size-full object-cover filter grayscale" /> : (member.name || "ک").slice(0, 1)}
          </span>
        )) : (
          <span className="inline-flex size-9 items-center justify-center border-2 border-zinc-900 bg-zinc-800 text-red-500 dark:border-[#0e0e0e]">
            <span className="material-symbols-outlined text-base">group</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white">{presence.updatedAt ? presence.count : "..."} بازیکن آنلاین</p>
        <p className="mt-0.5 text-[10px] font-medium text-zinc-500">حاضر در پلتفرم</p>
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
      <div className="grid gap-6">
        <div className="h-40 animate-pulse bg-zinc-900 dark:bg-white/5" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="h-[600px] animate-pulse bg-zinc-900 dark:bg-white/5" />
          <div className="h-[600px] animate-pulse bg-zinc-900 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <section className="relative overflow-hidden border border-zinc-200 bg-zinc-900 text-white shadow-2xl dark:border-white/10 dark:bg-black">
        <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative flex size-16 shrink-0 items-center justify-center border border-white/20 bg-white/5 p-1">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="size-full object-cover filter grayscale" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-red-600">person</span>
                )}
                <span className="absolute -bottom-1 -right-1 size-4 border-2 border-black bg-red-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">داشبورد بازیکن</p>
                  <span className="border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-300">{welcomeText}</span>
                </div>
                <h1 className="mt-2 truncate text-3xl font-black uppercase tracking-tight">{displayName}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                <div className="flex flex-col border border-white/10 bg-white/5 px-4 py-2 min-w-[80px]">
                  <span className="text-zinc-500 mb-1">بازی‌ها</span>
                  <span className="text-lg text-white">{totalGames}</span>
                </div>
                <div className="flex flex-col border border-white/10 bg-white/5 px-4 py-2 min-w-[80px]">
                  <span className="text-zinc-500 mb-1">بردها</span>
                  <span className="text-lg text-red-500">{wins}</span>
                </div>
                <div className="flex flex-col border border-white/10 bg-white/5 px-4 py-2 min-w-[80px]">
                  <span className="text-zinc-500 mb-1">نرخ برد</span>
                  <span className="text-lg text-white">{winRate}%</span>
                </div>
              </div>
              
              <div className="h-12 w-px bg-white/10 hidden lg:block mx-2" />
              
              <PresenceFaces presence={presence} />

              <div className="flex gap-2 w-full lg:w-auto">
              {data?.currentActiveGame ? (
                <Link href={`/game/${data.currentActiveGame.id}`} className="group relative flex h-12 flex-1 items-center justify-center gap-2 bg-red-600 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 lg:flex-none">
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  ادامه بازی
                </Link>
              ) : primaryLobby ? (
                <Link href={`/lobby/${primaryLobby.id}`} className="group relative flex h-12 flex-1 items-center justify-center gap-2 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-zinc-200 lg:flex-none">
                  <span className="material-symbols-outlined text-lg">login</span>
                  ورود سریع
                </Link>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <span className="material-symbols-outlined text-xl">cloud_off</span>
          <p className="leading-6">{dashboardError}</p>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="relative border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
          <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
          <SectionIntro kicker="اتاق‌های زنده" title={data?.currentActiveGame ? "بازی فعال و لابی‌ها" : "لابی‌های فعال"} />

          <div className="mt-8">
            {activeGamesError ? (
              <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
            ) : !data?.currentActiveGame && activeGames.length === 0 ? (
              <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data?.currentActiveGame && <ActiveGameTile game={data.currentActiveGame} />}
                {activeGames.slice(0, 6).map((game) => (
                  <LobbyTile key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="relative border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
            <div className="absolute inset-x-0 top-0 h-1 bg-zinc-900 dark:bg-white" />
            <SectionIntro kicker="فرم بازی" title="نمای عملکرد" />
            <div className="mt-8 grid gap-4">
              <div className="relative border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نقش پرتکرار</p>
                    <p className="mt-2 truncate text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">{mostPlayedRole?.role || "ثبت نشده"}</p>
                  </div>
                  <span className="flex size-12 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black">
                    <span className="material-symbols-outlined">psychology</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">آخرین نتیجه</p>
                    {latestGame && (
                      <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${resultMeta(latestGame.result).className}`}>
                        <span className="material-symbols-outlined text-sm">{resultMeta(latestGame.result).icon}</span>
                        {resultMeta(latestGame.result).label}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">{latestGame ? latestGame.scenarioName : "هنوز بازی کامل نشده"}</p>
                </div>

                <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">درصد برد</p>
                    <p className="text-xl font-black text-red-600 dark:text-red-500">{winRate}%</p>
                  </div>
                  <div className="mt-4 h-1 bg-zinc-200 dark:bg-white/10">
                    <div className="h-full bg-red-600" style={{ width: `${winRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
            <SectionIntro kicker="نقش‌ها" title="نقشه نقش‌ها" />
            {roleHistory.length === 0 ? (
              <div className="mt-6">
                <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
              </div>
            ) : (
              <>
                <div className="mt-6 h-56" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0px", fontFamily: "inherit" }} />
                      <Pie data={roleHistory} dataKey="count" nameKey="role" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="none">
                        {roleHistory.map((entry, index) => (
                          <Cell key={`role-slice-${entry.role}`} fill={ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid gap-2">
                  {roleHistory.map((role, index) => (
                    <div key={role.role} className="flex items-center justify-between gap-4 border-b border-zinc-100 py-2 last:border-0 dark:border-white/5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="size-2 shrink-0" style={{ backgroundColor: ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length] }} />
                        <span className="truncate text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{role.role}</span>
                      </span>
                      <span className="font-black text-zinc-900 dark:text-white">{role.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </aside>
      </div>

      <section className="relative border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
        <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
        <SectionIntro
          kicker="بازی‌های اخیر"
          title="آخرین بازی‌ها"
          text="۱۰ بازی آخر با نقش، نتیجه و گرداننده در همینجا دیده می‌شود."
          action={<Link href="/dashboard/user/history" className="group relative flex h-10 items-center justify-center bg-zinc-900 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">تاریخچه کامل</Link>}
        />

        <div className="mt-8 grid gap-3">
          {recentGames.length === 0 ? (
            <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
          ) : (
            recentGames.slice(0, 10).map((game: any, index: number) => {
              const result = resultMeta(game.result);

              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedHistoryGame(game)}
                  className="group relative grid w-full gap-4 border border-zinc-100 bg-zinc-50 p-4 text-right shadow-sm transition-all hover:border-red-500 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:bg-zinc-900 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="absolute inset-y-0 right-0 w-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="hidden size-12 items-center justify-center bg-zinc-900 text-[10px] font-black text-white dark:bg-white dark:text-black sm:flex">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">{game.scenarioName}</span>
                    <span className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span className="border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-black">{game.roleName}</span>
                      <span className="border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-black">{game.moderatorName}</span>
                      <span className="border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-black">{game.date}</span>
                    </span>
                  </span>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <span className={`inline-flex shrink-0 items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${result.className}`}>
                      <span className="material-symbols-outlined text-base">{result.icon}</span>
                      {result.label}
                    </span>
                    <span className="material-symbols-outlined text-xl text-zinc-400 transition-transform group-hover:-translate-x-2">arrow_back</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedHistoryGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedHistoryGame(null)} />
          <div className="relative w-full max-w-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">جزئیات کامل بازی</p>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">{selectedHistoryGame.scenarioName}</h2>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="flex size-12 items-center justify-center bg-zinc-100 text-zinc-500 transition-colors hover:bg-red-600 hover:text-white dark:bg-white/5">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نقش شما</p>
                    <p className="mt-2 text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedHistoryGame.roleName}</p>
                  </div>
                  <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">نتیجه نهایی</p>
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${resultMeta(selectedHistoryGame.result).className}`}>
                        <span className="material-symbols-outlined text-base">{resultMeta(selectedHistoryGame.result).icon}</span>
                        {resultMeta(selectedHistoryGame.result).label}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">گرداننده</p>
                    <p className="mt-2 text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedHistoryGame.moderatorName}</p>
                  </div>
                  <div className="border border-zinc-100 bg-zinc-50 p-5 dark:border-white/5 dark:bg-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">تاریخ بازی</p>
                    <p className="mt-2 text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedHistoryGame.date}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-white/10 pb-4 mb-6">ترکیب بازیکنان</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedHistoryGame.players?.map((player: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border border-zinc-100 bg-zinc-50 p-4 dark:border-white/5 dark:bg-white/5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{player.name}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          {player.roleName}{player.isAlive === false ? " (حذف شده)" : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${alignmentClass(player.alignment)}`}>
                        {alignmentLabel(player.alignment)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedHistoryGame.nightEvents?.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 border-b border-zinc-100 dark:border-white/10 pb-4 mb-6">وقایع منتشر شده</h3>
                  <div className="space-y-4">
                    {selectedHistoryGame.nightEvents.map((event: any) => (
                      <div key={event.id} className="border border-red-500/10 bg-red-500/[0.02] p-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">شب {event.nightNumber}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">{event.abilityLabel}</span>
                          <span className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${event.wasUsed === false ? "border-zinc-500 bg-zinc-500/10 text-zinc-500" : "border-red-500 bg-red-500/10 text-red-500"}`}>
                            {event.wasUsed === false ? "بلااستفاده" : "اجرا شد"}
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-black text-zinc-900 dark:text-white leading-relaxed">
                          {event.actorName || event.abilitySource} {event.wasUsed === false ? "اقدامی انجام نداد." : `روی ${event.targetName || "هدف نامشخص"} اثر گذاشت.`}
                        </p>
                        {event.note && (
                          <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500 border-r-2 border-red-500 pr-3">{event.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 p-6 dark:border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedHistoryGame(null)}
                className="bg-zinc-900 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                بستن گزارش
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
