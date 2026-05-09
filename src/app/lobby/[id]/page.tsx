"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import { joinGame, getGameStatus } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { LobbyPreviewCard } from "@/components/game/LobbyPreviewCard";

type Player = {
  id: string;
  name: string;
  userId?: string | null;
  image?: string | null;
  isAlive?: boolean;
};

export default function UserLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert } = usePopup();
  const gameId = params.id as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");

  useEffect(() => {
    if (!gameId) return;
    let mounted = true;
    let redirected = false;

    const syncGameStatus = async () => {
      try {
        const result = await getGameStatus(gameId);
        if (!mounted || redirected) return;
        if (!result) {
          redirected = true;
          router.replace("/join");
          return;
        }
        if (result.status === "FINISHED") {
          redirected = true;
          router.replace("/dashboard/user");
          return;
        }

        const nextPlayers = (result.players || []).map((player: any) => ({
          id: player.id,
          name: player.name,
          userId: player.userId,
          image: player.image || player.user?.image || null,
          isAlive: player.isAlive,
        }));
        const userIsInLobby = Boolean(session?.user?.id && nextPlayers.some((player: Player) => player.userId === session.user.id));
        const userIsBlocked = Boolean(result.currentUserBlocked);

        if (result.status === "IN_PROGRESS" && (userIsInLobby || joined)) {
          redirected = true;
          router.replace(`/game/${gameId}`);
          return;
        }

        setGame(result);
        setPlayers(nextPlayers);
        setJoined(userIsInLobby);
        setBlocked(userIsBlocked && !userIsInLobby);
        setLoading(false);
      } catch (error) {
        console.error("Lobby status sync failed:", error);
        if (mounted) setLoading(false);
      }
    };

    syncGameStatus();
    const statusInterval = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        syncGameStatus();
      }
    }, 3000);

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("player-joined", (data: { player: Player }) => {
      setPlayers((previous) => {
        if (previous.find((player) => player.id === data.player.id)) return previous;
        return [...previous, data.player];
      });
    });

    channel.bind("game-started", () => {
      syncGameStatus();
    });

    channel.bind("player-removed", (data: { playerId: string; userId?: string | null; blocked?: boolean }) => {
      setPlayers((previous) => previous.filter((player) => player.id !== data.playerId));
      if (session?.user?.id && data.userId === session.user.id) {
        setJoined(false);
        setBlocked(Boolean(data.blocked));
        showAlert(
          data.blocked ? "ورود به این لابی محدود شد" : "از لابی خارج شدید",
          data.blocked
            ? "گرداننده شما را از این لابی حذف و ورود دوباره به همین بازی را محدود کرد."
            : "گرداننده شما را از لابی خارج کرد. اگر محدود نشده باشید می‌توانید دوباره وارد شوید.",
          data.blocked ? "error" : "warning"
        );
      }
    });

    return () => {
      mounted = false;
      window.clearInterval(statusInterval);
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, joined, router, session?.user?.id, showAlert]);

  const handleJoin = async () => {
    const playerName = (session?.user?.name || session?.user?.email || "").trim();

    if (!game?.code) return;
    if (!playerName) {
      showAlert("نام بازیکن", "برای پیوستن به بازی ابتدا نام حساب خود را تکمیل کنید.", "error");
      return;
    }

    setLoading(true);
    const result = await joinGame(game.code, playerName, joinPassword);

    if (result.success) {
      setJoined(true);
      setPlayers((previous) =>
        previous.some((player) => player.id === result.playerId)
          ? previous
          : [
              ...previous,
              {
                id: result.playerId,
                name: playerName,
                userId: session?.user?.id,
                image: session?.user?.image || null,
                isAlive: true,
              },
            ]
      );
    } else {
      showAlert("خطا در ورود", result.error || "خطا در پیوستن به لابی", "error");
    }

    setLoading(false);
  };

  const capacity = useMemo(
    () =>
      game?.scenario?.roles?.reduce((sum: number, role: any) => {
        return sum + role.count;
      }, 0) || 0,
    [game]
  );
  const lobbyIsFull = capacity > 0 && players.length >= capacity && !joined;

  const playerItems = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        name: player.name,
        current: Boolean(session?.user?.id && player.userId === session.user.id),
        image: player.image || null,
        isAlive: player.isAlive,
      })),
    [players, session?.user?.id]
  );

  const roleBreakdown = useMemo(
    () =>
      (game?.scenario?.roles || []).map((role: any) => ({
        id: role.roleId,
        name: role.role?.name || "نقش",
        count: role.count,
        alignment: role.role?.alignment,
      })),
    [game]
  );

  if (loading) {
    return (
      <div className="app-page min-h-screen py-8" dir="rtl">
        <div className="app-container">
          <div className="flex min-h-[560px] items-center justify-center">
            <div className="pm-card w-full max-w-xl overflow-hidden text-center">
              <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
              <div className="p-8 sm:p-10">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-sky-400 text-sky-950 shadow-lg shadow-sky-500/20">
                  <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
                </div>
                <p className="mt-5 text-lg font-black text-[var(--pm-text)]">در حال بازسازی نمای لابی</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--pm-muted)]">
                  وضعیت بازیکنان، ظرفیت سناریو و امکان ورود به بازی در حال بررسی است.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen py-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:py-8 sm:pb-8" dir="rtl">
      <div className="app-container space-y-5">
        <LobbyPreviewCard
          title={game?.name || "لابی بازی مافیا"}
          subtitle="وضعیت ورود، بازیکنان حاضر و شروع بازی به صورت زنده هماهنگ می‌شود."
          scenarioName={game?.scenario?.name || "سناریوی تعیین نشده"}
          code={game?.code || "------"}
          statusLabel={lobbyIsFull ? "ظرفیت کامل" : joined ? "عضو لابی" : "آماده ورود"}
          playerCount={players.length}
          capacity={capacity}
          moderatorName={game?.moderator?.name || "گرداننده"}
          locked={game?.hasPassword}
          players={playerItems}
          roleBreakdown={roleBreakdown}
          actionArea={
            !joined ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                  {[
                    { icon: "login", label: "ورود", className: "bg-[var(--pm-primary)] text-[var(--pm-text-inverse)]" },
                    { icon: "groups", label: "انتظار", className: "bg-white text-[var(--pm-muted)] dark:bg-white/10 dark:text-zinc-300" },
                    { icon: "play_arrow", label: "شروع", className: "bg-white text-[var(--pm-muted)] dark:bg-white/10 dark:text-zinc-300" },
                  ].map((step) => (
                    <div key={step.label} className={`rounded-lg border border-[var(--pm-line)] px-2 py-2 dark:border-[var(--pm-line)] ${step.className}`}>
                      <span className="material-symbols-outlined block text-lg">{step.icon}</span>
                      <span className="mt-1 block">{step.label}</span>
                    </div>
                  ))}
                </div>

                {game?.hasPassword && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-[var(--pm-muted)]">رمز ورود به لابی</label>
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(event) => setJoinPassword(event.target.value)}
                      placeholder="رمز عبور را وارد کنید"
                    />
                  </div>
                )}

                {blocked && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-600 dark:text-red-300">
                    ورود شما به این لابی توسط گرداننده محدود شده است.
                  </div>
                )}

                {lobbyIsFull && !blocked && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-bold leading-6 text-amber-700 dark:text-amber-300">
                    ظرفیت این سناریو تکمیل شده و ورود بازیکن جدید ممکن نیست.
                  </div>
                )}

                <button onClick={handleJoin} disabled={loading || lobbyIsFull || blocked} className="pm-button-primary min-h-12 w-full text-base disabled:opacity-50">
                  <span className="material-symbols-outlined text-xl">login</span>
                  پیوستن به بازی
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-4 text-[var(--pm-primary)]">
                  <div className="flex items-center gap-2 font-black">
                    <span className="material-symbols-outlined">check_circle</span>
                    شما در لابی هستید
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6">با شروع بازی توسط گرداننده، صفحه نقش به صورت خودکار باز می‌شود.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                  <span className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 py-2 text-[var(--pm-primary)]">ورود انجام شد</span>
                  <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-2 text-sky-700 dark:text-sky-300">انتظار شروع</span>
                  <span className="rounded-lg border border-[var(--pm-line)] bg-white px-2 py-2 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-[var(--pm-muted)]">صفحه نقش</span>
                </div>
              </div>
            )
          }
          footer={
            <button
              onClick={() => router.push("/dashboard/user")}
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pm-muted)] transition-colors hover:text-zinc-950 dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
              بازگشت به پیشخوان
            </button>
          }
        />
      </div>
    </div>
  );
}
