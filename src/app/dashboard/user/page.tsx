"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, CaretLeft, LockSimple, Trophy, XCircle } from "@phosphor-icons/react";
import { getUserStatsSafe } from "@/actions/dashboard";
import { getWaitingGamesSafe } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { MaskAvatar, MaskStack } from "@/components/brand/MaskAvatar";
import { CaseFile, type HistoryItem } from "@/components/game/CaseFile";
import { JoinByCode } from "@/components/game/JoinByCode";
import { Notice } from "@/components/ui/Notice";
import { FactionTag } from "@/components/ui/Tag";

type DashboardData = {
  statsData: { name: string; value: number }[];
  roleHistory: { role: string; count: number }[];
  recentGames: any[];
  currentActiveGame?: { id: string; scenarioName: string; moderatorName: string } | null;
  userId?: string;
  userName?: string | null;
};

const toFa = (value: number) => value.toLocaleString("fa-IR");

function capacityOf(game: any) {
  return game?.scenario?.roles?.reduce((total: number, role: any) => total + role.count, 0) || 0;
}

export default function PlayerHome() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [lobbyError, setLobbyError] = useState("");
  const [openGame, setOpenGame] = useState<HistoryItem | null>(null);

  const refreshLobbies = useCallback(async () => {
    const result = await getWaitingGamesSafe(Date.now());
    setLobbies(result.data);
    setLobbyError(result.success ? "" : result.error || "لابی‌ها بارگذاری نشدند.");
  }, []);

  const refresh = useCallback(async () => {
    const [stats] = await Promise.all([getUserStatsSafe(), refreshLobbies()]);
    if (stats.data) setData(stats.data as DashboardData);
    setError(stats.success ? "" : stats.error || "اطلاعات بارگذاری نشد.");
    setLoaded(true);
  }, [refreshLobbies]);

  useEffect(() => {
    refresh();
    const pusher = getPusherClient();
    const channel = pusher.subscribe("lobby");
    channel.bind("game-created", refreshLobbies);
    channel.bind("lobby-updated", refresh);
    return () => {
      channel.unbind("game-created", refreshLobbies);
      channel.unbind("lobby-updated", refresh);
      pusher.unsubscribe("lobby");
    };
  }, [refresh, refreshLobbies]);

  const name = data?.userName || session?.user?.name || "بازیکن";
  const wins = data?.statsData.find((item) => item.name.includes("پیروزی"))?.value || 0;
  const losses = data?.statsData.find((item) => item.name.includes("شکست"))?.value || 0;
  const total = wins + losses;
  const topRole = data?.roleHistory?.[0]?.role;
  const active = data?.currentActiveGame;
  const recent = data?.recentGames?.slice(0, 4) || [];

  if (!loaded) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="flex items-center gap-4">
          <div className="size-20 animate-pulse rounded-[1.4rem] bg-surface" />
          <div className="h-10 w-40 animate-pulse rounded-full bg-surface" />
        </div>
        <div className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-8">
        {/* Who you are */}
        <section className="flex items-center gap-4">
          <MaskAvatar seed={data?.userId || session?.user?.id || name} size="xl" />
          <div className="min-w-0">
            <h1 className="nq-display line-clamp-2 break-words text-[2.4rem] leading-[1.15]">{`سلام ${name}`}</h1>
            <p className="mt-0.5 text-[0.95rem] font-medium text-muted">
              {total ? (
                <>
                  <b className="font-extrabold text-fg">{toFa(total)}</b> بازی، <b className="font-extrabold text-fg">{toFa(wins)}</b> برد
                  {topRole ? (
                    <>
                      . بیشتر <b className="font-extrabold text-fg">{topRole}</b> بوده‌اید.
                    </>
                  ) : null}
                </>
              ) : (
                "هنوز بازی‌ای ثبت نکرده‌اید. اولین میز منتظر شماست."
              )}
            </p>
          </div>
        </section>

        {error ? <Notice tone="warning">{error}</Notice> : null}

        {active ? (
          <Link href={`/game/${active.id}`} className="nq-grain group relative flex items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-night p-5 text-moon">
            <span className="relative z-10">
              <span className="flex items-center gap-2 text-sm font-bold opacity-80">
                <span className="size-2 animate-[live-dot_1.6s_ease-in-out_infinite] rounded-full bg-moon" aria-hidden />
                بازی شما در جریان است
              </span>
              <span className="nq-display mt-1 block text-[1.9rem] leading-tight">{active.scenarioName}</span>
              <span className="text-sm font-bold opacity-75">{`گرداننده: ${active.moderatorName}`}</span>
            </span>
            <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-moon text-night transition-transform group-hover:-translate-x-1">
              <ArrowLeft size={22} weight="bold" aria-hidden />
            </span>
          </Link>
        ) : null}

        <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
          <JoinByCode />
        </section>

        {/* Open lobbies */}
        <section aria-labelledby="lobbies-title">
          <h2 id="lobbies-title" className="text-lg font-extrabold">
            لابی‌های باز
          </h2>
          {lobbyError ? (
            <Notice tone="warning" className="mt-3">
              {lobbyError}
            </Notice>
          ) : lobbies.length === 0 ? (
            <p className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-line-strong p-6 text-center text-sm font-medium leading-7 text-muted">
              الان لابی بازی نیست. وقتی گرداننده‌ای لابی بسازد، همین‌جا ظاهر می‌شود.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {lobbies.slice(0, 6).map((lobby, index) => {
                const capacity = capacityOf(lobby);
                const count = lobby._count?.players || 0;
                const full = capacity > 0 && count >= capacity;
                return (
                  <li key={lobby.id}>
                    <Link
                      href={`/lobby/${lobby.id}`}
                      className={`group relative block overflow-hidden rounded-[var(--radius-lg)] border bg-surface p-5 transition-colors hover:border-accent/50 ${index === 0 ? "nq-khatam border-accent/40" : "border-line"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 truncate text-[1.05rem] font-extrabold">
                            {lobby.name}
                            {lobby.hasPassword ? <LockSimple size={16} weight="bold" className="text-muted" aria-label="رمزدار" /> : null}
                          </h3>
                          <p className="mt-0.5 truncate text-sm font-medium text-muted">{`${lobby.scenario?.name || "سناریو انتخاب نشده"} · ${lobby.moderator?.name || "گرداننده"}`}</p>
                        </div>
                        <span className={`nq-tag shrink-0 ${full ? "" : "bg-accent-soft text-accent"}`}>
                          {capacity ? `${toFa(count)} از ${toFa(capacity)}` : `${toFa(count)} نفر`}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        {lobby.players?.length ? (
                          <MaskStack seeds={lobby.players.map((player: any) => player.userId || player.id)} max={7} size="sm" ringClassName="ring-surface" />
                        ) : (
                          <span className="text-sm font-medium text-faint">هنوز کسی ننشسته</span>
                        )}
                        <CaretLeft size={20} weight="bold" className="text-muted transition-transform group-hover:-translate-x-1" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-10">
        <section aria-labelledby="recent-title">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-title" className="text-lg font-extrabold">
              بازی‌های اخیر
            </h2>
            {recent.length ? (
              <Link href="/dashboard/user/history" className="text-sm font-bold text-accent hover:underline">
                همه بازی‌ها
              </Link>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm font-medium leading-7 text-muted">بعد از اولین بازی، نتیجه و نقشتان اینجا می‌آید.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface px-4">
              {recent.map((game: any) => {
                const won = game.result === "WIN";
                const lost = game.result === "LOSS";
                return (
                  <li key={game.id}>
                    <button type="button" onClick={() => setOpenGame(game)} className="flex w-full items-center gap-3 py-3.5 text-right">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-[0.8rem] ${won ? "bg-success/14 text-success" : lost ? "bg-danger/12 text-danger" : "bg-raised text-muted"}`}>
                        {won ? <Trophy size={20} weight="fill" aria-label="برد" /> : <XCircle size={20} weight="fill" aria-label={lost ? "باخت" : "نامشخص"} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{game.scenarioName}</span>
                        <span className="block truncate text-sm font-medium text-muted">{`${game.roleName} · ${game.date}`}</span>
                      </span>
                      <FactionTag alignment={game.roleAlignment} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {data?.roleHistory?.length ? (
          <section aria-labelledby="roles-title">
            <h2 id="roles-title" className="text-lg font-extrabold">
              نقش‌هایی که گرفته‌اید
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.roleHistory.map((role) => (
                <li key={role.role} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pe-1.5 ps-4 font-bold">
                  {role.role}
                  <span className="grid min-w-7 place-items-center rounded-full bg-raised px-2 text-sm font-extrabold text-muted">{toFa(role.count)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
      {openGame ? <CaseFile game={openGame} onClose={() => setOpenGame(null)} /> : null}
    </div>
  );
}
