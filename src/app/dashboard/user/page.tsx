"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const statsData = [
  { name: 'پیروزی‌ها', value: 45, color: '#84cc16' }, // lime-500
  { name: 'شکست‌ها', value: 20, color: '#ef4444' }   // red-500
];

const roleHistory = [
  { role: 'شهروند ساده', count: 15 },
  { role: 'مافیا', count: 8 },
  { role: 'پزشک', count: 5 },
  { role: 'کارآگاه', count: 4 },
  { role: 'پدرخوانده', count: 3 },
];

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-8 text-center animate-pulse">در حال بارگذاری...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center relative z-10">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-zinc-400">person</span>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start z-10">
          <h2 className="text-2xl font-bold">{session?.user?.name || "کاربر مهمان"}</h2>
          <p className="text-zinc-500 text-sm mt-1">{session?.user?.email || "نامشخص"}</p>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-semibold rounded-full border border-lime-200 dark:border-lime-800">سطح: مبتدی</span>
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-700">امتیاز: ۱۲۵۰</span>
          </div>
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
          </div>
        </section>

        {/* Roles History Bar Chart */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lime-500">bar_chart</span>
            نقش‌های بازی شده
          </h3>
          <div className="h-64 w-full" dir="ltr">
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
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  <span className="material-symbols-outlined">{i % 2 === 0 ? 'emoji_events' : 'cancel'}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">بازی شماره {1042 - i}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">نقش: {i % 2 === 0 ? 'پزشک' : 'مافیا'} • ۲ روز پیش</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-400">chevron_left</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
