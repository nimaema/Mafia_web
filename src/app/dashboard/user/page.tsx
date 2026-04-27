"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { getUserStatsSafe } from "@/actions/dashboard";
import { getWaitingGamesSafe } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher";

type DashboardData = {
  statsData: any[];
  roleHistory: any[];
  recentGames: any[];
  currentActiveGame?: any;
  userName?: string | null;
  userImage?: string | null;
};

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
      <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">{icon}</span>
      <div>
        <p className="font-black text-zinc-700 dark:text-zinc-300">{title}</p>
        <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="ui-icon">
          <span className="material-symbols-outlined text-lime-600 dark:text-lime-400">{icon}</span>
        </div>
        <div>
          <h3 className="font-black text-zinc-950 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
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

    return () => {
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

  if (!mounted) {
    return (
      <div className="grid gap-4">
        <div className="ui-card h-40 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="ui-card h-28 animate-pulse" />
          <div className="ui-card h-28 animate-pulse" />
          <div className="ui-card h-28 animate-pulse" />
        </div>
      </div>
    );
  }

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
  const displayName = data?.userName || session?.user?.name || "کاربر";
  const displayImage = data?.userImage || session?.user?.image;
  const mostPlayedRole = roleHistory.reduce((best: any | null, item: any) => {
    if (!best || item.count > best.count) return item;
    return best;
  }, null);
  const latestGame = recentGames[0];

  return (
    <div className="space-y-5 font-sans">
      <section className="ui-card overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative size-20 shrink-0">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-lime-500/30 bg-lime-500/10">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="size-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-lime-500">person</span>
                )}
              </div>
              <span className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-lg bg-lime-500 text-zinc-950 shadow-sm">
                <span className="material-symbols-outlined text-base">verified</span>
              </span>
            </div>

            <div className="min-w-0">
              <p className="ui-kicker">داشبورد بازیکن</p>
              <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">{displayName}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-3 py-1.5 text-xs font-black text-lime-700 dark:text-lime-300">
                  {session?.user?.role === "ADMIN" ? "مدیر سیستم" : session?.user?.role === "MODERATOR" ? "گرداننده رسمی" : "بازیکن فعال"}
                </span>
                <Link href="/dashboard/user/profile" className="ui-button-secondary min-h-8 px-3 py-1.5 text-xs">
                  <span className="material-symbols-outlined text-base">edit</span>
                  ویرایش پروفایل
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["کل بازی", totalGames, "sports_esports"],
              ["برد", wins, "emoji_events"],
              ["نرخ برد", `${winRate}%`, "trending_up"],
            ].map(([label, value, icon]) => (
              <div key={label} className="ui-muted p-4">
                <span className="material-symbols-outlined text-lg text-zinc-400">{icon}</span>
                <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data?.currentActiveGame && (
        <Link href={`/game/${data.currentActiveGame.id}`} className="group flex items-center justify-between gap-4 rounded-lg border border-lime-500/30 bg-lime-500/10 p-4 transition-colors hover:bg-lime-500/15">
          <div className="flex items-center gap-3">
            <div className="ui-icon-accent">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
            <div>
              <p className="font-black text-zinc-950 dark:text-white">شما در یک بازی فعال حضور دارید</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                سناریو: {data.currentActiveGame.scenarioName} | گرداننده: {data.currentActiveGame.moderatorName}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-lime-600 transition-transform group-hover:-translate-x-1 dark:text-lime-400">arrow_back</span>
        </Link>
      )}

      {dashboardError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <span className="material-symbols-outlined text-xl">cloud_off</span>
          <p className="leading-6">{dashboardError}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="ui-card overflow-hidden">
          <PanelHeader
            icon="sensors"
            title="لابی‌های باز"
            subtitle="بازی‌هایی که همین حالا آماده ورود هستند"
            action={<span className="rounded-full bg-lime-500 px-3 py-1 text-xs font-black text-zinc-950">Live</span>}
          />
          <div className="p-5">
            {activeGamesError ? (
              <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
            ) : activeGames.length === 0 ? (
              <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeGames.map((game) => {
                  const capacity = game.scenario?.roles?.reduce((total: number, role: any) => total + role.count, 0) || 0;
                  const joinedPlayers = game._count?.players || 0;
                  const seatsLeft = capacity ? Math.max(capacity - joinedPlayers, 0) : null;
                  const fillPercent = capacity ? Math.min(100, Math.round((joinedPlayers / capacity) * 100)) : 0;

                  return (
                    <Link key={game.id} href={`/lobby/${game.id}`} className="group rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-all hover:-translate-y-0.5 hover:border-lime-500/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-zinc-950 dark:text-white">{game.name}</h4>
                            {game.password && (
                              <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
                                رمزدار
                              </span>
                            )}
                          </div>
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">account_tree</span>
                              {game.scenario?.name || "سناریو انتخاب نشده"}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">person</span>
                              {game.moderator?.name || "گرداننده"}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-xs font-black text-lime-700 dark:text-lime-300">
                          #{game.code}
                        </span>
                      </div>

                      <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/70">
                        <div className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                          <span>بازیکنان</span>
                          <span className="font-black text-zinc-950 dark:text-white">
                            {joinedPlayers}{capacity ? ` / ${capacity}` : ""}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${fillPercent}%` }} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {seatsLeft === null ? "ظرفیت بعد از انتخاب سناریو مشخص می‌شود" : seatsLeft === 0 ? "لابی تکمیل است" : `${seatsLeft} جای خالی`}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-black text-lime-700 dark:text-lime-300">
                            ورود به لابی
                            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <PanelHeader icon="history" title="آخرین بازی‌ها" subtitle="جدیدترین فعالیت‌های ثبت‌شده" action={<Link href="/dashboard/user/history" className="text-xs font-black text-lime-600 dark:text-lime-400">بایگانی</Link>} />
          <div className="space-y-2 p-4">
            {recentGames.length === 0 ? (
              <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
            ) : (
              recentGames.slice(0, 5).map((game: any) => {
                const resultLabel = game.result === "WIN" ? "برد" : game.result === "LOSS" ? "باخت" : "در انتظار";
                const resultClass = game.result === "WIN" ? "bg-lime-500/10 text-lime-600" : game.result === "LOSS" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500";

                return (
                  <button key={game.id} onClick={() => setSelectedHistoryGame(game)} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-right transition-all hover:border-lime-500/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${resultClass}`}>
                          <span className="material-symbols-outlined text-lg">{game.result === "WIN" ? "emoji_events" : game.result === "LOSS" ? "close" : "pending"}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-black text-zinc-950 dark:text-white">{game.scenarioName}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">theater_comedy</span>
                              {game.roleName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">person</span>
                              {game.moderatorName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">event</span>
                              {game.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${resultClass}`}>
                          {resultLabel}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                          {game.players?.length || 0} بازیکن
                          <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="ui-card overflow-hidden">
          <PanelHeader icon="query_stats" title="مرور سریع" subtitle="اطلاعات کاربردی بدون تکرار آمار سربرگ" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="ui-muted p-4">
              <span className={`material-symbols-outlined text-xl ${latestGame?.result === "WIN" ? "text-lime-500" : latestGame?.result === "LOSS" ? "text-red-500" : "text-zinc-400"}`}>
                {latestGame?.result === "WIN" ? "emoji_events" : latestGame?.result === "LOSS" ? "close" : "history"}
              </span>
              <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">آخرین نتیجه</p>
              <p className="mt-1 font-black text-zinc-950 dark:text-white">
                {latestGame ? `${latestGame.result === "WIN" ? "برد" : latestGame.result === "LOSS" ? "باخت" : "در انتظار"} در ${latestGame.scenarioName}` : "هنوز بازی ثبت نشده"}
              </p>
              {latestGame && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{latestGame.roleName} | {latestGame.date}</p>}
            </div>

            <div className="ui-muted p-4">
              <span className="material-symbols-outlined text-xl text-sky-500">theater_comedy</span>
              <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">نقش پرتکرار</p>
              <p className="mt-1 font-black text-zinc-950 dark:text-white">
                {mostPlayedRole ? mostPlayedRole.role : "هنوز نقشی ثبت نشده"}
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {mostPlayedRole ? `${mostPlayedRole.count} بار در تاریخچه` : "بعد از پایان بازی‌ها کامل می‌شود"}
              </p>
            </div>

            <div className="ui-muted p-4">
              <span className="material-symbols-outlined text-xl text-lime-500">radar</span>
              <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">لابی‌های قابل ورود</p>
              <p className="mt-1 font-black text-zinc-950 dark:text-white">{activeGames.length} لابی باز</p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">از بخش لابی‌های باز می‌توانید مستقیم وارد شوید.</p>
            </div>

            <Link href="/dashboard/user/profile" className="ui-muted group p-4 transition-colors hover:border-lime-500/30 hover:bg-white dark:hover:bg-white/[0.05]">
              <span className="material-symbols-outlined text-xl text-purple-500">badge</span>
              <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">پروفایل بازیکن</p>
              <p className="mt-1 truncate font-black text-zinc-950 dark:text-white">{displayName}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-black text-lime-700 dark:text-lime-300">
                ویرایش اطلاعات
                <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
              </p>
            </Link>
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <PanelHeader icon="bar_chart" title="نقش‌های دریافتی" subtitle="فراوانی نقش‌ها در بازی‌های قبلی" />
          <div className="h-72 p-4" dir="ltr">
            {roleHistory.length === 0 ? (
              <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="role" tick={{ fontSize: 10, fill: "#71717a", fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(132,204,22,0.05)" }} contentStyle={{ backgroundColor: "#09090b", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Vazirmatn" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36}>
                    {roleHistory.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#84cc16" : "#0ea5e9"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {selectedHistoryGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur">
          <div className="ui-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
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
                <p className={`mt-2 font-black ${selectedHistoryGame.result === "WIN" ? "text-lime-600" : "text-red-500"}`}>
                  {selectedHistoryGame.result === "WIN" ? "برد" : "باخت"}
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
                      <p className="mt-1 text-xs text-zinc-500">{player.roleName}</p>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                      player.alignment === "CITIZEN" ? "bg-sky-500/10 text-sky-500" :
                      player.alignment === "MAFIA" ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>
                      {player.alignment === "CITIZEN" ? "شهروند" : player.alignment === "MAFIA" ? "مافیا" : player.alignment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
