"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pb-20 md:pb-0 flex flex-col md:flex-row">
      {/* Desktop Sidebar (Right side for RTL) */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 min-h-screen p-6 sticky top-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
            <span className="material-symbols-outlined text-zinc-950 text-2xl font-bold">admin_panel_settings</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">مدیریت مافیا</h1>
        </div>
        
        <nav className="flex flex-col gap-3 flex-grow">
          <Link href="/dashboard/user" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname === "/dashboard/user" ? "bg-lime-500 text-zinc-950 font-bold shadow-md shadow-lime-500/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
            <span className="material-symbols-outlined">person</span>
            <span>پروفایل من</span>
          </Link>
          <Link href="/dashboard/moderator" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname.includes("/dashboard/moderator") ? "bg-lime-500 text-zinc-950 font-bold shadow-md shadow-lime-500/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
            <span className="material-symbols-outlined">sports_esports</span>
            <span>مدیریت بازی</span>
          </Link>
          <Link href="/dashboard/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${pathname.includes("/dashboard/admin") ? "bg-lime-500 text-zinc-950 font-bold shadow-md shadow-lime-500/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
            <span className="material-symbols-outlined">settings</span>
            <span>تنظیمات مدیر</span>
          </Link>
        </nav>

        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-6"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-bold">خروج از حساب</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 md:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center h-20 z-50 px-4 safe-area-pb shadow-2xl">
        <Link href="/dashboard/user" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${pathname === "/dashboard/user" ? "text-lime-500" : "text-zinc-400"}`}>
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-bold">پروفایل</span>
        </Link>
        <Link href="/dashboard/moderator" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${pathname.includes("/dashboard/moderator") ? "text-lime-500" : "text-zinc-400"}`}>
          <span className="material-symbols-outlined text-2xl">sports_esports</span>
          <span className="text-[10px] font-bold">بازی</span>
        </Link>
        <Link href="/dashboard/admin" className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${pathname.includes("/dashboard/admin") ? "text-lime-500" : "text-zinc-400"}`}>
          <span className="material-symbols-outlined text-2xl">settings</span>
          <span className="text-[10px] font-bold">مدیریت</span>
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-red-500/60"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <span className="text-[10px] font-bold">خروج</span>
        </button>
      </nav>
    </div>
  );
}
