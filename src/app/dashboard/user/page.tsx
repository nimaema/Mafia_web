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
import { GameReportTimeline } from "@/components/game/GameReportTimeline";

type DashboardData = {
  statsData: any[];
  roleHistory: any[];
  recentGames: any[];
  currentActiveGame?: any;
  userName?: string | null;
  userImage?: string | null;
};

const ROLE_CHART_COLORS = ["var(--pm-primary)", "#8B5CF6", "var(--pm-success)", "var(--pm-warning)", "var(--pm-danger)", "#38BDF8", "var(--pm-muted)"];

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="pm-muted-card flex min-h-[11rem] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="material-symbols-outlined text-4xl text-[var(--pm-muted)] opacity-50">{icon}</span>
      <div>
        <p className="font-black text-[var(--pm-text)]">{title}</p>
        <p className="mt-1 max-w-sm text-xs font-bold leading-6 text-[var(--pm-muted)]">{text}</p>
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
  if (alignment === "CITIZEN") return "pm-chip pm-chip-primary";
  if (alignment === "MAFIA") return "pm-chip pm-chip-danger";
  return "pm-chip pm-chip-warning";
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
          <span key={member.id} className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--pm-surface)] bg-[var(--pm-surface-strong)] text-xs font-black text-[var(--pm-text)]">
            {member.image ? <img src={member.image} alt="" className="size-full object-cover" /> : initials(member.name)}
          </span>
        )) : (
          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[var(--pm-surface)] bg-[var(--pm-surface-soft)] text-[var(--pm-primary)]">
            <span className="material-symbols-outlined text-base">group</span>
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-black text-[var(--pm-text)]">{presence.updatedAt ? presence.count : "..."} آنلاین</p>
        <p className="mt-0.5 text-[10px] font-bold text-[var(--pm-muted)]">حاضر در اپ</p>
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
    <Link href={href} className="pm-card group relative overflow-hidden p-4 text-[var(--pm-text)] hover:border-[var(--pm-primary)] transition-colors">
      <span className="absolute inset-y-0 right-0 w-1 bg-[var(--pm-primary)] opacity-80" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`material-symbols-outlined grid size-11 place-items-center rounded-[var(--radius-sm)] text-xl ${active ? "bg-[var(--pm-primary)] text-[#002d27] shadow-[0_0_15px_var(--color-noir-cyan-glow)]" : "bg-[var(--pm-surface-soft)] text-[var(--pm-primary)]"}`}>
            {active ? "sports_esports" : "groups"}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={active ? "pm-chip pm-chip-primary shadow-[0_0_10px_var(--color-noir-cyan-glow)]" : isFull ? "pm-chip pm-chip-warning" : "pm-chip pm-chip-success"}>
                {active ? "بازی فعال" : isFull ? "تکمیل" : "قابل ورود"}
              </span>
              {!active && game.code && <span className="pm-chip font-mono" dir="ltr">#{game.code}</span>}
            </div>
            <h3 className="mt-2 line-clamp-2 break-words text-lg font-black leading-7">{active ? game.scenarioName || "بازی مافیا" : game.name}</h3>
            <p className="mt-1 truncate text-xs font-bold text-[var(--pm-muted)]">{active ? `گرداننده: ${game.moderatorName || "نامشخص"}` : game.scenario?.name || "سناریو انتخاب نشده"}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-[var(--pm-muted)] transition-transform group-hover:-translate-x-1">arrow_back</span>
      </div>

      {!active && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs font-black text-[var(--pm-text)]">
            <span>{joinedPlayers}{capacity ? ` از ${capacity}` : ""} بازیکن</span>
            <span>{capacity ? `${Math.max(capacity - joinedPlayers, 0)} جای خالی` : "ظرفیت نامشخص"}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--pm-line)]">
            <div className="h-full rounded-full bg-[var(--pm-primary)] shadow-[0_0_10px_var(--pm-primary)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}

function ActionDock() {
  const actions = [
    { href: "/dashboard/user/history", icon: "history", title: "تاریخچه", text: "گزارش‌ها و نتیجه‌ها" },
    { href: "/game-guide", icon: "menu_book", title: "راهنمای بازی", text: "قوانین و روند اجرا" },
    { href: "/dashboard/user/requests", icon: "rate_review", title: "پیشنهاد بازی", text: "نقش، سناریو یا اصلاح" },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="pm-card p-4 hover:border-[var(--pm-primary)] transition-colors">
          <div className="flex items-center justify-between gap-3">
            <span className="material-symbols-outlined grid size-11 place-items-center rounded-[var(--radius-sm)] bg-[var(--pm-surface-soft)] text-2xl text-[var(--pm-primary)]">{action.icon}</span>
            <span className="material-symbols-outlined text-[var(--pm-muted)]">chevron_left</span>
          </div>
          <h3 className="mt-4 font-black">{action.title}</h3>
          <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{action.text}</p>
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
    { name: "پیروزی‌ها", value: 0, color: "var(--pm-success)" },
    { name: "شکست‌ها", value: 0, color: "var(--pm-danger)" },
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
        <div className="h-[7rem] animate-pulse rounded-[var(--radius-md)] bg-[var(--pm-line)]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse rounded-[var(--radius-md)] bg-[var(--pm-line)]" />
          <div className="h-96 animate-pulse rounded-[var(--radius-md)] bg-[var(--pm-line)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-[var(--pm-text)]">
      {/* Hero Stats Card */}
      <section className="pm-card p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-noir-cyan-glow)] blur-[80px] rounded-full pointer-events-none opacity-50" />
        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-strong)] text-xl font-black shadow-[var(--pm-shadow-soft)]">
              {displayImage ? <img src={displayImage} alt="" className="size-full object-cover" /> : initials(displayName)}
              <span className="absolute bottom-1 right-1 size-3 rounded-full border-2 border-[var(--pm-surface)] bg-[var(--pm-success)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--pm-primary)]">PLAYER DECK</p>
              <h1 className="mt-1 truncate text-3xl font-black">{displayName}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="pm-chip pm-chip-primary shadow-[0_0_10px_var(--color-noir-cyan-glow)]">{data?.currentActiveGame ? "بازی فعال دارید" : primaryLobby ? "لابی آماده است" : "در انتظار لابی"}</span>
                <span className="pm-chip">{totalGames} بازی</span>
                <span className="pm-chip pm-chip-success">{winRate}% برد</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <PresenceFaces presence={presence} />
            {data?.currentActiveGame ? (
              <Link href={`/game/${data.currentActiveGame.id}`} className="pm-button pm-button-primary shadow-[0_0_15px_var(--color-noir-cyan-glow)]">
                ادامه بازی
                <span className="material-symbols-outlined text-xl">play_arrow</span>
              </Link>
            ) : primaryLobby ? (
              <Link href={`/lobby/${primaryLobby.id}`} className="pm-button pm-button-primary shadow-[0_0_15px_var(--color-noir-cyan-glow)]">
                ورود به لابی
                <span className="material-symbols-outlined text-xl">login</span>
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

      {/* Live Lobbies */}
      <section className="pm-card p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">اتاق‌های زنده</p>
            <h2 className="mt-1 text-2xl font-black">ورود سریع به بازی</h2>
          </div>
          <span className="pm-chip pm-chip-primary">{activeGames.length + (data?.currentActiveGame ? 1 : 0)} مورد</span>
        </div>

        <div className="mt-5">
          {activeGamesError ? (
            <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
          ) : !data?.currentActiveGame && activeGames.length === 0 ? (
            <EmptyState icon="radar" title="لابی فعالی پیدا نشد" text="وقتی گرداننده‌ای لابی بسازد، کارت ورود همین‌جا ظاهر می‌شود." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data?.currentActiveGame && <LiveLobbyCard game={data.currentActiveGame} active />}
              {activeGames.slice(0, 5).map((game) => (
                <LiveLobbyCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ActionDock />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        {/* Recent Games */}
        <section className="pm-card p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">بازی‌های اخیر</p>
              <h2 className="mt-1 text-2xl font-black">آخرین بازی‌ها</h2>
            </div>
            <Link href="/dashboard/user/history" className="pm-button pm-button-secondary min-h-[2.5rem] px-3 text-xs">
              همه تاریخچه
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {recentGames.length === 0 ? (
              <EmptyState icon="history_toggle_off" title="هنوز بازی ثبت نشده" text="بعد از پایان اولین بازی، خلاصه آن اینجا می‌آید." />
            ) : (
              recentGames.slice(0, 10).map((game: any, index: number) => {
                const result = resultMeta(game.result);
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedHistoryGame(game)}
                    className="group grid w-full gap-3 rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-3 text-right shadow-[var(--pm-shadow-soft)] hover:border-[var(--pm-primary)] transition-colors sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="hidden size-[2.5rem] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--pm-surface-soft)] text-sm font-black text-[var(--pm-muted)] sm:flex">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-black text-[var(--pm-text)]">{game.scenarioName}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5 text-[0.7rem] font-black text-[var(--pm-muted)]">
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
                      <span className="material-symbols-outlined text-xl text-[var(--pm-muted)] transition-transform group-hover:-translate-x-1">arrow_back</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Stats Summary */}
        <aside className="grid gap-5">
          <section className="pm-card p-5">
            <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">فرم بازی</p>
            <h2 className="mt-1 text-2xl font-black">خلاصه عملکرد</h2>
            <div className="mt-5 grid gap-3">
              <div className="pm-muted-card p-4 border border-[var(--pm-line)]">
                <p className="text-xs font-black text-[var(--pm-muted)]">آخرین نتیجه</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-lg font-black">{latestGame ? latestGame.scenarioName : "هنوز بازی کامل نشده"}</p>
                  {latestGame && <span className={resultMeta(latestGame.result).className}>{resultMeta(latestGame.result).label}</span>}
                </div>
              </div>
              <div className="pm-muted-card p-4 border border-[var(--pm-line)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-[var(--pm-muted)]">درصد برد</p>
                  <p className="text-xl font-black text-[var(--pm-primary)]">{winRate}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--pm-line)]">
                  <div className="h-full rounded-full bg-[var(--pm-primary)] shadow-[0_0_10px_var(--pm-primary)]" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="pm-card p-5">
            <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">نقش‌ها</p>
            <h2 className="mt-1 text-2xl font-black">نقشه نقش‌ها</h2>
            {roleChartData.length === 0 ? (
              <div className="mt-5">
                <EmptyState icon="troubleshoot" title="نقشی ثبت نشده" text="بعد از حضور در بازی، نقش‌های دریافتی اینجا دیده می‌شوند." />
              </div>
            ) : (
              <>
                <div className="mt-5 h-48" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: "var(--pm-surface-strong)", borderRadius: "var(--radius-sm)", border: "1px solid var(--pm-line)", fontFamily: "var(--font-sans)", color: "var(--pm-text)" }} />
                      <Pie data={roleChartData} dataKey="count" nameKey="role" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                        {roleChartData.map((entry, index) => (
                          <Cell key={`role-slice-${entry.role}`} fill={ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid gap-2">
                  {roleChartData.map((role, index) => (
                    <div key={role.role} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-3 font-bold text-[var(--pm-text)]">
                        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: ROLE_CHART_COLORS[index % ROLE_CHART_COLORS.length] }} />
                        <span className="truncate">{role.role}</span>
                      </span>
                      <span className="font-black text-[var(--pm-text)]">{role.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </aside>
      </div>

      {selectedHistoryGame && (
        <div className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/80 backdrop-blur-xl sm:items-center">
          <div className="pm-card pm-safe-modal custom-scrollbar w-full max-w-3xl overflow-y-auto p-6 text-[var(--pm-text)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-black uppercase tracking-widest text-[var(--pm-primary)]">گزارش بازی</p>
                <h3 className="mt-2 text-3xl font-black">{selectedHistoryGame.scenarioName}</h3>
                <p className="mt-2 text-sm font-bold text-[var(--pm-muted)]">{selectedHistoryGame.date}</p>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="pm-button pm-button-secondary size-12 p-0 shadow-none hover:border-[var(--pm-primary)]">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="pm-muted-card p-4 border border-[var(--pm-line)]">
                <p className="text-xs font-bold text-[var(--pm-muted)]">نقش شما</p>
                <p className="mt-2 font-black text-lg">{selectedHistoryGame.roleName}</p>
              </div>
              <div className="pm-muted-card p-4 border border-[var(--pm-line)]">
                <p className="text-xs font-bold text-[var(--pm-muted)]">گرداننده</p>
                <p className="mt-2 font-black text-lg">{selectedHistoryGame.moderatorName}</p>
              </div>
              <div className="pm-muted-card p-4 border border-[var(--pm-line)]">
                <p className="text-xs font-bold text-[var(--pm-muted)]">نتیجه</p>
                <div className="mt-2">
                  <span className={resultMeta(selectedHistoryGame.result).className}>{resultMeta(selectedHistoryGame.result).label}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="mb-4 text-sm font-black text-[var(--pm-text)]">نقش‌های بازیکنان</h4>
              <div className="grid max-h-80 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                {selectedHistoryGame.players?.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-4 shadow-[var(--pm-shadow-soft)]">
                    <div>
                      <p className="text-[0.95rem] font-black">{player.name}</p>
                      <p className="mt-1.5 text-[0.8rem] text-[var(--pm-muted)]">
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
              <GameReportTimeline
                events={selectedHistoryGame.nightEvents}
                title="گزارش منتشرشده بازی"
                subtitle="روایت خلاصه اتفاقات روز و شب، بدون ردیف‌های مبهم و تکراری."
                isPublic={selectedHistoryGame.nightRecordsPublic}
                className="mt-8"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

