"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

export default function AdminSettingsDashboard() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-lime-500 text-3xl">settings</span>
          تنظیمات سیستم
        </h2>
      </div>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">ظاهر برنامه</h3>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تم برنامه</p>
              <p className="text-sm text-zinc-500">انتخاب حالت تاریک یا روشن</p>
            </div>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white text-lime-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <span className="material-symbols-outlined">light_mode</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-zinc-700 text-lime-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-100'}`}
              >
                <span className="material-symbols-outlined">dark_mode</span>
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'system' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              >
                <span className="material-symbols-outlined">settings_brightness</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">حساب کاربری</h3>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm text-zinc-500">نام</p>
            <p>{session?.user?.name || "نامشخص"}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm text-zinc-500">ایمیل</p>
            <p dir="ltr" className="text-right">{session?.user?.email || "نامشخص"}</p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center gap-2 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors w-full md:w-auto justify-center"
            >
              <span className="material-symbols-outlined">logout</span>
              {loading ? "در حال خروج..." : "خروج از حساب"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
