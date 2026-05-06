"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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

const ROLE_CHART_COLORS = ["#00F5D4", "#8B5CF6", "#22C55E", "#F59E0B", "#F43F5E", "#38BDF8", "#64748B"];

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="pm-muted-card flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="material-symbols-outlined text-4xl text-zinc-400 dark:text-white/30">{icon}</span>
      <div>
        <p className="font-black text-zinc-950 dark:text-white">{title}</p>
        <p className="mt-1 max-w-sm text-xs font-bold leading-6 text-zinc-500 dark:text-white/48">{text}</p>
      </div>
    </div>
  );
}

function resultMeta(result: string) {
  if (result === "WIN") {
    return { label: "برد", icon: "emoji_events", className: "pm-chip pm-chip-success" };
  }
  if (result === "LOSS") {
    return { label: "باخت", icon: "close", className: "pm-chip pm-chip-danger" };
  }
  return { label: "نامشخص", icon: "pending", className: "pm-chip pm-chip-warning" };
}

function alignmentLabel(alignment: string) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: string) {
  if (alignment === "CITIZEN") return "pm-chip border-sky-400/25 bg-sky-400/10 text-sky-700 dark:text-sky-200";
  if (alignment === "MAFIA") return "pm-chip pm-chip-danger";
  return "pm-chip pm-chip-warning";
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

function initials(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 1) : "م";
}

function buildRoleChartData(roleHistory: any[]) {
  const sorted = [...roleHistory].sort((a, b) => (b.count || 0) - (a.count || 0));
  const top = sorted.slice(0, 6);
  const others = sorted.slice(6).reduce((sum, item) => sum + (item.count || 0), 0);
  return others > 0 ? [...top, { role: "سایر", count: others }] : top;
}

function PresenceFaces({ presence }: { presence: PresenceSnapshot }) {
  const members = presence.members.slice(0, 4);

  return (
    <div className="flex items-center gap-3">
      <div className="-space-x-2 space-x-reverse">
        {members.length > 0 ? members.map((member) => (
          <span key={member.id} className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-100 text-xs font-black text-zinc-700 dark:border-[#15171b] dark:bg-white/10 dark:text-white">
            {member.image ? <img src={member.image} alt="" className="size-full object-cover" /> : initials(member.name)}
          </span>
        )) : (
          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-cyan-500/10 text-cyan-700 dark:border-[#15171b] dark:bg-white/10 dark:text-cyan-200">
            <span className="material-symbols-outlined text-base">group</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-black text-zinc-950 dark:text-white">{presence.updatedAt ? presence.count : "..."} آنلاین</p>
        <p className="mt-0.5 text-[10px] font-bold text-zinc-500 dark:text-white/42">حاضر در اپ</p>
      </div>
    </div>
  );
}

function LiveLobbyCard({ game, active = false }: { game: any; active?: boolean }) {
  const capacity = gameCapacity(game);
  const joinedPlayers = playerCount(game);
  const progress = capacity ? Math.min(100, Math.round((joinedPlayers / capacity) * 100)) : 0;
  const isFull = capacity ? joinedPlayers >= capacity : false;
  const href = active ? `/game/${game.id}` : `/lobby/${game.id}`;

  return (
    <Link href={href} className="motion-surface group relative overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white/78 p-4 text-zinc-950 shadow-lg shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:shadow-black/10">
      <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-cyan-300 via-violet-300 to-transparent opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`material-symbols-outlined grid size-11 place-items-center rounded-2xl text-xl ${active ? "bg-cyan-300 text-zinc-950" : "bg-cyan-500/10 text-cyan-700 dark:bg-white/10 dark:text-cyan-100"}`}>
            {active ? "sports_esports" : "groups"}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={active ? "pm-chip pm-chip-primary" : isFull ? "pm-chip pm-chip-warning" : "pm-chip pm-chip-success"}>
                {active ? "بازی فعال" : isFull ? "تکمیل" : "قابل ورود"}
              </span>
              {!active && game.code && <span className="pm-chip font-mono" dir="ltr">#{game.code}</span>}
            </div>
            <h3 className="mt-2 line-clamp-2 break-words text-lg font-black leading-7">{active ? game.scenarioName || "بازی مافیا" : game.name}</h3>
            <p className="mt-1 truncate text-xs font-bold text-zinc-500 dark:text-white/48">{active ? `گرداننده: ${game.moderatorName || "نامشخص"}` : game.scenario?.name || "سناریو انتخاب نشده"}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-zinc-400 transition-transform group-hover:-translate-x-1 dark:text-white/40">arrow_back</span>
      </div>

      {!active && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs font-black text-zinc-600 dark:text-white/66">
            <span>{joinedPlayers}{capacity ? ` از ${capacity}` : ""} بازیکن</span>
            <span>{capacity ? `${Math.max(capacity - joinedPlayers, 0)} جای خالی` : "ظرفیت نامشخص"}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-l from-cyan-300 via-violet-300 to-emerald-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}

function ActionDock({ role }: { role?: string | null }) {
  const canModerate = role === "ADMIN" || role === "MODERATOR";
  const actions = [
    { href: "/dashboard/user/history", icon: "history", title: "تاریخچه", text: "گزارش‌ها و نتیجه‌ها" },
    { href: "/game-guide", icon: "menu_book", title: "راهنمای بازی", text: "قوانین و روند اجرا" },
    ...(canModerate
      ? [{ href: "/dashboard/moderator", icon: "stadia_controller", title: "اتاق گرداننده", text: "لابی و اجرای بازی" }]
      : [{ href: "/dashboard/user/history", icon: "insights", title: "مرور عملکرد", text: "نقش‌ها و نتیجه‌ها" }]),
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="motion-surface rounded-[1.2rem] border border-zinc-200 bg-white/78 p-4 text-zinc-950 shadow-sm shadow-zinc-950/5 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.085]">
          <div className="flex items-center justify-between gap-3">
            <span className="material-symbols-outlined grid size-11 place-items-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">{action.icon}</span>
            <span className="material-symbols-outlined text-zinc-400 dark:text-white/32">chevron_left</span>
          </div>
          <h3 className="mt-4 font-black">{action.title}</h3>
          <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-white/46">{action.text}</p>
        </Link>
      ))}
    </section>
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
    { name: "پیروزی‌ها", value: 0, color: "#22C55E" },
    { name: "شکست‌ها", value: 0, color: "#F43F5E" },
  ];
  const roleHistory = data?.roleHistory || [];
  const recentGames = data?.recentGames || [];
  const wins = statsData.find((item) => item.name.includes("پیروزی"))?.value || 0;
  const losses = statsData.find((item) => item.name.includes("شکست"))?.value || 0;
  const totalGames = wins + losses;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;
  const displayName = data?.userName || session?.user?.name || "بازیکن";
  const displayImage = data?.userImage || session?.user?.image;
  const latestGame = recentGames[0];
  const primaryLobby = activeGames[0];
  const roleChartData = useMemo(() => buildRoleChartData(roleHistory), [roleHistory]);

  if (!mounted) {
    return (
      <div className="grid gap-4">
        <div className="h-28 animate-pulse rounded-[1.35rem] bg-zinc-950/8 dark:bg-white/10" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse rounded-[1.35rem] bg-zinc-950/8 dark:bg-white/10" />
          <div className="h-96 animate-pulse rounded-[1.35rem] bg-zinc-950/8 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-zinc-950 dark:text-white">
      <section className="pm-command pm-aurora p-4">
        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-950/8 bg-white text-xl font-black shadow-sm shadow-zinc-950/5 dark:border-white/12 dark:bg-white/10">
              {displayImage ? <img src={displayImage} alt="" className="size-full object-cover" /> : initials(displayName)}
              <span className="absolute bottom-1 right-1 size-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#15171b]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200/85">PLAYER DECK</p>
              <h1 className="mt-1 truncate text-2xl font-black">{displayName}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="pm-chip pm-chip-primary">{data?.currentActiveGame ? "بازی فعال دارید" : primaryLobby ? "لابی آماده است" : "در انتظار لابی"}</span>
                <span className="pm-chip">{totalGames} بازی</span>
                <span className="pm-chip pm-chip-success">{winRate}% برد</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <PresenceFaces presence={presence} />
            {data?.currentActiveGame ? (
              <Link href={`/game/${data.currentActiveGame.id}`} className="pm-button pm-button-primary">
                ادامه بازی
                <span className="material-symbols-outlined text-lg">play_arrow</span>
              </Link>
            ) : primaryLobby ? (
              <Link href={`/lobby/${primaryLobby.id}`} className="pm-button pm-button-primary">
                ورود به لابی
                <span className="material-symbols-outlined text-lg">login</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="pm-muted-card border-amber-400/25 bg-amber-400/10 p-4 text-sm font-bold leading-7 text-amber-800 dark:text-amber-100">
          <span className="material-symbols-outlined ml-2 text-xl align-middle">cloud_off</span>
          {dashboardError}
        </div>
      )}

      <section className="pm-command p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="pm-kicker">اتاق‌های زنده</p>
            <h2 className="mt-1 text-2xl font-black">ورود سریع به بازی</h2>
          </div>
          <span className="pm-chip pm-chip-primary">{activeGames.length + (data?.currentActiveGame ? 1 : 0)} مورد</span>
        </div>

        <div className="mt-4">
          {activeGamesError ? (
            <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
          ) : !data?.currentActiveGame && activeGames.length === 0 ? (
            <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، کارت ورود همین‌جا ظاهر می‌شود." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data?.currentActiveGame && <LiveLobbyCard game={data.currentActiveGame} active />}
              {activeGames.slice(0, 5).map((game) => (
                <LiveLobbyCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ActionDock role={session?.user?.role} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="pm-command p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="pm-kicker">بازی‌های اخیر</p>
              <h2 className="mt-1 text-2xl font-black">آخرین بازی‌ها</h2>
            </div>
            <Link href="/dashboard/user/history" className="pm-button pm-button-secondary min-h-10 px-3 text-xs shadow-none">
              همه تاریخچه
            </Link>
          </div>

          <div className="mt-4 grid gap-2">
            {recentGames.length === 0 ? (
              <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
            ) : (
              recentGames.slice(0, 10).map((game: any, index: number) => {
                const result = resultMeta(game.result);
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedHistoryGame(game)}
                    className="motion-surface grid w-full gap-3 rounded-[1.05rem] border border-zinc-200 bg-white/72 p-3 text-right shadow-sm shadow-zinc-950/5 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.075] sm:grid-cols-[2.6rem_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="hidden size-10 items-center justify-center rounded-2xl bg-zinc-950/5 text-sm font-black text-zinc-500 dark:bg-white/8 dark:text-white/64 sm:flex">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-black text-zinc-950 dark:text-white">{game.scenarioName}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black text-zinc-500 dark:text-white/48">
                        <span className="pm-chip">{game.roleName}</span>
                        <span className="pm-chip">{game.moderatorName}</span>
                        <span className="pm-chip">{game.date}</span>
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className={result.className}>
                        <span className="material-symbols-outlined text-sm">{result.icon}</span>
                        {result.label}
                      </span>
                      <span className="material-symbols-outlined text-base text-zinc-400 dark:text-white/36">arrow_back</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className="grid gap-5">
          <section className="pm-command p-4">
            <p className="pm-kicker">فرم بازی</p>
            <h2 className="mt-1 text-2xl font-black">خلاصه عملکرد</h2>
            <div className="mt-4 grid gap-3">
              <div className="pm-muted-card p-4">
                <p className="text-xs font-black text-zinc-500 dark:text-white/48">آخرین نتیجه</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-lg font-black">{latestGame ? latestGame.scenarioName : "هنوز بازی کامل نشده"}</p>
                  {latestGame && <span className={resultMeta(latestGame.result).className}>{resultMeta(latestGame.result).label}</span>}
                </div>
              </div>
              <div className="pm-muted-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-zinc-500 dark:text-white/48">درصد برد</p>
                  <p className="text-xl font-black text-cyan-700 dark:text-cyan-200">{winRate}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-950/8 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-l from-cyan-300 to-emerald-300" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="pm-command p-4">
            <p className="pm-kicker">نقش‌ها</p>
            <h2 className="mt-1 text-2xl font-black">نقشه نقش‌ها</h2>
            {roleChartData.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
              </div>
            ) : (
              <>
                <div className="mt-4 h-44" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: "#15171b", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "Vazirmatn", color: "#fff" }} />
                      <Pie data={roleChartData} dataKey="count" nameKey="role" innerRadius={42} outerRadius={70} paddingAngle={3} stroke="none">
                        {roleChartData.map((entry, index) => (
                          <Cell key={`role-slice-${entry.role}`} fill={ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid gap-2">
                  {roleChartData.map((role, index) => (
                    <div key={role.role} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-600 dark:text-white/62">
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

      {selectedHistoryGame && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] backdrop-blur-xl sm:items-center sm:p-4">
          <div className="pm-command pm-safe-modal custom-scrollbar w-full max-w-3xl overflow-y-auto p-5 text-zinc-950 dark:text-white">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="pm-kicker">گزارش بازی</p>
                <h3 className="mt-1 text-2xl font-black">{selectedHistoryGame.scenarioName}</h3>
                <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-white/46">{selectedHistoryGame.date}</p>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="pm-button pm-button-secondary size-10 p-0 shadow-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="pm-muted-card p-4">
                <p className="text-xs font-bold text-zinc-500 dark:text-white/46">نقش شما</p>
                <p className="mt-2 font-black">{selectedHistoryGame.roleName}</p>
              </div>
              <div className="pm-muted-card p-4">
                <p className="text-xs font-bold text-zinc-500 dark:text-white/46">گرداننده</p>
                <p className="mt-2 font-black">{selectedHistoryGame.moderatorName}</p>
              </div>
              <div className="pm-muted-card p-4">
                <p className="text-xs font-bold text-zinc-500 dark:text-white/46">نتیجه</p>
                <p className="mt-2 font-black">{resultMeta(selectedHistoryGame.result).label}</p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="mb-3 text-sm font-black text-zinc-700 dark:text-white/72">نقش‌های بازیکنان</h4>
              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {selectedHistoryGame.players?.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded-[1rem] border border-zinc-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.045]">
                    <div>
                      <p className="text-sm font-black">{player.name}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-white/46">
                        {player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}
                      </p>
                    </div>
                    <span className={alignmentClass(player.alignment)}>
                      {alignmentLabel(player.alignment)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedHistoryGame.nightEvents?.length > 0 && (
              <div className="mt-5 rounded-[1.1rem] border border-cyan-300/20 bg-cyan-300/8 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-700 dark:text-cyan-200">dark_mode</span>
                  <h4 className="text-sm font-black">رکوردهای منتشرشده شب</h4>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedHistoryGame.nightEvents.map((event: any) => (
                    <div key={event.id} className="rounded-[1rem] border border-zinc-200 bg-white/72 p-3 text-xs leading-6 text-zinc-600 dark:border-white/10 dark:bg-black/18 dark:text-white/66">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-zinc-950 dark:text-white">
                          شب {event.nightNumber}: {event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}
                        </p>
                        <span className={event.wasUsed === false ? "pm-chip pm-chip-warning" : "pm-chip pm-chip-success"}>
                          {event.wasUsed === false ? "استفاده نشد" : "استفاده شد"}
                        </span>
                        {event.details?.effectType && event.details.effectType !== "NONE" && (
                          <span className="pm-chip pm-chip-primary">{effectLabel(event.details.effectType)}</span>
                        )}
                      </div>
                      <p className="mt-1">
                        {event.actorName || event.abilitySource || (event.actorAlignment ? alignmentLabel(event.actorAlignment) : "نامشخص")}
                        {event.wasUsed === false ? " ← بدون هدف" : ` ← ${event.targetName || "نامشخص"}`}
                      </p>
                      {Array.isArray(event.details?.targetLabels) && event.details.targetLabels.length > 0 && (
                        <p className="mt-1 text-zinc-500 dark:text-white/48">
                          گزینه‌ها: {event.details.targetLabels.map((target: { label: string; playerName?: string | null }) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ")}
                        </p>
                      )}
                      {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && event.details?.secondaryTargetName && (
                        <p className="mt-1 text-zinc-500 dark:text-white/48">
                          {event.details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: {event.details.secondaryTargetName}
                        </p>
                      )}
                      {(!Array.isArray(event.details?.targetLabels) || event.details.targetLabels.length === 0) && Array.isArray(event.details?.extraTargets) && event.details.extraTargets.length > 0 && (
                        <p className="mt-1 text-zinc-500 dark:text-white/48">
                          هدف‌های اضافه: {event.details.extraTargets.map((target: { name: string }) => target.name).join("، ")}
                        </p>
                      )}
                      {event.details?.convertedRoleName && (
                        <p className="mt-1 text-zinc-500 dark:text-white/48">
                          تبدیل نقش: {event.details.previousRoleName || "نقش قبلی"} ← {event.details.convertedRoleName}
                        </p>
                      )}
                      {event.note && <p className="mt-1 text-zinc-500 dark:text-white/48">{event.note}</p>}
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
