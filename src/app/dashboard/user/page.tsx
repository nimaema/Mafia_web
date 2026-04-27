"use client";

import { useEffect, useState } from "react";
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
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
      <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">{icon}</span>
      <div>
        <p className="font-black text-zinc-700 dark:text-zinc-300">{title}</p>
        <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-500">{text}</p>
      </div>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
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
    label: "در انتظار",
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

const ROLE_CHART_COLORS = ["#84cc16", "#0ea5e9", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#71717a"];

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
        <div className="ui-card h-36 animate-pulse" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="ui-card h-80 animate-pulse" />
          <div className="ui-card h-80 animate-pulse" />
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
  const statusText = data?.currentActiveGame
    ? `در بازی ${data.currentActiveGame.scenarioName}`
    : activeGames.length > 0
      ? `${activeGames.length} لابی آماده ورود`
      : "در انتظار لابی جدید";

  return (
    <div className="space-y-5 font-sans">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="size-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-lime-500">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="ui-kicker">داشبورد بازیکن</p>
              <h1 className="mt-1 truncate text-3xl font-black text-zinc-950 dark:text-white">{displayName}</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{statusText}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03] lg:min-w-[360px]">
            {[
              ["بازی", totalGames, "sports_esports", "text-lime-500"],
              ["برد", wins, "emoji_events", "text-amber-500"],
              ["درصد برد", `${winRate}%`, "trending_up", "text-sky-500"],
            ].map(([label, value, icon, color], index) => (
              <div key={label} className={`p-3 ${index > 0 ? "border-r border-zinc-200 dark:border-white/10" : ""}`}>
                <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
                <p className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{value}</p>
                <p className="mt-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <span className="material-symbols-outlined text-xl">cloud_off</span>
          <p className="leading-6">{dashboardError}</p>
        </div>
      )}

      <section className="ui-card overflow-hidden">
        <PanelHeader icon="rocket_launch" title="اقدام بعدی" subtitle="مسیر اصلی شما برای ادامه بازی" />
        <div className="p-5">
          {data?.currentActiveGame ? (
            <Link
              href={`/game/${data.currentActiveGame.id}`}
              className="group flex min-h-40 flex-col justify-between rounded-lg border border-lime-500/25 bg-lime-500/10 p-5 transition-colors hover:bg-lime-500/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-lime-700 dark:text-lime-300">بازی فعال</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{data.currentActiveGame.scenarioName}</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">گرداننده: {data.currentActiveGame.moderatorName}</p>
                </div>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-zinc-950">
                  <span className="material-symbols-outlined">play_arrow</span>
                </div>
              </div>
              <p className="mt-5 flex items-center gap-1 text-sm font-black text-lime-700 dark:text-lime-300">
                ورود به صفحه بازی
                <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
              </p>
            </Link>
          ) : activeGamesError ? (
            <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
          ) : activeGames.length === 0 ? (
            <div className="grid gap-3">
              <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود." />
              <Link href="/join" className="ui-button-secondary min-h-11 w-full">
                <span className="material-symbols-outlined text-lg">login</span>
                ورود با کد بازی
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {activeGames.slice(0, 4).map((game) => {
                const capacity = game.scenario?.roles?.reduce((total: number, role: any) => total + role.count, 0) || 0;
                const joinedPlayers = game._count?.players || 0;
                const seatsLeft = capacity ? Math.max(capacity - joinedPlayers, 0) : null;

                return (
                  <Link
                    key={game.id}
                    href={`/lobby/${game.id}`}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-all hover:border-lime-500/35 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-zinc-950 dark:text-white">{game.name}</h3>
                        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{game.scenario?.name || "سناریو انتخاب نشده"}</p>
                      </div>
                      <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 font-mono text-[10px] font-black text-lime-700 dark:text-lime-300">
                        #{game.code}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      <span>{joinedPlayers}{capacity ? ` / ${capacity}` : ""} بازیکن</span>
                      <span>{seatsLeft === null ? "ظرفیت نامشخص" : seatsLeft === 0 ? "تکمیل" : `${seatsLeft} جای خالی`}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="ui-card overflow-hidden">
        <PanelHeader icon="near_me" title="میانبرهای سریع" subtitle="کارهای پرکاربرد بدون تکرار آمار" />
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            ["/join", "ورود با کد", "پیوستن مستقیم به یک لابی", "login"],
            ["/dashboard/user/history", "تاریخچه کامل", "مرور بازی‌ها با جزئیات نقش‌ها", "history"],
            ["/dashboard/user/profile", "پروفایل بازیکن", "ویرایش نام و تصویر حساب", "badge"],
          ].map(([href, label, text, icon]) => (
            <Link
              key={href}
              href={href}
              className="group block rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-all hover:border-lime-500/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-zinc-950 dark:text-white">{label}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{text}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-base text-zinc-400 transition-transform group-hover:-translate-x-1">arrow_back</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="ui-card overflow-hidden">
          <PanelHeader icon="history" title="آخرین بازی‌ها" subtitle="تا ۸ بازی تازه" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {recentGames.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
              </div>
            ) : (
              recentGames.slice(0, 8).map((game: any) => {
                const result = resultMeta(game.result);

                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedHistoryGame(game)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-right transition-all hover:border-lime-500/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-950 dark:text-white">{game.scenarioName}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{game.roleName} | {game.date}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black ${result.className}`}>
                        <span className="material-symbols-outlined text-sm">{result.icon}</span>
                        {result.label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="ui-card overflow-hidden">
          <PanelHeader
            icon="donut_small"
            title="نقش‌های دریافتی"
            subtitle={mostPlayedRole ? `۶ نقش برتر + سایر | اول: ${mostPlayedRole.role}` : "بعد از چند بازی کامل‌تر می‌شود"}
          />
          <div className="p-4">
            {roleHistory.length === 0 ? (
              <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
            ) : (
              <>
                <div className="h-52" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Vazirmatn" }} />
                      <Pie data={roleHistory} dataKey="count" nameKey="role" innerRadius={48} outerRadius={80} paddingAngle={3} stroke="none">
                        {roleHistory.map((entry, index) => (
                          <Cell key={`role-slice-${entry.role}`} fill={ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2">
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
                    <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${alignmentClass(player.alignment)}`}>
                      {alignmentLabel(player.alignment)}
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
