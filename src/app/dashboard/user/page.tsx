"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { getUserStats } from "@/actions/dashboard";
import { getWaitingGames } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher";
import Link from "next/link";

export default function UserDashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{
    statsData: any[];
    roleHistory: any[];
    recentGames: any[];
    currentActiveGame?: any;
  } | null>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    refreshData();

    // Pusher for real-time lobby updates
    const pusher = getPusherClient();
    const channel = pusher.subscribe('lobby');
    channel.bind('game-created', () => {
      refreshActiveGames();
    });

    return () => {
      pusher.unsubscribe('lobby');
    };
  }, []);

  const refreshData = async () => {
    getUserStats().then(res => {
      if (res) setData(res);
    });
    refreshActiveGames();
  };

  const refreshActiveGames = async () => {
    const games = await getWaitingGames(Date.now());
    setActiveGames(games);
  };

  if (!mounted) return <div className="p-8 text-center animate-pulse">در حال بارگذاری...</div>;

  const statsData = data?.statsData || [
    { name: 'پیروزی‌ها', value: 0, color: '#84cc16' },
    { name: 'شکست‌ها', value: 0, color: '#ef4444' }
  ];

  const roleHistory = data?.roleHistory || [];
  const recentGames = data?.recentGames || [];

  return (
    <div className="flex flex-col gap-10 font-sans">
      {/* Header Profile Section */}
      <section className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-10 border border-[#0f172a]/10 dark:border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-lime-500/5 blur-[120px] pointer-events-none rounded-full rotate-12"></div>
        
        <div className="relative">
          <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-lime-400 to-emerald-600 shadow-2xl shadow-lime-500/20 group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-4 border-zinc-950">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-zinc-700 bg-gradient-to-br from-zinc-400 to-zinc-600 bg-clip-text text-transparent">person_filled</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-lime-500 rounded-full border-4 border-zinc-950 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-zinc-950 text-xl font-black">verified</span>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start z-10 gap-3">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{session?.user?.name || "کاربر مهمان"}</h2>
            <p className="text-slate-500 dark:text-zinc-500 font-medium tracking-tight mt-1">{session?.user?.email || "نامشخص"}</p>
          </div>
          
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-[#0f172a]/5 dark:bg-white/5 border border-[#0f172a]/20 dark:border-white/10 text-lime-600 dark:text-lime-400 text-xs font-black uppercase tracking-widest rounded-xl backdrop-blur-md">
              {session?.user?.role === 'ADMIN' ? 'مدیر سیستم' : session?.user?.role === 'MODERATOR' ? 'گرداننده رسمی' : 'بازیکن فعال'}
            </div>
            <Link href="/dashboard/user/profile" className="px-4 py-2 bg-gray-200 dark:bg-zinc-900 border border-[#0f172a]/10 dark:border-white/5 text-slate-700 dark:text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-zinc-950 transition-all flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined text-sm">edit</span>
              ویرایش پروفایل
            </Link>
          </div>
        </div>
      </section>

      {/* Active Games / Lobby */}
      <section className="bg-gray-200 dark:bg-zinc-900/40 rounded-[2.5rem] border border-lime-500/20 shadow-[0_0_50px_rgba(132,204,22,0.05)] overflow-hidden flex flex-col backdrop-blur-3xl">
        <div className="p-8 border-b border-[#0f172a]/10 dark:border-white/5 flex justify-between items-center bg-[#0f172a]/5 dark:bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-lime-500 font-black">sensors</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-black text-slate-900 dark:text-white italic text-lg tracking-tight">بازی‌های در انتظار فراخوان</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500">لابی‌های فعال که منتظر حضور شما هستند</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-3 py-1.5 bg-lime-500 text-zinc-950 rounded-full font-black uppercase tracking-widest shadow-[0_0_20px_rgba(132,204,22,0.4)] animate-pulse">Live</span>
          </div>
        </div>
        
        <div className="p-8">
          {data?.currentActiveGame && (
            <div className="mb-10">
               <Link 
                  href={`/game/${data.currentActiveGame.id}`}
                  className="group relative overflow-hidden rounded-3xl p-[1px] w-full block shadow-2xl"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-emerald-500 to-blue-500 rounded-3xl opacity-100 group-hover:scale-105 transition-transform duration-1000"></span>
                  <div className="relative flex items-center justify-between bg-white dark:bg-zinc-950 px-8 py-6 rounded-[23px] transition-all group-hover:bg-transparent duration-500">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-white dark:bg-zinc-950 transition-colors">
                        <span className="material-symbols-outlined text-lime-600 dark:text-lime-400 group-hover:text-slate-900 dark:text-white transition-colors text-3xl font-black animate-bounce">rocket_launch</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-black text-xl tracking-tighter italic group-hover:text-zinc-950 transition-colors">
                          شما در یک بازی فعال حضور دارید
                        </span>
                        <span className="text-sm text-slate-500 dark:text-zinc-500 group-hover:text-zinc-950/70 transition-colors mt-1 font-bold">سناریو: {data.currentActiveGame.scenarioName} • توسط {data.currentActiveGame.moderatorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-lime-500 text-zinc-950 px-5 py-2.5 rounded-2xl font-black text-sm group-hover:bg-white dark:bg-zinc-950 group-hover:text-slate-900 dark:text-white transition-all shadow-xl">
                      <span>بازگشت به میدان</span>
                      <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-1 transition-transform">bolt</span>
                    </div>
                  </div>
               </Link>
               {activeGames.length > 0 && <div className="h-px bg-[#0f172a]/5 dark:bg-white/5 my-10" />}
            </div>
          )}

          {activeGames.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-6 opacity-40">
              <div className="w-20 h-20 rounded-full bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center border border-[#0f172a]/10 dark:border-white/5">
                <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600">radar</span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-lg font-black text-slate-600 dark:text-zinc-400 italic">سیگنالی دریافت نشد</p>
                <p className="text-xs text-slate-400 dark:text-zinc-600">در حال حاضر هیچ لابی فعالی در شبکه یافت نشد</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeGames.map((game) => (
                <Link 
                  key={game.id} 
                  href={`/lobby/${game.id}`}
                  className="group p-8 rounded-[2rem] border border-[#0f172a]/10 dark:border-white/5 bg-white dark:bg-zinc-950 hover:border-lime-500/40 hover:shadow-2xl hover:shadow-lime-500/5 transition-all flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-lime-500/5 blur-[40px] pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter italic group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{game.scenario?.name || "بازی ناگهانی"}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>
                        {game.moderator?.name || "گرداننده"}
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-zinc-900 border border-[#0f172a]/10 dark:border-white/5 text-lime-600 dark:text-lime-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-inner">
                      {game.scenario?.roles.reduce((a:any, b:any) => a + b.count, 0)} P
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 relative z-10">
                    <div className="flex -space-x-3 rtl:space-x-reverse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center ring-1 ring-white/5">
                          <span className="material-symbols-outlined text-sm text-slate-500 dark:text-zinc-500">person</span>
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-lime-500 flex items-center justify-center text-xs font-black text-zinc-950 shadow-lg ring-1 ring-white/10">
                        +
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {game.status === 'IN_PROGRESS' && (
                        <span className="text-[9px] px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg font-black uppercase tracking-tighter">در حال بازی</span>
                      )}
                      <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-all">
                        <span className="text-xs font-black uppercase tracking-widest">{game.status === 'IN_PROGRESS' ? 'View' : 'Join'}</span>
                        <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Win/Loss Pie Chart */}
        <section className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-10 border border-[#0f172a]/10 dark:border-white/5 shadow-2xl flex flex-col gap-8 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 font-black">pie_chart</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white italic text-lg tracking-tight">تحلیل عملکرد بازی‌ها</h3>
          </div>
          
          <div className="h-72 w-full">
            {statsData[0].value === 0 && statsData[1].value === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 gap-4">
                 <span className="material-symbols-outlined text-5xl opacity-20">analytics</span>
                 <p className="text-sm font-medium italic">داده‌ای برای تحلیل بازی‌ها موجود نیست</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: 'Vazirmatn' }} 
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    formatter={(value) => <span className="text-slate-600 dark:text-zinc-400 font-bold text-xs px-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Roles History Bar Chart */}
        <section className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-10 border border-[#0f172a]/10 dark:border-white/5 shadow-2xl flex flex-col gap-8 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-lime-500 font-black">bar_chart</span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white italic text-lg tracking-tight">فراوانی نقش‌های دریافتی</h3>
          </div>
          
          <div className="h-72 w-full" dir="ltr">
            {roleHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 gap-4">
                 <span className="material-symbols-outlined text-5xl opacity-20">troubleshoot</span>
                 <p className="text-sm font-medium italic">هنوز نقشی به شما اختصاص نیافته است</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="role" tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900, fontFamily: 'Vazirmatn' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: 'Vazirmatn' }}
                  />
                  <Bar dataKey="count" fill="#84cc16" radius={[10, 10, 0, 0]} barSize={40}>
                     {roleHistory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#84cc16' : '#65a30d'} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* Recent Games List */}
      <section className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-[#0f172a]/10 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-[#0f172a]/10 dark:border-white/5 flex justify-between items-center bg-[#0f172a]/5 dark:bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-[#0f172a]/10 dark:border-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600 dark:text-zinc-400 font-black">history</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-black text-slate-900 dark:text-white italic text-lg tracking-tight">گزارش بازی‌های پیشین</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500">تاریخچه آخرین فعالیت‌های شما در بازی</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-[#0f172a]/5 dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-[#0f172a]/10 dark:border-white/5">مشاهده بایگانی</button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentGames.length === 0 ? (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-6 opacity-40">
                <div className="w-20 h-20 rounded-full bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center border border-[#0f172a]/10 dark:border-white/5">
                  <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600">history_toggle_off</span>
                </div>
                <p className="text-sm font-black text-slate-500 dark:text-zinc-500 italic">هنوز در هیچ بازی شرکت نکرده‌اید</p>
              </div>
            ) : (
              recentGames.map((game: any) => (
                <div 
                  key={game.id} 
                  onClick={() => setSelectedHistoryGame(game)}
                  className="p-6 rounded-3xl border border-[#0f172a]/10 dark:border-white/5 bg-gray-200 dark:bg-zinc-900/50 hover:bg-zinc-800/80 transition-all cursor-pointer group flex items-center justify-between relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${game.result === 'WIN' ? 'bg-lime-500' : 'bg-red-500'}`}></div>
                  
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${game.result === 'WIN' ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400 group-hover:scale-110 shadow-[0_0_20px_rgba(132,204,22,0.1)]' : 'bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-110 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}>
                      <span className="material-symbols-outlined text-2xl font-black">{game.result === 'WIN' ? 'emoji_events' : 'close'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-black text-slate-900 dark:text-white text-base tracking-tighter group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{game.scenarioName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        {game.roleName} <span className="w-1 h-1 bg-zinc-800 rounded-full"></span> {game.date}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${game.result === 'WIN' ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                      {game.result === 'WIN' ? 'Victory' : 'Defeat'}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 dark:text-zinc-600 group-hover:translate-x-[-5px] transition-transform">arrow_back</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Game History Details Modal */}
      {selectedHistoryGame && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-gray-200 dark:bg-zinc-900 rounded-[3rem] w-full max-w-2xl p-10 border border-[#0f172a]/20 dark:border-white/10 shadow-3xl flex flex-col gap-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-500 relative">
             <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-lime-500/5 blur-[100px] rounded-full"></div>
             
             <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic flex items-center gap-3">
                     <span className="material-symbols-outlined text-lime-500 text-3xl font-black">receipt_long</span>
                     خلاصه گزارش عملیات
                   </h3>
                   <p className="text-slate-500 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">{selectedHistoryGame.date}</p>
                </div>
                <button onClick={() => setSelectedHistoryGame(null)} className="w-12 h-12 rounded-full bg-[#0f172a]/5 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:text-white hover:bg-red-500/20 transition-all group">
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-[#0f172a]/10 dark:border-white/5 flex flex-col gap-1 shadow-inner">
                   <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-widest">میدان بازی</p>
                   <p className="font-black text-xl text-slate-900 dark:text-white tracking-tighter">{selectedHistoryGame.scenarioName}</p>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-[#0f172a]/10 dark:border-white/5 flex flex-col gap-1 shadow-inner">
                   <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-widest">فرمانده (گرداننده)</p>
                   <p className="font-black text-xl text-slate-900 dark:text-white tracking-tighter">{selectedHistoryGame.moderatorName}</p>
                </div>
                
                <div className={`col-span-1 md:col-span-2 p-8 rounded-[2rem] border-2 flex items-center justify-between shadow-2xl ${
                  selectedHistoryGame.result === 'WIN' 
                    ? 'bg-lime-500/5 border-lime-500/20 shadow-lime-500/5' 
                    : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'
                }`}>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest">هویت شما در بازی</p>
                    <p className={`font-black text-3xl tracking-tighter italic ${selectedHistoryGame.result === 'WIN' ? 'text-lime-600 dark:text-lime-400' : 'text-red-600 dark:text-red-400'}`}>
                      {selectedHistoryGame.roleName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${selectedHistoryGame.result === 'WIN' ? 'bg-lime-500 text-zinc-950 shadow-lime-500/20' : 'bg-red-500 text-slate-900 dark:text-white shadow-red-500/20'}`}>
                         {selectedHistoryGame.result === 'WIN' ? 'Winner' : 'Defeated'}
                       </span>
                    </div>
                  </div>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-zinc-950 shadow-2xl ${selectedHistoryGame.result === 'WIN' ? 'bg-lime-500 shadow-lime-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                    <span className="material-symbols-outlined text-5xl font-black text-zinc-950">
                      {selectedHistoryGame.result === 'WIN' ? 'emoji_events' : 'warning'}
                    </span>
                  </div>
                </div>
             </div>

             <div className="relative z-10">
                <h4 className="font-black text-slate-600 dark:text-zinc-400 mb-6 text-sm flex items-center gap-3 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lime-500 font-black">group</span>
                  ترکیب بازیکنان عملیات ({selectedHistoryGame.players?.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-3 custom-scrollbar p-1">
                  {selectedHistoryGame.players?.map((player: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-[#0f172a]/10 dark:border-white/5 hover:border-[#0f172a]/20 dark:border-white/10 transition-all group">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{player.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest">{player.roleName}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                        player.alignment === 'CITIZEN' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                        player.alignment === 'MAFIA' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {player.alignment}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );}

