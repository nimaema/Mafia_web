"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher";
import { getGameStatus, joinGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatusChip } from "@/components/CommandUI";

type Player = { id: string; name: string; userId?: string | null };

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
    getGameStatus(gameId).then((res) => {
      if (!res) {
        router.push("/dashboard/user");
        return;
      }
      setGame(res);
      setPlayers(res.players || []);
      if (session?.user?.id && res.players?.some((p: any) => p.userId === session.user?.id)) setJoined(true);
      setLoading(false);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    channel.bind("player-joined", (data: { player: Player }) => {
      setPlayers((prev) => (prev.find((p) => p.id === data.player.id) ? prev : [...prev, data.player]));
    });
    channel.bind("game-started", () => router.push(`/game/${gameId}`));
    return () => pusher.unsubscribe(`game-${gameId}`);
  }, [gameId, router, session?.user?.id]);

  const handleJoin = async () => {
    if (!session?.user?.name) return;
    setLoading(true);
    const res = await joinGame(game.code, session.user.name, joinPassword, session.user.id);
    if (res.success) setJoined(true);
    else showAlert("خطا در ورود", res.error || "خطا در پیوستن به لابی", "error");
    setLoading(false);
  };

  if (loading) return <EmptyState icon="progress_activity" title="در حال دریافت لابی..." />;

  const capacity = game?.scenario?.roles?.reduce((a: any, b: any) => a + b.count, 0) || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <CommandSurface className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StatusChip tone="emerald" pulse>لابی در انتظار</StatusChip>
            <h1 className="mt-3 text-2xl font-black text-zinc-50">{game?.name || "لابی بازی"}</h1>
            <p className="mt-1 text-sm text-zinc-400">سناریو: {game?.scenario?.name || "هنوز انتخاب نشده"}</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-center">
            <p className="text-[10px] font-black text-cyan-100/70">کد بازی</p>
            <p className="mt-1 font-mono text-3xl font-black tracking-[0.18em] text-cyan-100">#{game?.code}</p>
          </div>
        </div>
      </CommandSurface>

      <section className="space-y-3">
        <SectionHeader title="بازیکنان حاضر" eyebrow="Living Roster" icon="group" action={<StatusChip tone="cyan">{players.length}/{capacity || "?"}</StatusChip>} />
        <CommandSurface className="p-4">
          {players.length === 0 ? (
            <EmptyState icon="hourglass_empty" title="منتظر بازیکنان" />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {players.map((player, index) => (
                <div key={player.id} className="pm-ledger-row flex items-center gap-3 p-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-xs font-black text-cyan-100">
                    {index + 1}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#192122] bg-emerald-300" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-zinc-100">{player.name}</p>
                    {player.userId === session?.user?.id && <p className="text-[10px] font-bold text-emerald-200">شما</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CommandSurface>
      </section>

      {!joined ? (
        <CommandSurface className="space-y-3 p-4">
          {game?.hasPassword && <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} placeholder="رمز لابی" className="pm-input h-12 px-4 text-left" dir="ltr" />}
          <CommandButton onClick={handleJoin} disabled={loading} className="w-full">
            <span className="material-symbols-outlined text-[18px]">login</span>
            پیوستن به لابی
          </CommandButton>
        </CommandSurface>
      ) : (
        <CommandSurface className="p-4 text-center">
          <StatusChip tone="emerald" pulse>شما در لابی هستید</StatusChip>
          <p className="mt-3 text-sm text-zinc-400">بعد از شروع بازی، به صورت خودکار به کارت نقش منتقل می‌شوید.</p>
        </CommandSurface>
      )}

      <CommandButton tone="ghost" onClick={() => router.push("/dashboard/user")} className="w-full">
        بازگشت به خانه
      </CommandButton>
    </div>
  );
}
