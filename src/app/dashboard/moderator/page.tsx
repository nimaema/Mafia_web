"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      // We would call a Server Action here to create a game
      // For now we'll simulate it
      setTimeout(() => {
        router.push("/dashboard/moderator/lobby/new-game-123");
      }, 1000);
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
          onClick={handleCreateGame}
          disabled={loading}
          className="bg-lime-500 text-zinc-950 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-lime-600 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">add_circle</span>
          )}
          <span>بازی جدید</span>
        </button>
      </div>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">بازی‌های فعال شما</h3>
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 p-4">
          <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">videogame_asset_off</span>
            <p>شما در حال حاضر هیچ بازی فعالی ندارید.</p>
            <button onClick={handleCreateGame} className="text-lime-600 dark:text-lime-400 font-medium hover:underline mt-2">ایجاد اولین بازی</button>
          </div>
        </div>
      </section>
    </div>
  );
}
