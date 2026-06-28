"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
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

const r2 = (n: number) => Math.round(n * 100) / 100;

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
  if (result === "WIN") return { label: "برد", icon: "emoji_events", className: "pm-chip pm-chip-success" };
  if (result === "LOSS") return { label: "باخت", icon: "close", className: "pm-chip pm-chip-danger" };
  return { label: "نامشخص", icon: "pending", className: "pm-chip pm-chip-warning" };
}

function alignmentLabel(a: string) {
  if (a === "CITIZEN") return "شهروند";
  if (a === "MAFIA") return "مافیا";
  return "مستقل";
}
function alignmentClass(a: string) {
  if (a === "CITIZEN") return "pm-chip pm-chip-primary";
  if (a === "MAFIA") return "pm-chip pm-chip-danger";
  return "pm-chip pm-chip-warning";
}

function gameCapacity(game: any) {
  return game?.scenario?.roles?.reduce((t: number, r: any) => t + r.count, 0) || 0;
}
function playerCount(game: any) {
  return game?._count?.players || game?.playerCount || 0;
}
function initials(name?: string | null) {
  const t = name?.trim();
  return t ? t.slice(0, 1) : "م";
}
function toFa(n: number | string) {
  return Number(n).toLocaleString("fa-IR");
}

// A derived "rank" gives the player an identity beyond raw numbers.
function rankTitle(total: number, winRate: number) {
  if (total < 3) return "تازه‌وارد میز";
  if (winRate >= 65) return "روباهِ میز";
  if (winRate >= 50) return "بازیکنِ کاربلد";
  if (winRate >= 35) return "اهلِ بازی";
  return "در حالِ یادگیری";
}

// Leading run of identical results, signed (+win / -loss).
function computeStreak(games: any[]) {
  let n = 0;
  let kind: "WIN" | "LOSS" | null = null;
  for (const g of games) {
    if (g.result !== "WIN" && g.result !== "LOSS") break;
    if (kind === null) kind = g.result;
    if (g.result !== kind) break;
    n += 1;
  }
  return { n, kind };
}

/* -------------------------------------------------- the identity card */

function PlayerCard({
  name, image, winRate, wins, losses, total, streak, presenceCount,
}: {
  name: string; image?: string | null; winRate: number; wins: number; losses: number;
  total: number; streak: { n: number; kind: "WIN" | "LOSS" | null }; presenceCount: number;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const rank = rankTitle(total, winRate);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${r2(px * 9)}deg`);
    el.style.setProperty("--rx", `${r2(-py * 9)}deg`);
  };
  const reset = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  return (
    <div className="dx-tilt" onPointerMove={onMove} onPointerLeave={reset}>
      <div ref={tiltRef} className="dx-tilt-inner">
        <div className="dx-flip" data-flipped={flipped}>
          <div className="dx-flip-inner h-[19rem] sm:h-[17.5rem]">
            {/* FRONT — the lit role card */}
            <div className="dx-flip-face pm-command relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-5">
              <div className="pm-aurora" />
              <div className="flex items-start justify-between">
                <span className="pm-eyebrow">کارتِ تو</span>
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="pm-icon-button size-9 shadow-none"
                  aria-label="چرخاندن کارت"
                >
                  <span className="material-symbols-outlined text-lg">flip</span>
                </button>
              </div>

              <div className="dx-pop flex items-center gap-4">
                <div className="relative grid size-[5.5rem] shrink-0 place-items-center">
                  <div className="dx-ring absolute inset-0" style={{ ["--p" as string]: String(winRate), ["--ring" as string]: "var(--pm-primary)" }} />
                  <div className="grid size-[4.4rem] place-items-center overflow-hidden rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface-strong)] text-2xl font-black text-[var(--pm-text)]">
                    {image ? <img src={image} alt="" className="size-full object-cover" /> : initials(name)}
                  </div>
                  <span className="absolute -bottom-0.5 right-1 grid size-5 place-items-center rounded-full border-2 border-[var(--pm-surface)] bg-[var(--pm-success)] text-[10px] font-black text-black">
                    {presenceCount > 0 ? toFa(presenceCount) : ""}
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black leading-tight text-[var(--pm-text)]">{name}</h1>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/10 px-2.5 py-1 text-xs font-black text-[var(--pm-primary)]">
                    <span className="material-symbols-outlined text-sm">military_tech</span>
                    {rank}
                  </span>
                </div>
              </div>

              <div className="dx-pop grid grid-cols-3 gap-2">
                {[
                  { k: "بازی", v: toFa(total), tone: "text-[var(--pm-text)]" },
                  { k: "برد", v: toFa(wins), tone: "text-[var(--pm-success)]" },
                  { k: "باخت", v: toFa(losses), tone: "text-[var(--pm-danger)]" },
                ].map((s) => (
                  <div key={s.k} className="rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-3 py-2 text-center">
                    <p className={`font-display text-2xl font-bold ${s.tone}`} dir="ltr">{s.v}</p>
                    <p className="text-[10px] font-bold text-[var(--pm-muted)]">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BACK — the dossier */}
            <div className="dx-flip-face dx-flip-back pm-card relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-5">
              <div className="flex items-start justify-between">
                <span className="pm-eyebrow">کارنامه</span>
                <button type="button" onClick={() => setFlipped(false)} className="pm-icon-button size-9 shadow-none" aria-label="بازگشت کارت">
                  <span className="material-symbols-outlined text-lg">flip</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
                  <p className="text-[10px] font-bold text-[var(--pm-muted)]">درصد برد</p>
                  <p className="font-display text-3xl font-bold text-[var(--pm-primary)]" dir="ltr">{toFa(winRate)}٪</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
                  <p className="text-[10px] font-bold text-[var(--pm-muted)]">روند فعلی</p>
                  <p className={`font-display text-3xl font-bold ${streak.kind === "WIN" ? "text-[var(--pm-success)]" : streak.kind === "LOSS" ? "text-[var(--pm-danger)]" : "text-[var(--pm-muted)]"}`} dir="ltr">
                    {streak.n > 0 ? `${streak.kind === "WIN" ? "▲" : "▼"} ${toFa(streak.n)}` : "—"}
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold leading-6 text-[var(--pm-muted)]">
                {total > 0
                  ? `از ${toFa(total)} شب پشت میز، ${toFa(wins)} بار برنده شدی. ${streak.n > 1 ? (streak.kind === "WIN" ? "روی موجِ بردی." : "وقتِ جبران است.") : ""}`
                  : "هنوز کارنامه‌ای نساخته‌ای — اولین شب در انتظارت است."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- lobby as a mini table */

function TableCard({ game, active = false }: { game: any; active?: boolean }) {
  const capacity = active ? 0 : gameCapacity(game);
  const joined = playerCount(game);
  const seats = Math.max(capacity, joined, active ? 8 : 6);
  const href = active ? `/game/${game.id}` : `/lobby/${game.id}`;
  const title = active ? game.scenarioName || "بازی فعال" : game.name;
  const sub = active ? `گرداننده: ${game.moderatorName || "نامشخص"}` : game.scenario?.name || "سناریو انتخاب نشده";
  const full = capacity ? joined >= capacity : false;

  return (
    <Link
      href={href}
      className={`group relative w-[16.5rem] overflow-hidden rounded-[var(--radius-lg)] border p-4 transition-all ${
        active
          ? "border-[var(--pm-primary)]/45 bg-[var(--pm-surface)] shadow-[0_0_0_1px_var(--pm-primary-glow),var(--pm-shadow)]"
          : "border-[var(--pm-line)] bg-[var(--pm-surface)] hover:border-[var(--pm-primary)]/40 hover:shadow-[var(--pm-shadow)]"
      }`}
    >
      {active && <span className="pm-spine" />}
      <div className="flex items-center justify-between">
        <span className={active ? "pm-chip pm-chip-primary" : full ? "pm-chip pm-chip-warning" : "pm-chip pm-chip-success"}>
          {active ? (<><span className="size-1.5 animate-pulse-slow rounded-full bg-current" /> در جریان</>) : full ? "تکمیل" : "باز"}
        </span>
        {!active && game.code && <span className="pm-chip font-mono text-[10px]" dir="ltr">#{game.code}</span>}
      </div>

      {/* mini seat-ring */}
      <div className="relative mx-auto my-3 size-28">
        <div className="absolute inset-[18%] grid place-items-center rounded-full border border-[var(--pm-line)] bg-[radial-gradient(circle,var(--pm-primary-soft),transparent_72%)] text-center">
          <div>
            <p className="font-display text-xl font-bold text-[var(--pm-text)]" dir="ltr">{toFa(joined)}{capacity ? `/${toFa(capacity)}` : ""}</p>
            <p className="text-[9px] font-bold text-[var(--pm-muted)]">نشسته</p>
          </div>
        </div>
        {Array.from({ length: seats }).map((_, i) => {
          const a = (-90 + (i / seats) * 360) * (Math.PI / 180);
          const x = r2(50 + 44 * Math.cos(a));
          const y = r2(50 + 44 * Math.sin(a));
          return <span key={i} className={`dx-seat ${i < joined ? "dx-seat-on" : "dx-seat-off"}`} style={{ left: `${x}%`, top: `${y}%` }} />;
        })}
      </div>

      <h3 className="truncate font-display text-lg font-bold leading-6 text-[var(--pm-text)]">{title}</h3>
      <p className="mt-0.5 truncate text-xs font-bold text-[var(--pm-muted)]">{sub}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[var(--pm-primary)]">
        {active ? "ادامه بده" : "بگیر صندلیت"}
        <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
      </span>
    </Link>
  );
}

/* -------------------------------------------------- form: streak + roles */

function StreakStrip({ games }: { games: any[] }) {
  const last = games.slice(0, 8).reverse();
  if (last.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {last.map((g, i) => {
        const win = g.result === "WIN";
        const loss = g.result === "LOSS";
        return (
          <span
            key={i}
            title={resultMeta(g.result).label}
            className={`dx-streak text-xs ${
              win ? "bg-[var(--pm-success)]/15 text-[var(--pm-success)] border border-[var(--pm-success)]/30"
              : loss ? "bg-[var(--pm-danger)]/15 text-[var(--pm-danger)] border border-[var(--pm-danger)]/30"
              : "bg-[var(--pm-surface-soft)] text-[var(--pm-muted)] border border-[var(--pm-line)]"}`}
          >
            {win ? "بُرد".slice(0, 1) : loss ? "بَخ".slice(0, 1) : "—"}
          </span>
        );
      })}
    </div>
  );
}

function RoleBars({ roles }: { roles: any[] }) {
  const top = [...roles].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
  const max = Math.max(1, ...top.map((r) => r.count || 0));
  return (
    <div className="grid gap-2.5">
      {top.map((role) => (
        <div key={role.role} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="truncate text-xs font-black text-[var(--pm-text)]">{role.role}</span>
              <span className="text-xs font-black text-[var(--pm-muted)]" dir="ltr">{toFa(role.count)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--pm-line)]">
              <div className="h-full rounded-full bg-gradient-to-l from-[var(--pm-primary)] to-[var(--pm-primary-strong)]" style={{ width: `${r2(((role.count || 0) / max) * 100)}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------- recent nights ledger */

function NightsTimeline({ games, onSelect }: { games: any[]; onSelect: (g: any) => void }) {
  return (
    <ol className="relative grid gap-2.5">
      <span className="absolute bottom-3 right-[1.15rem] top-3 w-px bg-[var(--pm-line)]" aria-hidden="true" />
      {games.slice(0, 8).map((g) => {
        const r = resultMeta(g.result);
        const win = g.result === "WIN";
        return (
          <li key={g.id}>
            <button
              onClick={() => onSelect(g)}
              className="group grid w-full grid-cols-[2.4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-transparent p-2 text-right transition-colors hover:border-[var(--pm-line)] hover:bg-[var(--pm-surface-soft)]"
            >
              <span className={`relative z-10 grid size-9 place-items-center rounded-full border ${win ? "border-[var(--pm-success)]/40 bg-[var(--pm-success)]/12 text-[var(--pm-success)]" : "border-[var(--pm-danger)]/40 bg-[var(--pm-danger)]/12 text-[var(--pm-danger)]"}`}>
                <span className="material-symbols-outlined text-lg">{win ? "wb_twilight" : "bedtime"}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-black text-[var(--pm-text)]">{g.scenarioName}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[var(--pm-muted)]">{g.roleName} · {g.date}</span>
              </span>
              <span className={r.className}>{r.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ================================================== page */

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

  const statsData = data?.statsData || [];
  const roleHistory = data?.roleHistory || [];
  const recentGames = data?.recentGames || [];
  const wins = statsData.find((i) => i.name?.includes("پیروزی"))?.value || 0;
  const losses = statsData.find((i) => i.name?.includes("شکست"))?.value || 0;
  const totalGames = wins + losses;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;
  const displayName = data?.userName || session?.user?.name || "بازیکن";
  const displayImage = data?.userImage || session?.user?.image;
  const streak = useMemo(() => computeStreak(recentGames), [recentGames]);
  const activeCount = activeGames.length + (data?.currentActiveGame ? 1 : 0);

  if (!mounted) {
    return (
      <div className="grid gap-4">
        <div className="h-[18rem] animate-pulse rounded-[var(--radius-xl)] bg-[var(--pm-line)]" />
        <div className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--pm-line)]" />
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[var(--pm-line)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--pm-text)]">
      {/* HERO: identity card + tonight */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.74fr)]">
        <div className="dx-rise"><PlayerCard name={displayName} image={displayImage} winRate={winRate} wins={wins} losses={losses} total={totalGames} streak={streak} presenceCount={presence.count || 0} /></div>

        <aside className="dx-rise pm-card flex flex-col justify-between gap-4 rounded-[var(--radius-xl)] p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="pm-eyebrow">امشب</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[var(--pm-success)]">
                <span className="size-1.5 animate-pulse-slow rounded-full bg-[var(--pm-success)]" />
                {toFa(presence.count || 0)} آنلاین
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">
              {data?.currentActiveGame ? "بازی‌ات در جریان است" : activeGames[0] ? "میزی برایت باز است" : "میز هنوز خاموش است"}
            </h2>
            <p className="mt-1.5 text-sm font-bold leading-7 text-[var(--pm-muted)]">
              {data?.currentActiveGame
                ? "گرداننده منتظر توست؛ به اتاق بازی برگرد."
                : activeGames[0]
                  ? "یک لابیِ باز پیدا شد. صندلی‌ات را زود بگیر."
                  : "تا گرداننده‌ای لابی بسازد، اینجا روشن می‌شود."}
            </p>
          </div>
          {data?.currentActiveGame ? (
            <Link href={`/game/${data.currentActiveGame.id}`} className="pm-button-primary ms-cta min-h-12">
              <span className="material-symbols-outlined text-xl">sports_esports</span>
              ادامهٔ بازی
            </Link>
          ) : activeGames[0] ? (
            <Link href={`/lobby/${activeGames[0].id}`} className="pm-button-primary ms-cta min-h-12">
              <span className="material-symbols-outlined text-xl">meeting_room</span>
              ورود به لابی
            </Link>
          ) : (
            <Link href="/game-guide" className="pm-button-secondary min-h-12">
              <span className="material-symbols-outlined text-xl">menu_book</span>
              تا آن موقع، قوانین را مرور کن
            </Link>
          )}
        </aside>
      </section>

      {dashboardError && (
        <div className="pm-muted-card border-[var(--pm-warning)]/25 bg-[var(--pm-warning)]/10 p-4 text-sm font-bold leading-7 text-[var(--pm-text)]">
          <span className="material-symbols-outlined ml-2 align-middle text-xl text-[var(--pm-warning)]">cloud_off</span>
          {dashboardError}
        </div>
      )}

      {/* TONIGHT'S TABLES — snap deck of mini tables */}
      <section className="dx-rise">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <span className="pm-eyebrow">میزهای امشب</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold">یک صندلی انتخاب کن</h2>
          </div>
          <span className="pm-chip pm-chip-primary">{toFa(activeCount)} میز</span>
        </div>
        {activeGamesError ? (
          <EmptyState icon="cloud_off" title="لابی‌ها بارگذاری نشدند" text={activeGamesError} />
        ) : activeCount === 0 ? (
          <EmptyState icon="bedtime" title="میزها خاموش‌اند" text="وقتی گرداننده‌ای لابی بسازد، میزش همین‌جا روشن می‌شود." />
        ) : (
          <div className="dx-rail pb-2">
            {data?.currentActiveGame && <TableCard game={data.currentActiveGame} active />}
            {activeGames.slice(0, 8).map((g) => <TableCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      {/* FORM + RECENT */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="dx-rise pm-card rounded-[var(--radius-xl)] p-5">
          <span className="pm-eyebrow">فرمِ تو</span>
          <h2 className="mt-1.5 font-display text-2xl font-bold">روند و نقش‌ها</h2>

          {totalGames === 0 ? (
            <div className="mt-5"><EmptyState icon="insights" title="هنوز فرمی نساخته‌ای" text="بعد از چند شب، روند برد و نقش‌های پرتکرارت اینجا شکل می‌گیرد." /></div>
          ) : (
            <div className="mt-5 grid gap-5">
              <div className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-[var(--pm-muted)]">۸ شبِ اخیر</p>
                  <p className="text-xs font-black text-[var(--pm-primary)]" dir="ltr">{toFa(winRate)}٪ برد</p>
                </div>
                <div className="mt-3"><StreakStrip games={recentGames} /></div>
              </div>
              {roleHistory.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-black text-[var(--pm-muted)]">نقش‌هایی که بیشتر گرفته‌ای</p>
                  <RoleBars roles={roleHistory} />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="dx-rise pm-card rounded-[var(--radius-xl)] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="pm-eyebrow">آخرین شب‌ها</span>
              <h2 className="mt-1.5 font-display text-2xl font-bold">دفترِ بازی‌ها</h2>
            </div>
            <Link href="/dashboard/user/history" className="pm-button-secondary min-h-10 px-3 text-xs">همه</Link>
          </div>
          <div className="mt-5">
            {recentGames.length === 0 ? (
              <EmptyState icon="history_toggle_off" title="هنوز شبی ثبت نشده" text="بعد از اولین بازی کامل، خلاصه‌اش اینجا می‌آید." />
            ) : (
              <NightsTimeline games={recentGames} onSelect={setSelectedHistoryGame} />
            )}
          </div>
        </section>
      </div>

      {/* report modal (unchanged behavior) */}
      {selectedHistoryGame && (
        <div className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/80 backdrop-blur-xl sm:items-center">
          <div className="pm-card pm-safe-modal custom-scrollbar w-full max-w-3xl overflow-y-auto p-6 text-[var(--pm-text)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="pm-eyebrow">گزارش بازی</span>
                <h3 className="mt-2 font-display text-3xl font-bold">{selectedHistoryGame.scenarioName}</h3>
                <p className="mt-2 text-sm font-bold text-[var(--pm-muted)]">{selectedHistoryGame.date}</p>
              </div>
              <button onClick={() => setSelectedHistoryGame(null)} className="pm-button-secondary size-12 p-0 shadow-none" aria-label="بستن">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="pm-muted-card border border-[var(--pm-line)] p-4">
                <p className="text-xs font-bold text-[var(--pm-muted)]">نقش شما</p>
                <p className="mt-2 text-lg font-black">{selectedHistoryGame.roleName}</p>
              </div>
              <div className="pm-muted-card border border-[var(--pm-line)] p-4">
                <p className="text-xs font-bold text-[var(--pm-muted)]">گرداننده</p>
                <p className="mt-2 text-lg font-black">{selectedHistoryGame.moderatorName}</p>
              </div>
              <div className="pm-muted-card border border-[var(--pm-line)] p-4">
                <p className="text-xs font-bold text-[var(--pm-muted)]">نتیجه</p>
                <div className="mt-2"><span className={resultMeta(selectedHistoryGame.result).className}>{resultMeta(selectedHistoryGame.result).label}</span></div>
              </div>
            </div>
            <div className="mt-8">
              <h4 className="mb-4 text-sm font-black text-[var(--pm-text)]">نقش‌های بازیکنان</h4>
              <div className="grid max-h-80 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                {selectedHistoryGame.players?.map((player: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-4 shadow-[var(--pm-shadow-soft)]">
                    <div>
                      <p className="text-[0.95rem] font-black">{player.name}</p>
                      <p className="mt-1.5 text-[0.8rem] text-[var(--pm-muted)]">{player.roleName}{player.isAlive === false ? "، حذف‌شده" : ""}</p>
                    </div>
                    <span className={alignmentClass(player.alignment)}>{alignmentLabel(player.alignment)}</span>
                  </div>
                ))}
              </div>
            </div>
            {selectedHistoryGame.nightEvents?.length > 0 && (
              <GameReportTimeline
                events={selectedHistoryGame.nightEvents}
                title="گزارش منتشرشده بازی"
                subtitle="روایت خلاصه اتفاقات روز و شب."
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
