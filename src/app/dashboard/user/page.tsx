"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { getUserStats } from "@/actions/dashboard";
import { getWaitingGames } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher";

type DashboardData = {
  statsData: any[];
  roleHistory: any[];
  recentGames: any[];
  currentActiveGame?: any;
  userName?: string | null;
  userEmail?: string | null;
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
    getUserStats().then((res) => {
      if (res) setData(res);
    });
    refreshActiveGames();
  };

  const refreshActiveGames = async () => {
    const games = await getWaitingGames(Date.now());
    setActiveGames(games);
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
  const displayEmail = data?.userEmail || session?.user?.email || "نامشخص";

  return (
    <div className="space-y-5 font-sans">
      <section className="ui-card overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative size-20 shrink-0">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-lime-500/30 bg-lime-500/10">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Profile" className="size-full object-cover" />
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
              <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400" dir="ltr">{displayEmail}</p>
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

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="ui-card overflow-hidden">
          <PanelHeader
            icon="sensors"
            title="لابی‌های باز"
            subtitle="بازی‌هایی که همین حالا آماده ورود هستند"
            action={<span className="rounded-full bg-lime-500 px-3 py-1 text-xs font-black text-zinc-950">Live</span>}
          />
          <div className="p-5">
            {activeGames.length === 0 ? (
              <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeGames.map((game) => (
                  <Link key={game.id} href={`/lobby/${game.id}`} className="group rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-all hover:border-lime-500/40 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-zinc-950 dark:text-white">{game.name}</h4>
                          {game.password && <span className="material-symbols-outlined text-sm text-amber-500">lock</span>}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          #{game.code} | {game.moderator?.name || "گرداننده"}
                        </p>
                      </div>
                      <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-xs font-black text-lime-700 dark:text-lime-300">
                        {game.scenario?.roles.reduce((a: any, b: any) => a + b.count, 0)} نفر
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex -space-x-2 space-x-reverse">
                        {[1, 2, 3].map((i) => (
                          <span key={i} className="flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                            <span className="material-symbols-outlined text-sm text-zinc-400">person</span>
                          </span>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-black text-lime-700 dark:text-lime-300">
                        ورود
                        <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
                      </span>
                    </div>
                  </Link>
                ))}
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
              recentGames.slice(0, 5).map((game: any) => (
                <button key={game.id} onClick={() => setSelectedHistoryGame(game)} className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-right transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${game.result === "WIN" ? "bg-lime-500/10 text-lime-600" : "bg-red-500/10 text-red-500"}`}>
                      <span className="material-symbols-outlined text-lg">{game.result === "WIN" ? "emoji_events" : "close"}</span>
                    </span>
                    <div>
                      <p className="font-black text-zinc-950 dark:text-white">{game.scenarioName}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{game.roleName} | {game.date}</p>
                    </div>
                  </div>
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${game.result === "WIN" ? "bg-lime-500/10 text-lime-600" : "bg-red-500/10 text-red-500"}`}>
                    {game.result === "WIN" ? "برد" : "باخت"}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="ui-card overflow-hidden">
          <PanelHeader icon="pie_chart" title="عملکرد بازی‌ها" subtitle="نسبت برد و باخت" />
          <div className="h-72 p-4">
            {totalGames === 0 ? (
              <EmptyState icon="analytics" title="داده‌ای برای تحلیل نیست" text="با ثبت نتیجه بازی‌ها، نمودار عملکرد ساخته می‌شود." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statsData} cx="50%" cy="50%" innerRadius={72} outerRadius={96} paddingAngle={6} dataKey="value" stroke="none">
                    {statsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Vazirmatn" }} itemStyle={{ color: "#fff", fontSize: "12px" }} />
                  <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="px-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
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
