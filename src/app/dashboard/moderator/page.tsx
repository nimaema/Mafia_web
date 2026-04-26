"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGame, getModeratorGames, cancelGame } from "@/actions/game";
import { getScenarios } from "@/actions/admin";

export default function ModeratorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    getScenarios().then(setScenarios);
    refreshGames();
  }, []);

  const refreshGames = async () => {
    const games = await getModeratorGames(Date.now());
    setActiveGames(games);
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const res = await createGame(name, password);
      if (res.success) {
        setShowCreateModal(false);
        setName("");
        setPassword("");
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

  const handleCancelGame = async (gameId: string) => {
    if (!confirm("آیا از لغو و حذف این لابی اطمینان دارید؟")) return;
    try {
      const res = await cancelGame(gameId);
      if (res.success) {
        refreshGames();
      } else {
        alert(res.error || "خطا در لغو بازی");
      }
    } catch (error) {
      console.error(error);
      alert("خطای شبکه");
    }
  };

  return (
    <div className="flex flex-col gap-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-lime-400 to-emerald-600 p-[2px] shadow-2xl shadow-lime-500/20">
             <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[22px] flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl bg-gradient-to-br from-lime-400 to-emerald-500 bg-clip-text text-transparent">sports_esports</span>
             </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">مدیریت بازی‌ها</h2>
            <p className="text-slate-500 dark:text-zinc-500 font-medium">ایجاد لابی و مدیریت جریان بازی‌های در حال اجرا</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-lime-500 text-zinc-950 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-lime-400 transition-all shadow-[0_0_30px_rgba(132,204,22,0.2)] hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>ایجاد لابی جدید</span>
        </button>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg p-10 border border-[#0f172a]/20 dark:border-white/10 shadow-3xl flex flex-col gap-8 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
             <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-lime-500/10 blur-[80px] rounded-full"></div>
             
             <div className="flex justify-between items-center relative z-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic">ایجاد بازی جدید</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-red-600 dark:text-red-400 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <div className="flex flex-col gap-6 relative z-10">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 flex flex-col gap-3">
                  <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-sm">شما در حال ایجاد یک لابی متمرکز هستید. پس از ایجاد، یک کد منحصر به فرد به بازی اختصاص می‌یابد که بازیکنان با استفاده از آن می‌توانند وارد شوند.</p>
                  <ul className="text-xs text-slate-500 dark:text-zinc-500 flex flex-col gap-2 mt-2">
                    <li className="flex items-center gap-2 italic"><span className="w-1.5 h-1.5 bg-lime-500 rounded-full"></span>انتخاب سناریو در داخل لابی</li>
                    <li className="flex items-center gap-2 italic"><span className="w-1.5 h-1.5 bg-lime-500 rounded-full"></span>توزیع نقش هوشمند</li>
                    <li className="flex items-center gap-2 italic"><span className="w-1.5 h-1.5 bg-lime-500 rounded-full"></span>مدیریت وضعیت‌های شب و روز</li>
                  </ul>
                </div>
                
                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-sm text-slate-600 dark:text-zinc-400 font-bold px-1">نام لابی (اختیاری)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلا: مافیای جمعه شب"
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-sm text-slate-600 dark:text-zinc-400 font-bold px-1">رمز عبور اختصاصی (اختیاری)</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="در صورت خالی بودن، ورود بدون رمز خواهد بود"
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-colors text-slate-900 dark:text-white"
                  />
                </div>
                
                <button 
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="bg-lime-500 text-zinc-950 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-lime-400 transition-all shadow-[0_0_40px_rgba(132,204,22,0.3)] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined font-black">bolt</span>
                  )}
                  <span>تولید کد و شروع لابی</span>
                </button>
             </div>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col backdrop-blur-md">
        <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-[#0f172a]/5 dark:bg-black/20">
          <div className="flex flex-col">
            <h3 className="font-black text-slate-900 dark:text-white italic text-lg tracking-tight">لیست بازی‌های فعال</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-500">مشاهده و مدیریت لابی‌های در جریان شما</p>
          </div>
          <button onClick={refreshGames} className="w-12 h-12 rounded-2xl bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all group">
            <span className="material-symbols-outlined transition-transform group-hover:rotate-180 duration-500">refresh</span>
          </button>
        </div>
        
        <div className="p-8">
          {activeGames.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-6 opacity-60">
              <div className="w-24 h-24 rounded-full bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5">
                <span className="material-symbols-outlined text-6xl text-zinc-700">videogame_asset_off</span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xl font-bold text-slate-500 dark:text-zinc-500">هیچ بازی در جریان نیست</p>
                <p className="text-sm text-slate-400 dark:text-zinc-600">برای شروع هیجان، اولین لابی خود را بسازید</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="px-8 py-3 bg-zinc-800 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-lime-500 hover:text-zinc-950 transition-all">ایجاد اولین بازی</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {activeGames.map((game) => (
                <div 
                  key={game.id}
                  className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] flex flex-col gap-6 hover:border-lime-500/30 transition-all group relative overflow-hidden shadow-lg"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/5 blur-[50px] pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter italic">{game.name}</span>
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">#{game.code}</span>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                          game.status === 'WAITING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                        }`}>
                          {game.status === 'WAITING' ? 'در انتظار' : 'در جریان'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">account_tree</span>
                          <span className="font-medium text-slate-600 dark:text-zinc-400">{game.scenario?.name || 'سناریو نامشخص'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span className="font-medium text-slate-600 dark:text-zinc-400">گرداننده: {game.moderator?.name || '---'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="material-symbols-outlined text-lime-500 text-lg">group</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{game._count.players}</span>
                          <span className="text-xs text-slate-400 dark:text-zinc-600">/ {game.scenario?.roles.reduce((a:any, b:any) => a + b.count, 0) || '?'}</span>
                       </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                  <div className="flex gap-4 relative z-10">
                    <button
                      onClick={() => handleCancelGame(game.id)}
                      className="flex-[0.3] bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-slate-900 dark:text-white py-4 rounded-2xl text-center font-black text-sm transition-all flex items-center justify-center border border-red-500/20 hover:border-red-500"
                      title="لغو لابی"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                    <Link 
                      href={game.status === 'WAITING' ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`}
                      className="flex-1 bg-[#0f172a]/5 dark:bg-white/5 hover:bg-lime-500 text-slate-900 dark:text-white hover:text-zinc-950 py-4 rounded-2xl text-center font-black text-sm transition-all flex items-center justify-center gap-3 group border border-slate-200 dark:border-white/5 hover:border-lime-500/50"
                    >
                      <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">login</span>
                      <span>ورود به مدیریت بازی</span>
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
