"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGameStatus } from "@/actions/game";
import Link from "next/link";
import { usePopup } from "@/components/PopupProvider";

export default function ModeratorGamePage() {
  const params = useParams();
  const router = useRouter();
  const { showConfirm, showToast } = usePopup();
  const gameId = params.id as string;
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGameStatus(gameId).then((res) => {
      if (!res) {
        router.push("/dashboard/moderator");
        return;
      }
      setGame(res);
      setLoading(false);
    });
  }, [gameId, router]);

  if (loading) return <div className="p-12 text-center animate-pulse text-zinc-500">در حال بارگذاری اطلاعات بازی...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto mb-16">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">sports_esports</span>
            بازی در جریان
          </h2>
          <p className="text-zinc-500 mt-1">کد لابی: {game.id.substring(0, 6).toUpperCase()}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-zinc-500 font-bold mb-1">سناریو</p>
            <p className="font-medium text-sm text-lime-600 dark:text-lime-400">{game.scenario?.name}</p>
          </div>
          <Link href="/dashboard/moderator" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm">
            بازگشت
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {game.players?.map((player: any, index: number) => (
          <div key={player.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 relative overflow-hidden group">
            
            {/* Background alignment glow */}
            <div className={`absolute top-0 left-0 w-full h-1 opacity-50 ${
              player.role?.alignment === 'CITIZEN' ? 'bg-blue-500' : 
              player.role?.alignment === 'MAFIA' ? 'bg-red-500' : 
              'bg-amber-500'
            }`}></div>

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-lg">{player.name}</p>
                  <p className="text-xs text-zinc-400">بازیکن</p>
                </div>
              </div>
            </div>

            <div className={`mt-2 p-3 rounded-xl border ${
              player.role?.alignment === 'CITIZEN' ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-600 dark:text-blue-400' : 
              player.role?.alignment === 'MAFIA' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-600 dark:text-red-400' : 
              'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{player.role?.name || "بدون نقش"}</span>
                <span className="text-xs opacity-80 px-2 py-0.5 rounded-md bg-white/20 dark:bg-black/20">
                  {player.role?.alignment === 'CITIZEN' ? 'شهروند' : 
                   player.role?.alignment === 'MAFIA' ? 'مافیا' : 'مستقل'}
                </span>
              </div>
              <p className="text-xs opacity-70 line-clamp-2">{player.role?.description}</p>
            </div>
            
            {/* Action buttons (for future implementation like Kill, etc) */}
            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="flex-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">
                 حذف از بازی
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-700/50 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">stop_circle</span>
          <h3 className="font-bold text-lg">پایان بازی</h3>
        </div>
        <p className="text-sm text-zinc-500">برای پایان بازی، یکی از گروه‌های برنده را انتخاب کنید. نتیجه بازی در پروفایل بازیکنان ثبت خواهد شد.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <button 
            onClick={() => {
              showConfirm("پایان بازی", "آیا مطمئن هستید که شهروندان پیروز شده‌اند؟", async () => {
                const { endGame } = await import('@/actions/game');
                await endGame(gameId, 'CITIZEN');
                showToast("بازی با پیروزی شهروندان به پایان رسید", "success");
                router.refresh();
                router.push("/dashboard/moderator");
              });
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:translate-y-1">
            پیروزی شهروندان
          </button>
          <button 
            onClick={() => {
              showConfirm("پایان بازی", "آیا مطمئن هستید که مافیا پیروز شده‌است؟", async () => {
                const { endGame } = await import('@/actions/game');
                await endGame(gameId, 'MAFIA');
                showToast("بازی با پیروزی مافیا به پایان رسید", "success");
                router.refresh();
                router.push("/dashboard/moderator");
              }, "error");
            }}
            className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:translate-y-1">
            پیروزی مافیا
          </button>
          <button 
            onClick={() => {
              showConfirm("پایان بازی", "آیا مطمئن هستید که مستقل‌ها پیروز شده‌اند؟", async () => {
                const { endGame } = await import('@/actions/game');
                await endGame(gameId, 'NEUTRAL');
                showToast("بازی با پیروزی مستقل‌ها به پایان رسید", "success");
                router.refresh();
                router.push("/dashboard/moderator");
              });
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:translate-y-1">
            پیروزی مستقل‌ها
          </button>
        </div>
      </div>
    </div>
  );
}