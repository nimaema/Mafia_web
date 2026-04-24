"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { getGameStatus, startGame } from "@/actions/game";

type Player = {
  id: string;
  name: string;
};

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("در حال انتظار برای بازیکنان...");

  useEffect(() => {
    // Fetch initial status
    getGameStatus(gameId).then(res => {
      setGame(res);
      setLoading(false);
    });
    // Initialize Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind('player-joined', (data: { player: Player }) => {
      setPlayers((prev) => [...prev, data.player]);
    });

    channel.bind('player-left', (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter(p => p.id !== data.playerId));
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router]);

  const handleStartGame = async () => {
    setLoading(true);
    const res = await startGame(gameId);
    if (res.success) {
      router.push(`/dashboard/moderator/game/${gameId}`);
    } else {
      alert(res.error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">در حال بارگذاری...</div>;

  const requiredPlayers = game?.scenario?.roles.reduce((a: any, b: any) => a + b.count, 0) || 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <header className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-3xl">groups</span>
        </div>
        <h2 className="text-2xl font-bold">لابی بازی مافیا</h2>
        <p className="text-zinc-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
          {status}
        </p>
        
        <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 w-full">
          <p className="text-sm text-zinc-500 mb-1">کد ورود به بازی:</p>
          <div className="text-3xl font-mono tracking-widest font-bold text-zinc-900 dark:text-zinc-100">
            {gameId.substring(0, 6).toUpperCase()}
          </div>
        </div>
      </header>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">بازیکنان حاضر ({players.length})</h3>
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 p-2 min-h-64">
          {players.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 py-8">
              <span className="material-symbols-outlined text-4xl opacity-50">hourglass_empty</span>
              <p>هنوز کسی وارد نشده است...</p>
            </div>
          ) : (
            players.map((player, i) => (
              <div key={player.id} className="p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                  {i + 1}
                </div>
                <span className="font-medium text-lg">{player.name}</span>
              </div>
            ))
          )}
        </div>
      </section>
      
      <button 
        onClick={handleStartGame}
        disabled={players.length < requiredPlayers || loading}
        className="w-full bg-lime-500 text-zinc-950 text-lg font-semibold rounded-xl py-4 mt-2 hover:bg-lime-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">play_arrow</span>
        شروع بازی
      </button>
      {players.length < requiredPlayers && (
        <p className="text-center text-sm text-red-500 font-bold">حداقل {requiredPlayers} بازیکن برای این سناریو نیاز است.</p>
      )}
    </div>
  );
}
