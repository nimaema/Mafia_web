"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { useSession } from "next-auth/react";
import { joinGame, getGameStatus } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { LobbyPreviewCard } from "@/components/game/LobbyPreviewCard";

type Player = {
  id: string;
  name: string;
  userId?: string | null;
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

    getGameStatus(gameId).then((result) => {
      if (!result) {
        router.push("/dashboard/user");
        return;
      }

      setGame(result);
      if (result.players) {
        const nextPlayers = result.players.map((player: any) => ({
          id: player.id,
          name: player.name,
          userId: player.userId,
        }));

        setPlayers(nextPlayers);
        if (session?.user?.id && nextPlayers.some((player: Player) => player.userId === session.user.id)) {
          setJoined(true);
        }
      }

      setLoading(false);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("player-joined", (data: { player: Player }) => {
      setPlayers((previous) => {
        if (previous.find((player) => player.id === data.player.id)) return previous;
        return [...previous, data.player];
      });
    });

    channel.bind("game-started", () => {
      router.push(`/game/${gameId}`);
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router, session?.user?.id]);

  const handleJoin = async () => {
    if (!session?.user?.name || !game?.code) return;

    setLoading(true);
    const result = await joinGame(game.code, session.user.name, joinPassword, session.user.id);

    if (result.success) {
      setJoined(true);
      setPlayers((previous) =>
        previous.some((player) => player.id === result.playerId)
          ? previous
          : [
              ...previous,
              {
                id: result.playerId,
                name: session.user?.name || "شما",
                userId: session.user?.id,
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
