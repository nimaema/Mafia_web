"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGame, getModeratorGames } from "@/actions/game";
import { getScenarios } from "@/actions/admin";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getScenarios().then(setScenarios);
    refreshGames();
  }, []);

  const refreshGames = async () => {
    const games = await getModeratorGames();
    setActiveGames(games);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const res = await createGame();
      if (res.success) {
        router.push(`/dashboard/moderator/lobby/${res.gameId}`);
      } else {
        alert(res.error || "خطا در ایجاد بازی");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-lime-500 text-3xl">sports_esports</span>
          مدیریت بازی‌ها
        </h2>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-lime-500 text-zinc-950 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-lime-600 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>بازی جدید</span>
        </button>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">ایجاد بازی جدید</h3>
                <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-zinc-400 hover:text-red-500">close</button>
             </div>

             <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-400">یک لابی جدید ایجاد کنید. بازیکنان می‌توانند به لابی متصل شوند و پس از آن می‌توانید سناریو را تنظیم کنید.</p>
                <button 
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="bg-lime-500 text-zinc-950 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">play_circle</span>
                  )}
                  <span>ایجاد و شروع لابی</span>
                </button>
             </div>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">بازی‌های فعال شما</h3>
          <button onClick={refreshGames} className="text-zinc-400 hover:text-lime-500 transition-colors">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 p-4">
          {activeGames.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600">videogame_asset_off</span>
              </div>
              <p className="text-sm">شما در حال حاضر هیچ بازی فعالی ندارید.</p>
              <button onClick={() => setShowCreateModal(true)} className="bg-zinc-100 dark:bg-zinc-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-lime-500 hover:text-white transition-all">ایجاد اولین بازی</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGames.map((game) => (
                <div 
                  key={game.id}
                  className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 hover:border-lime-500/50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">بازی {game.id.slice(0, 6)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          game.status === 'WAITING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400'
                        }`}>
                          {game.status === 'WAITING' ? 'در انتظار بازیکن' : 'در جریان'}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm text-zinc-500">
                        <span>سناریو: {game.scenario?.name || 'انتخاب نشده'}</span>
                        <span className="text-xs opacity-70">گرداننده: {game.moderator?.name || 'ناشناس'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <span className="material-symbols-outlined text-sm">group</span>
                      <span className="text-sm font-medium">{game._count.players} / {game.scenario?.roles.reduce((a:any, b:any) => a + b.count, 0) || '?'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      href={game.status === 'WAITING' ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`}
                      className="flex-1 bg-lime-500 text-zinc-950 py-2 rounded-xl text-center font-bold text-sm hover:bg-lime-600 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">login</span>
                      <span>ورود به بازی</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
