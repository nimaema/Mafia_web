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
  } | null>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);

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
    const games = await getWaitingGames();
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
    <div className="flex flex-col gap-6">
      {/* Header Profile Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center relative z-10 overflow-hidden">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-zinc-400">person</span>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start z-10">
          <h2 className="text-2xl font-bold">{session?.user?.name || "کاربر مهمان"}</h2>
          <p className="text-zinc-500 text-sm mt-1">{session?.user?.email || "نامشخص"}</p>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full border border-lime-200 dark:border-lime-800">
              نقش: {session?.user?.role === 'ADMIN' ? 'مدیر' : session?.user?.role === 'MODERATOR' ? 'گرداننده' : 'بازیکن'}
            </span>
            <Link href="/dashboard/user/profile" className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">edit</span>
              ویرایش پروفایل
            </Link>
          </div>
        </div>
      </section>

      {/* Active Games / Lobby */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-lime-500/20 dark:border-lime-500/10 shadow-xl shadow-lime-500/5 overflow-hidden flex flex-col">
        <div className="p-4 bg-lime-500/5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">sensors</span>
            بازی‌های در انتظار بازیکن
          </h3>
          <span className="text-[10px] px-2 py-1 bg-lime-500 text-zinc-950 rounded-full font-black animate-pulse">زنده</span>
        </div>
        <div className="p-4">
          {activeGames.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600">hourglass_empty</span>
              </div>
              <p className="text-sm text-zinc-500">در حال حاضر بازی فعالی وجود ندارد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGames.map((game) => (
                <Link 
                  key={game.id} 
                  href={`/lobby/${game.id}`}
                  className="group p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 hover:border-lime-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{game.scenario?.name || "سناریو نامشخص"}</span>
                      <span className="text-[10px] text-zinc-500">توسط {game.moderator?.name || "گرداننده"}</span>
                    </div>
                    <span className="bg-zinc-900 text-white text-[10px] px-2 py-1 rounded-lg">
                      {game.scenario?.roles.reduce((a:any, b:any) => a + b.count, 0)} نفره
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-zinc-400">person</span>
                        </div>
                      ))}
                      <div className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-lime-500 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                        +
                      </div>
                    </div>
                    <span className="text-xs font-bold text-lime-600 dark:text-lime-400 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                      ورود به لابی
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Pie Chart */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">pie_chart</span>
            آمار پیروزی‌ها
          </h3>
          <div className="h-64 w-full">
            {statsData[0].value === 0 && statsData[1].value === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm italic">داده‌ای برای نمایش وجود ندارد</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Vazirmatn' }} 
                    itemStyle={{ fontFamily: 'Vazirmatn' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '14px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Roles History Bar Chart */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">bar_chart</span>
            نقش‌های بازی شده
          </h3>
          <div className="h-64 w-full" dir="ltr">
            {roleHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm italic">داده‌ای برای نمایش وجود ندارد</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                  <XAxis dataKey="role" tick={{ fontSize: 12, fill: '#71717a', fontFamily: 'Vazirmatn' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Vazirmatn' }}
                  />
                  <Bar dataKey="count" fill="#84cc16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* Recent Games List */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">history</span>
            تاریخچه بازی‌ها
          </h3>
          <button className="text-sm text-lime-600 dark:text-lime-400 hover:underline">مشاهده همه</button>
        </div>
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {recentGames.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl opacity-20">history_toggle_off</span>
              <p className="text-sm">هنوز در هیچ بازی شرکت نکرده‌اید</p>
            </div>
          ) : (
            recentGames.map((game, i) => (
              <div key={game.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${game.result === 'WIN' ? 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined">{game.result === 'WIN' ? 'emoji_events' : 'cancel'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">بازی شماره {game.id.slice(-4)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{game.roleName} • {game.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${game.result === 'WIN' ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    {game.result === 'WIN' ? 'برد' : 'باخت'}
                  </span>
                  <span className="material-symbols-outlined text-zinc-400 text-lg">chevron_left</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
