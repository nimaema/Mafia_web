"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { useSession } from "next-auth/react";
import { joinGame, getGameStatus } from "@/actions/game";

type Player = {
  id: string;
  name: string;
};

export default function UserLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const gameId = params.id as string;
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    // Initial fetch
    getGameStatus(gameId).then(res => {
      if (res) {
        setGame(res);
        if (res.players) {
          setPlayers(res.players);
          // Check if current user is already in the players list
          if (session?.user?.id && res.players.some((p: any) => p.userId === session.user.id)) {
            setJoined(true);
          }
        }
      } else {
        router.push("/dashboard/user");
      }
      setLoading(false);
    });

    // Initialize Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind('player-joined', (data: { player: Player }) => {
      setPlayers((prev) => {
        if (prev.find(p => p.id === data.player.id)) return prev;
        return [...prev, data.player];
      });
    });

    channel.bind('game-started', () => {
      router.push(`/game/${gameId}`);
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, router, session?.user?.id]);

  const handleJoin = async () => {
    if (!session?.user?.name) return;
    setLoading(true);
    const res = await joinGame(gameId, session.user.name, session.user.id);
    if (res.success) {
      setJoined(true);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-12 text-center animate-pulse">در حال بارگذاری لابی...</div>;

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-zinc-950 p-4 flex flex-col items-center justify-center gap-8">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        <header className="p-8 bg-lime-500/5 border-b border-zinc-200 dark:border-zinc-800 text-center flex flex-col gap-2">
          <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-lime-500/20 mb-2 rotate-3">
             <span className="material-symbols-outlined text-zinc-950 text-3xl font-bold">groups</span>
          </div>
          <h1 className="text-2xl font-black">لابی بازی مافیا</h1>
          <p className="text-zinc-500 text-sm">سناریو: {game?.scenario?.name}</p>
          <div className="mt-4 px-4 py-2 bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-lime-500/50 flex flex-col">
             <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">کد اتاق</span>
             <span className="text-xl font-mono font-black text-lime-600 dark:text-lime-400">{game?.password || gameId.slice(0, 6).toUpperCase()}</span>
          </div>
        </header>

        <main className="p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lime-500">person</span>
              بازیکنان حاضر
            </h3>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-xs font-bold">{players.length} / {game?.scenario?.roles.reduce((a:any, b:any) => a + b.count, 0)}</span>
          </div>

          <div className="flex flex-col gap-2 min-h-[200px]">
             {players.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-2">
                  <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                  <p className="text-sm">در انتظار ورود بازیکنان...</p>
               </div>
             ) : (
               players.map((p, i) => (
                 <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-200 dark:bg-zinc-950/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-zinc-950 font-bold text-xs">{i + 1}</div>
                    <span className="font-bold">{p.name}</span>
                    {p.id === session?.user?.id && <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded-lg mr-auto">شما</span>}
                 </div>
               ))
             )}
          </div>

          {!joined ? (
            <button 
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-lime-500 text-zinc-950 py-4 rounded-2xl font-black text-lg shadow-lg shadow-lime-500/20 hover:bg-lime-600 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              پیوستن به بازی
            </button>
          ) : (
            <div className="bg-lime-100 dark:bg-lime-900/20 p-4 rounded-2xl flex flex-col items-center gap-2 border border-lime-200 dark:border-lime-800">
               <div className="flex items-center gap-2 text-lime-700 dark:text-lime-400 font-bold">
                  <span className="material-symbols-outlined animate-pulse">check_circle</span>
                  شما در لابی هستید
               </div>
               <p className="text-xs text-lime-600 dark:text-lime-500">منتظر شروع بازی توسط گرداننده باشید...</p>
            </div>
          )}
        </main>
      </div>

      <button 
        onClick={() => router.push("/dashboard/user")}
        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold text-sm flex items-center gap-2"
      >
        <span className="material-symbols-outlined">arrow_forward</span>
        بازگشت به پیشخوان
      </button>
    </div>
  );
}