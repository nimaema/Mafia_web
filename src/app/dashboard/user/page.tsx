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
import { getPusherClient } from "@/lib/pusher-client";

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
    <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950">
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
        <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-lg shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.03]">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="size-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-lime-500">person</span>
              )}
              <span className="absolute bottom-2 right-2 size-3 rounded-full border-2 border-white bg-lime-500 dark:border-zinc-950" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="ui-kicker">داشبورد بازیکن</p>
                <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300">
                  {statusText}
                </span>
              </div>
              <h1 className="mt-2 line-clamp-2 break-words text-3xl font-black leading-10 text-zinc-950 dark:text-white">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                لابی‌های فعال، مسیر بعدی، تاریخچه تازه و الگوی نقش‌های شما در یک نمای فشرده و قابل اسکن.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["بازی", totalGames, "sports_esports", "text-lime-500", "bg-lime-500/10"],
              ["برد", wins, "emoji_events", "text-amber-500", "bg-amber-500/10"],
              ["درصد برد", `${winRate}%`, "trending_up", "text-sky-500", "bg-sky-500/10"],
            ].map(([label, value, icon, color, bg]) => (
              <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className={`flex size-9 items-center justify-center rounded-lg ${bg}`}>
                  <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                </div>
                <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
                <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
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
        <PanelHeader icon="radar" title="لابی‌ها و ادامه بازی" subtitle="وضعیت زنده بازی‌های قابل ورود" />
        <div className="p-5">
          {data?.currentActiveGame ? (
            <Link
              href={`/game/${data.currentActiveGame.id}`}
              className="group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-lg border border-lime-500/25 bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/15 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-lime-400" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-lime-300 dark:text-lime-700">بازی فعال</p>
                  <h2 className="mt-2 text-2xl font-black">{data.currentActiveGame.scenarioName}</h2>
                  <p className="mt-2 text-sm text-zinc-300 dark:text-zinc-600">گرداننده: {data.currentActiveGame.moderatorName}</p>
                </div>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-zinc-950">
                  <span className="material-symbols-outlined">play_arrow</span>
                </div>
              </div>
              <p className="mt-5 flex items-center gap-1 text-sm font-black text-lime-300 dark:text-lime-700">
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
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {activeGames.slice(0, 4).map((game) => {
                const capacity = game.scenario?.roles?.reduce((total: number, role: any) => total + role.count, 0) || 0;
                const joinedPlayers = game._count?.players || 0;
                const seatsLeft = capacity ? Math.max(capacity - joinedPlayers, 0) : null;
                const progress = capacity ? Math.min(100, Math.round((joinedPlayers / capacity) * 100)) : 0;

                return (
	                  <Link
	                    key={game.id}
	                    href={`/lobby/${game.id}`}
	                    className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-lime-500/35 hover:shadow-lg hover:shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950"
	                  >
	                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 to-sky-400" />
	                    <div className="flex items-start justify-between gap-3">
	                      <div className="flex min-w-0 items-start gap-3">
	                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300">
	                          <span className="material-symbols-outlined text-xl">groups</span>
	                        </span>
	                        <div className="min-w-0">
	                          <p className="text-[10px] font-black text-lime-600 dark:text-lime-400">اتاق انتظار</p>
	                          <h3 className="mt-1 line-clamp-2 break-words font-black leading-6 text-zinc-950 dark:text-white">{game.name}</h3>
	                          <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{game.scenario?.name || "سناریو انتخاب نشده"}</p>
	                        </div>
	                      </div>
	                      <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 font-mono text-[10px] font-black text-lime-700 dark:text-lime-300">
	                        #{game.code}
	                      </span>
	                    </div>
	                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
	                      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
	                        <span>{joinedPlayers}{capacity ? ` / ${capacity}` : ""} بازیکن</span>
	                        <span>{seatsLeft === null ? "ظرفیت نامشخص" : seatsLeft === 0 ? "تکمیل" : `${seatsLeft} ظرفیت`}</span>
	                      </div>
	                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
	                        <div className="h-full rounded-full bg-lime-500 transition-[width]" style={{ width: `${progress}%` }} />
	                      </div>
	                    </div>
	                    <div className="mt-3 flex items-center justify-between text-xs font-black text-zinc-500 dark:text-zinc-400">
	                      <span>ورود به لابی</span>
	                      <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-1">arrow_back</span>
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
            ["/dashboard/user/history", "تاریخچه کامل", "مرور بازی‌ها با جزئیات نقش‌ها", "history", "from-lime-400 to-emerald-500"],
            ["/dashboard/user/profile", "پروفایل بازیکن", "ویرایش نام و تصویر حساب", "badge", "from-sky-400 to-blue-500"],
            ["/", "صفحه اصلی", "بازگشت به نمای معرفی و شروع", "home", "from-amber-400 to-orange-500"],
          ].map(([href, label, text, icon, accent]) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-lime-500/30 hover:shadow-lg hover:shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950"
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${accent}`} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 shadow-sm shadow-zinc-950/5 dark:bg-white/[0.04] dark:text-zinc-400">
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
                    className="group relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 text-right shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-lime-500/30 hover:shadow-lg hover:shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950"
                  >
                    <span className={`absolute bottom-0 right-0 top-0 w-1 ${game.result === "WIN" ? "bg-lime-500" : game.result === "LOSS" ? "bg-red-500" : "bg-amber-500"}`} />
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
                    <p className="mt-3 flex items-center gap-1 text-[10px] font-black text-zinc-400 transition-colors group-hover:text-lime-600 dark:group-hover:text-lime-300">
                      مشاهده جزئیات
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
                    </p>
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
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-zinc-950 dark:text-white">{mostPlayedRole?.role || "نقش محبوب"}</p>
                      <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بیشترین نقش دریافتی</p>
                    </div>
                    <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-xs font-black text-lime-700 dark:text-lime-300">
                      {mostPlayedRole?.count || 0} بار
                    </span>
                  </div>
                </div>
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
