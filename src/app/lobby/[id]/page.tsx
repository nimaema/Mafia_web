"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, Copy, LockSimple, ShareNetwork, SignOut } from "@phosphor-icons/react";
import { getGameStatus, joinGame, leaveLobby } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { usePopup } from "@/components/PopupProvider";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { Notice } from "@/components/ui/Notice";
import { FactionTag } from "@/components/ui/Tag";
import { assignTableHues } from "@/lib/playerColor";

type Player = { id: string; name: string; userId?: string | null };

const toFa = (value: number) => value.toLocaleString("fa-IR");
const faDigits = (value: string) => value.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

export default function PlayerLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const gameId = params.id as string;

  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joined, setJoined] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    let mounted = true;
    let redirected = false;

    const sync = async () => {
      try {
        const result = await getGameStatus(gameId);
        if (!mounted || redirected) return;
        if (!result) {
          redirected = true;
          router.replace("/dashboard/user");
          return;
        }
        if (result.status === "FINISHED") {
          redirected = true;
          router.replace("/dashboard/user");
          return;
        }
        const nextPlayers: Player[] = (result.players || []).map((player: any) => ({ id: player.id, name: player.name, userId: player.userId }));
        const inLobby = Boolean(session?.user?.id && nextPlayers.some((player) => player.userId === session.user.id));
        if (result.status === "IN_PROGRESS" && inLobby) {
          redirected = true;
          router.replace(`/game/${gameId}`);
          return;
        }
        setGame(result);
        setPlayers(nextPlayers);
        setJoined(inLobby);
        setBlocked(Boolean(result.currentUserBlocked) && !inLobby);
        setLoading(false);
      } catch (error) {
        console.error("Lobby status sync failed:", error);
        if (mounted) setLoading(false);
      }
    };

    sync();
    const interval = window.setInterval(() => document.visibilityState !== "hidden" && sync(), 4000);

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("player-joined", (data: { player: Player }) =>
      setPlayers((previous) => (previous.some((player) => player.id === data.player.id) ? previous : [...previous, data.player])),
    );
    channel.bind("player-left", (data: { playerId: string }) => setPlayers((previous) => previous.filter((player) => player.id !== data.playerId)));
    channel.bind("game-started", sync);
    channel.bind("scenario-updated", sync);
    channel.bind("player-removed", (data: { playerId: string; userId?: string | null; blocked?: boolean }) => {
      setPlayers((previous) => previous.filter((player) => player.id !== data.playerId));
      if (session?.user?.id && data.userId === session.user.id) {
        setJoined(false);
        setBlocked(Boolean(data.blocked));
        showAlert(
          data.blocked ? "ورود به این لابی بسته شد" : "از لابی خارج شدید",
          data.blocked ? "گرداننده شما را از این لابی بیرون کرد و ورود دوباره را بست." : "گرداننده شما را از لابی خارج کرد. می‌توانید دوباره بپیوندید.",
          data.blocked ? "error" : "warning",
        );
      }
    });
    channel.bind("game-cancelled", () => {
      showAlert("لابی بسته شد", "گرداننده این لابی را لغو کرد.", "warning");
      router.replace("/dashboard/user");
    });

    return () => {
      mounted = false;
      window.clearInterval(interval);
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router, session?.user?.id, showAlert]);

  const capacity = useMemo(() => (game?.scenario?.roles || []).reduce((sum: number, role: any) => sum + role.count, 0), [game]);
  const hues = useMemo(() => assignTableHues(players.map((player) => player.userId || player.id)), [players]);
  const isFull = capacity > 0 && players.length >= capacity && !joined;
  const roles = (game?.scenario?.roles || []) as any[];

  const handleJoin = async () => {
    const name = (session?.user?.name || session?.user?.email || "").trim();
    if (!game?.code) return;
    if (!name) {
      setJoinError("اول نام خود را در پروفایل کامل کنید.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    const result = await joinGame(game.code, name, password);
    setJoining(false);
    if (result.success) {
      setJoined(true);
      setPlayers((previous) => (previous.some((player) => player.id === result.playerId) ? previous : [...previous, { id: result.playerId!, name, userId: session?.user?.id }]));
    } else {
      setJoinError(result.error || "پیوستن به لابی انجام نشد.");
    }
  };

  const handleLeave = () =>
    showConfirm(
      "از میز بلند می‌شوید؟",
      "صندلی‌تان آزاد می‌شود. تا قبل از شروع بازی می‌توانید دوباره بنشینید.",
      async () => {
        setLeaving(true);
        const result = await leaveLobby(gameId);
        setLeaving(false);
        if (result.success) {
          setJoined(false);
          setPlayers((previous) => previous.filter((player) => player.userId !== session?.user?.id));
          showToast("از میز بلند شدید", "success");
        } else {
          showToast(result.error || "ترک لابی انجام نشد", "error");
        }
      },
      "warning",
    );

  const shareLobby = async () => {
    const url = `${window.location.origin}/lobby/${gameId}`;
    const text = `بیا سر میز «${game?.name || "مافیا"}» در نقاب. کد ورود: ${game?.code || ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "نقاب", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("لینک لابی کپی شد", "success");
    } catch {
      /* the share sheet was dismissed */
    }
  };

  const copyCode = async () => {
    if (!game?.code) return;
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-canvas px-5 pt-16" dir="rtl">
        <div className="mx-auto max-w-xl">
          <div className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
          <div className="mt-6 h-72 animate-pulse rounded-[var(--radius-lg)] bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas pb-[calc(env(safe-area-inset-bottom)+8rem)]" dir="rtl">
      <div className="mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/user" className="nq-icon-btn" aria-label="بازگشت به خانه">
            <ArrowRight size={20} weight="bold" aria-hidden />
          </Link>
          <button type="button" onClick={shareLobby} className="nq-icon-btn" aria-label="دعوت دوستان به این لابی">
            <ShareNetwork size={20} weight="bold" aria-hidden />
          </button>
        </div>

        <section className="nq-khatam mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5">
          <p className="text-sm font-bold text-muted">{`${game?.scenario?.name || "سناریو هنوز انتخاب نشده"} · گرداننده: ${game?.moderator?.name || "نامشخص"}`}</p>
          <h1 className="nq-display mt-1 text-[2.6rem] leading-[1.15]">{game?.name || "لابی مافیا"}</h1>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-canvas px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-muted">
              {game?.hasPassword ? <LockSimple size={16} weight="bold" aria-label="لابی رمزدار" /> : null}
              کد ورود
            </span>
            <span className="text-2xl font-black tracking-[0.18em] text-accent tabular-nums" dir="ltr">
              {game?.code ? faDigits(game.code) : "------"}
            </span>
            <button type="button" onClick={copyCode} className="nq-icon-btn size-10 bg-transparent" aria-label="کپی کد ورود">
              {copied ? <Check size={20} weight="bold" className="text-success" aria-hidden /> : <Copy size={20} weight="bold" aria-hidden />}
            </button>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="seats-title">
          <div className="flex items-baseline justify-between">
            <h2 id="seats-title" className="text-lg font-extrabold">
              دور میز
            </h2>
            <span className="text-sm font-bold text-muted">{capacity ? `${toFa(players.length)} از ${toFa(capacity)} نفر` : `${toFa(players.length)} نفر`}</span>
          </div>
          {players.length ? (
            <ul className="mt-3 flex flex-col">
              {players.map((player) => {
                const isMe = Boolean(session?.user?.id && player.userId === session.user.id);
                return (
                  <li key={player.id} className="motion-reveal flex items-center gap-3 py-2">
                    <MaskAvatar seed={player.userId || player.id} hue={hues.get(player.userId || player.id)} size="md" />
                    <span className="flex-1 truncate font-bold">{player.name}</span>
                    {isMe ? <span className="nq-tag bg-accent-soft text-accent">شما</span> : !player.userId ? <span className="nq-tag bg-raised text-muted">مهمان</span> : null}
                  </li>
                );
              })}
              {capacity > players.length
                ? Array.from({ length: Math.min(capacity - players.length, 3) }).map((_, index) => (
                    <li key={`empty-${index}`} className="flex items-center gap-3 py-2 text-faint">
                      <span className="size-11 rounded-[0.85rem] border-2 border-dashed border-line-strong" aria-hidden />
                      <span className="text-sm font-bold">صندلی خالی</span>
                    </li>
                  ))
                : null}
            </ul>
          ) : (
            <p className="mt-3 rounded-[var(--radius-md)] bg-surface p-5 text-center text-sm font-medium leading-7 text-muted">
              هنوز کسی سر میز ننشسته. اولین نفر باشید.
            </p>
          )}
        </section>

        {roles.length ? (
          <section className="mt-8" aria-labelledby="roles-title">
            <h2 id="roles-title" className="text-lg font-extrabold">
              نقش‌های این بازی
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {roles.map((entry: any) => (
                <li key={entry.roleId} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pe-1 ps-3.5 text-sm font-bold">
                  {entry.role?.name || "نقش"}
                  {entry.count > 1 ? <span className="text-muted">{`× ${toFa(entry.count)}`}</span> : null}
                  <FactionTag alignment={entry.role?.alignment} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 backdrop-blur-xl">
        <div className="mx-auto max-w-xl">
          {joined ? (
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 items-center gap-3 rounded-[var(--radius-md)] bg-accent-soft px-4 py-3.5 text-accent" role="status">
                <span className="size-2.5 shrink-0 animate-[live-dot_1.6s_ease-in-out_infinite] rounded-full bg-accent" aria-hidden />
                <p className="text-sm font-extrabold leading-6">شما سر میز هستید. با شروع بازی، نقشتان همین‌جا باز می‌شود.</p>
              </div>
              <button type="button" onClick={handleLeave} disabled={leaving} className="nq-btn nq-btn-secondary shrink-0 flex-col gap-0.5 px-3 text-xs" aria-label="ترک میز">
                <SignOut size={20} weight="bold" className="-scale-x-100" aria-hidden />
                ترک میز
              </button>
            </div>
          ) : blocked ? (
            <Notice tone="danger">گرداننده ورود شما را به این لابی بسته است.</Notice>
          ) : isFull ? (
            <Notice tone="warning">همه صندلی‌های این بازی پر شده است.</Notice>
          ) : (
            <div className="flex flex-col gap-3">
              {joinError ? <Notice tone="danger">{joinError}</Notice> : null}
              <div className="flex gap-2">
                {game?.hasPassword ? (
                  <input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-label="رمز لابی"
                    placeholder="رمز لابی"
                    className="min-h-14 flex-1"
                  />
                ) : null}
                <button type="button" onClick={handleJoin} disabled={joining} className="nq-btn nq-btn-primary nq-btn-lg flex-1">
                  {joining ? "در حال پیوستن…" : "نشستن سر میز"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
