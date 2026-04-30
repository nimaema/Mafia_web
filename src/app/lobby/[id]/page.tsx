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

        if (result.status === "IN_PROGRESS" && (userIsInLobby || joined)) {
          redirected = true;
          router.replace(`/game/${gameId}`);
          return;
        }

        setGame(result);
        setPlayers(nextPlayers);
        setJoined(userIsInLobby);
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

    return () => {
      mounted = false;
      window.clearInterval(statusInterval);
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, joined, router, session?.user?.id]);

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
          <div className="ui-card h-[680px] animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen py-8" dir="rtl">
      <div className="app-container space-y-5">
        <LobbyPreviewCard
          title={game?.name || "لابی بازی مافیا"}
          subtitle="بازیکنان حاضر، ظرفیت، سناریو و کد ورود در همین نما در دسترس هستند."
          scenarioName={game?.scenario?.name || "سناریوی تعیین نشده"}
          code={game?.code || "------"}
          statusLabel="در انتظار شروع"
          playerCount={players.length}
          capacity={capacity}
          moderatorName={game?.moderator?.name || "گرداننده"}
          locked={game?.hasPassword}
          players={playerItems}
          roleBreakdown={roleBreakdown}
          actionArea={
            !joined ? (
              <div className="flex flex-col gap-4">
                {game?.hasPassword && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">رمز ورود به لابی</label>
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(event) => setJoinPassword(event.target.value)}
                      placeholder="رمز عبور را وارد کنید"
                    />
                  </div>
                )}

                <button onClick={handleJoin} disabled={loading} className="ui-button-primary min-h-12 w-full sm:w-auto">
                  <span className="material-symbols-outlined text-xl">login</span>
                  پیوستن به بازی
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-lime-500/20 bg-lime-500/10 p-4 text-lime-700 dark:text-lime-300">
                <div className="flex items-center gap-2 font-black">
                  <span className="material-symbols-outlined">check_circle</span>
                  شما در لابی هستید
                </div>
                <p className="mt-2 text-sm leading-6">منتظر شروع بازی توسط گرداننده بمانید. با شروع بازی، خودکار وارد صفحه نقش می‌شوید.</p>
              </div>
            )
          }
          footer={
            <button
              onClick={() => router.push("/dashboard/user")}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
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
