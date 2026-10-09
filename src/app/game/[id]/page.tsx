"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, CaretDown, Trophy } from "@phosphor-icons/react";
import { getPlayerGameView } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { usePopup } from "@/components/PopupProvider";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { PhaseTitleCard } from "@/components/game/PhaseTitleCard";
import { PublicNightLog } from "@/components/game/PublicNightLog";
import { RoleCard } from "@/components/game/RoleCard";
import { VerdictOverlay } from "@/components/game/VerdictOverlay";
import { Notice } from "@/components/ui/Notice";
import { FactionTag } from "@/components/ui/Tag";
import { assignTableHues } from "@/lib/playerColor";
import { FACTION } from "@/lib/faction";
import { PHASE_COPY, PHASE_SURFACE, phaseTitle, type Phase } from "@/lib/phase";

type GamePlayer = { id: string; name: string; userId?: string | null; isAlive?: boolean };

const WINNER_LABEL: Record<string, string> = { CITIZEN: "شهروندان", MAFIA: "مافیا", NEUTRAL: "مستقل‌ها" };
const toFa = (value: number) => value.toLocaleString("fa-IR");

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert } = usePopup();
  const gameId = params.id as string;

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [titleCard, setTitleCard] = useState<{ phase: Phase; phaseNumber: number } | null>(null);
  const [verdict, setVerdict] = useState<{ playerId: string } | null>(null);
  const [ended, setEnded] = useState<string | null>(null);
  const playersRef = useRef<GamePlayer[]>([]);

  const sync = useCallback(async () => {
    const view = await getPlayerGameView(gameId);
    if (!view) {
      router.replace("/dashboard/user");
      return;
    }
    if (view.status === "WAITING") {
      router.replace(`/lobby/${gameId}`);
      return;
    }
    if (view.status !== "IN_PROGRESS") {
      router.replace("/dashboard/user/history");
      return;
    }
    playersRef.current = view.players;
    setGame(view);
    setLoading(false);
  }, [gameId, router]);

  useEffect(() => {
    if (!gameId || !session?.user?.id) return;
    sync();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("phase-changed", (data: { phase: Phase; phaseNumber: number }) => {
      setTitleCard({ phase: data.phase, phaseNumber: data.phaseNumber });
      setGame((previous: any) => (previous ? { ...previous, phase: data.phase, phaseNumber: data.phaseNumber } : previous));
    });
    channel.bind("player-status-updated", (data: { playerId: string; isAlive: boolean }) => {
      const wasAlive = playersRef.current.find((player) => player.id === data.playerId)?.isAlive !== false;
      if (!data.isAlive && wasAlive) setVerdict({ playerId: data.playerId });
      sync();
    });
    channel.bind("game-state-updated", sync);
    channel.bind("night-records-public", sync);
    channel.bind("game-ended", (data: { winningAlignment: string }) => setEnded(data.winningAlignment || "UNKNOWN"));
    channel.bind("game-cancelled", () => {
      showAlert("بازی لغو شد", "گرداننده این بازی را لغو کرد.", "warning");
      router.push("/dashboard/user");
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, session?.user?.id, router, showAlert, sync]);

  const players: GamePlayer[] = useMemo(() => game?.players || [], [game]);
  const hues = useMemo(() => assignTableHues(players.map((player) => player.userId || player.id)), [players]);
  const me = game?.myPlayer;
  const alive = players.filter((player) => player.isAlive !== false).length;
  const phase: Phase | null = game?.phase || null;
  const phaseNumber: number = game?.phaseNumber ?? 0;
  const scenarioName: string = game?.scenario?.name || "سناریو";

  const composition = useMemo(() => {
    const roles = (game?.scenario?.roles || []).map((entry: any) => ({
      id: entry.roleId,
      name: entry.role?.name || "نقش",
      alignment: entry.role?.alignment || "NEUTRAL",
      count: entry.count,
    }));
    const counts = { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0 } as Record<string, number>;
    roles.forEach((role: any) => (counts[role.alignment] = (counts[role.alignment] || 0) + role.count));
    return { roles, counts };
  }, [game]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-canvas" dir="rtl">
        <div className="h-52 animate-pulse bg-night" />
        <div className="mx-auto mt-8 aspect-[3/4] w-[min(19rem,80vw)] animate-pulse rounded-[1.6rem] bg-surface" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-6 text-center" dir="rtl">
        <div className="max-w-sm">
          <h1 className="nq-display text-4xl">شما سر این میز نیستید</h1>
          <p className="mt-3 font-medium leading-7 text-muted">این بازی بدون شما شروع شده است. می‌توانید به خانه برگردید و به لابی دیگری بپیوندید.</p>
          <Link href="/dashboard/user" className="nq-btn nq-btn-primary nq-btn-lg mt-6 w-full">
            بازگشت به خانه
          </Link>
        </div>
      </div>
    );
  }

  const verdictPlayer = verdict ? players.find((player) => player.id === verdict.playerId) : null;
  const surface = phase ? PHASE_SURFACE[phase] : "bg-night text-moon";

  return (
    <div className="min-h-dvh bg-canvas pb-12" dir="rtl">
      <header className={`nq-grain relative overflow-hidden transition-colors duration-700 ${surface}`}>
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-10 pt-[max(env(safe-area-inset-top),1rem)] lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard/user" className="nq-icon-btn bg-current/10 text-current hover:text-current" aria-label="بازگشت به خانه">
              <ArrowRight size={20} weight="bold" aria-hidden />
            </Link>
            <span className="rounded-full bg-black/15 px-3 py-1.5 text-sm font-extrabold">{`${toFa(alive)} نفر در بازی`}</span>
          </div>
          <p className="mt-6 text-sm font-bold opacity-80">{`${scenarioName} · گرداننده: ${game?.moderator?.name || "نامشخص"}`}</p>
          <h1 className="nq-display mt-1 text-[3.4rem] leading-[1.05] lg:text-[4.5rem]">{phaseTitle(phase, phaseNumber)}</h1>
          {phase ? <p className="mt-2 max-w-md text-[0.95rem] font-semibold leading-7 opacity-85">{PHASE_COPY[phase]}</p> : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 pt-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14 lg:px-8">
        <section aria-label="نقش شما" className="lg:sticky lg:top-8 lg:self-start">
          {me.isAlive === false ? (
            <Notice tone="danger" className="mb-5">
              شما از بازی بیرون رفته‌اید. تا پایان بازی نقشتان را لو ندهید.
            </Notice>
          ) : null}
          <RoleCard name={me.role?.name} description={me.role?.description} alignment={me.role?.alignment} />
        </section>

        <div className="flex flex-col gap-10">
          <section aria-labelledby="table-title">
            <div className="flex items-baseline justify-between">
              <h2 id="table-title" className="text-lg font-extrabold">
                دور میز
              </h2>
              <span className="text-sm font-bold text-muted">{`${toFa(players.length - alive)} نفر بیرون`}</span>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6">
              {players.map((player) => {
                const out = player.isAlive === false;
                const isMe = player.id === me.id;
                return (
                  <li key={player.id} className="flex flex-col items-center gap-1.5 text-center">
                    <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="lg" eliminated={out} className={isMe ? "ring-2 ring-accent ring-offset-2 ring-offset-canvas" : ""} />
                    <span className={`w-full truncate text-xs font-bold ${out ? "text-faint line-through" : "text-fg"}`}>{isMe ? "شما" : player.name}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <details className="group rounded-[var(--radius-lg)] border border-line bg-surface" open>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5">
              <span className="text-lg font-extrabold">ترکیب نقش‌ها</span>
              <span className="flex items-center gap-3 text-sm font-bold">
                <span className={FACTION.CITIZEN.text}>{`${toFa(composition.counts.CITIZEN || 0)} شهروند`}</span>
                <span className={FACTION.MAFIA.text}>{`${toFa(composition.counts.MAFIA || 0)} مافیا`}</span>
                {composition.counts.NEUTRAL ? <span className={FACTION.NEUTRAL.text}>{`${toFa(composition.counts.NEUTRAL)} مستقل`}</span> : null}
                <CaretDown size={18} weight="bold" className="text-muted transition-transform group-open:rotate-180" aria-hidden />
              </span>
            </summary>
            <ul className="border-t border-line px-5 py-2">
              {composition.roles.map((role: any) => (
                <li key={role.id || role.name} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 font-bold">
                    {role.name}
                    {role.count > 1 ? <span className="text-sm text-muted">{`× ${toFa(role.count)}`}</span> : null}
                  </span>
                  <FactionTag alignment={role.alignment} />
                </li>
              ))}
            </ul>
          </details>

          {game?.nightEvents?.length ? <PublicNightLog events={game.nightEvents} /> : null}
        </div>
      </main>

      {titleCard ? <PhaseTitleCard phase={titleCard.phase} phaseNumber={titleCard.phaseNumber} subtitle={scenarioName} onDone={() => setTitleCard(null)} /> : null}

      {verdict && verdictPlayer && !titleCard ? (
        <VerdictOverlay
          name={verdictPlayer.name}
          hue={hues.get(verdictPlayer.userId || verdictPlayer.id) ?? 15}
          isMe={verdictPlayer.id === me.id}
          onDone={() => setVerdict(null)}
        />
      ) : null}

      {ended ? (
        <div className="nq-grain fixed inset-0 z-[70] flex flex-col justify-end bg-night px-6 pb-[max(env(safe-area-inset-bottom),2.5rem)] text-moon animate-[phase-in_520ms_cubic-bezier(0.16,1,0.3,1)_both]" role="dialog" aria-modal="true" aria-labelledby="end-title">
          <Trophy size={56} weight="fill" className="relative z-10 text-day" aria-hidden />
          <p className="relative z-10 mt-6 text-base font-bold opacity-80">پایان بازی</p>
          <h2 id="end-title" className="nq-display relative z-10 mt-1 text-[4.6rem] leading-none">
            {WINNER_LABEL[ended] ? `${WINNER_LABEL[ended]} بردند` : "بازی تمام شد"}
          </h2>
          <p className="relative z-10 mt-4 max-w-sm text-lg font-semibold leading-8 opacity-90">نقاب‌ها برداشته شد. داستان کامل این بازی در «بازی‌های من» ثبت شده است.</p>
          <div className="relative z-10 mt-8 grid gap-3 sm:max-w-sm">
            <Link href="/dashboard/user/history" className="nq-btn nq-btn-lg bg-moon text-night">
              دیدن گزارش بازی
            </Link>
            <Link href="/dashboard/user" className="nq-btn nq-btn-lg bg-moon/12 text-moon">
              بازگشت به خانه
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
