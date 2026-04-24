"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getScenarios().then(setScenarios);
  }, []);

  const handleCreateGame = async () => {
    if (!selectedScenarioId) return alert("لطفا یک سناریو انتخاب کنید");
    setLoading(true);
    try {
      const res = await createGame(selectedScenarioId);
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
                <h3 className="text-xl font-bold">تنظیمات بازی جدید</h3>
                <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-zinc-400 hover:text-red-500">close</button>
             </div>

             <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                   <label className="text-xs text-zinc-500">انتخاب سناریو</label>
                   <select 
                     value={selectedScenarioId}
                     onChange={(e) => setSelectedScenarioId(e.target.value)}
                     className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-lime-500"
                   >
                     <option value="">انتخاب کنید...</option>
                     {scenarios.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({s.roles.reduce((a:any, b:any) => a + b.count, 0)} نفره)</option>
                     ))}
                   </select>
                </div>

                <button 
                  onClick={handleCreateGame}
                  disabled={loading || !selectedScenarioId}
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
        </div>
        
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 p-4">
          <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600">videogame_asset_off</span>
            </div>
            <p className="text-sm">شما در حال حاضر هیچ بازی فعالی ندارید.</p>
            <button onClick={() => setShowCreateModal(true)} className="bg-zinc-100 dark:bg-zinc-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-lime-500 hover:text-white transition-all">ایجاد اولین بازی</button>
          </div>
        </div>
      </section>
    </div>
  );
}
