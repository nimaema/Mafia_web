"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getGameStatus } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher";
import Link from "next/link";

export default function UserGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const gameId = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [myPlayerInfo, setMyPlayerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revealRole, setRevealRole] = useState(false);

  useEffect(() => {
    if (!gameId || !session?.user?.id) return;

    getGameStatus(gameId).then((res) => {
      // If game is finished or doesn't exist, player shouldn't be here
      if (!res || res.status !== "IN_PROGRESS") {
        router.push("/dashboard/user");
        return;
      }
      
      setGame(res);
      
      // Find current user's player record in this game
      const me = res.players?.find((p: any) => p.userId === session.user?.id);
      if (me) {
        setMyPlayerInfo(me);
      }
      
      setLoading(false);
    });

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);
    
    // Listen for game end
    channel.bind('game-ended', (data: { winningAlignment: string }) => {
      const winnerStr = data.winningAlignment === 'CITIZEN' ? 'شهروندان' : data.winningAlignment === 'MAFIA' ? 'مافیا' : 'مستقل‌ها';
      alert(`بازی به پایان رسید! تیم پیروز: ${winnerStr}`);
      router.push("/dashboard/user");
    });

    // Listen for game cancellation
    channel.bind('game-cancelled', () => {
      alert("بازی توسط گرداننده لغو شد.");
      router.push("/dashboard/user");
    });

    return () => {
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, session?.user?.id, router]);

  if (loading) return <div className="p-12 text-center animate-pulse text-zinc-500">در حال دریافت نقش شما...</div>;

  if (!myPlayerInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <span className="material-symbols-outlined text-6xl text-zinc-300">error</span>
        <h2 className="text-2xl font-bold">شما در این بازی حضور ندارید!</h2>
        <Link href="/dashboard/user" className="px-6 py-2 bg-zinc-900 text-white rounded-xl mt-4">بازگشت به پیشخوان</Link>
      </div>
    );
  }

  const role = myPlayerInfo.role;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col items-center p-8 relative">
        
        {/* Background glow based on role alignment (only visible if revealed) */}
        {revealRole && (
          <div className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-1000 ${
            role?.alignment === 'CITIZEN' ? 'bg-blue-500' : 
            role?.alignment === 'MAFIA' ? 'bg-red-500' : 
            'bg-amber-500'
          }`}></div>
        )}

        <div className="text-center mb-8 z-10">
          <h1 className="text-3xl font-black mb-2">کارت نقش شما</h1>
          <p className="text-zinc-500 text-sm">بازی در حال اجراست. لطفاً نقش خود را به کسی نشان ندهید.</p>
        </div>

        {/* The Card */}
        <div 
          onClick={() => setRevealRole(!revealRole)}
          className={`w-full aspect-[2/3] rounded-2xl cursor-pointer transition-all duration-700 preserve-3d relative z-10 ${revealRole ? '[transform:rotateY(180deg)]' : ''}`}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          {/* Card Back (Hidden) */}
          <div className="absolute inset-0 bg-zinc-950 rounded-2xl border-4 border-zinc-800 flex flex-col items-center justify-center p-6 backface-hidden shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
            <div className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-5xl text-zinc-700">visibility_off</span>
            </div>
            <p className="text-white font-bold text-lg mb-2">برای مشاهده نقش ضربه بزنید</p>
            <p className="text-zinc-500 text-xs text-center">فقط زمانی که کسی کنارتان نیست نقش خود را ببینید</p>
          </div>

          {/* Card Front (Revealed) */}
          <div className={`absolute inset-0 rounded-2xl border-4 flex flex-col items-center justify-center p-6 backface-hidden shadow-2xl overflow-hidden ${
            role?.alignment === 'CITIZEN' ? 'bg-blue-950 border-blue-800' : 
            role?.alignment === 'MAFIA' ? 'bg-red-950 border-red-800' : 
            'bg-amber-950 border-amber-800'
          }`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            
            <div className={`absolute top-0 w-full py-2 text-center text-xs font-black tracking-widest uppercase text-white/50 bg-black/20`}>
              {role?.alignment === 'CITIZEN' ? 'تیم شهروند' : 
               role?.alignment === 'MAFIA' ? 'تیم مافیا' : 'مستقل'}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <h2 className={`text-4xl font-black mb-4 text-white drop-shadow-md`}>
                {role?.name || "بدون نقش"}
              </h2>
              
              <div className="w-full bg-black/20 rounded-xl p-4 text-center border border-white/10">
                <p className="text-white/80 text-sm leading-relaxed">{role?.description || "توضیحی برای این نقش وجود ندارد."}</p>
              </div>
            </div>

            <div className="mt-auto pt-4 text-white/40 text-xs">
               برای مخفی کردن دوباره ضربه بزنید
            </div>
          </div>
        </div>

        <div className="mt-8 w-full z-10">
           <Link href="/dashboard/user" className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              بازگشت به پیشخوان
           </Link>
        </div>

      </div>
    </div>
  );
}