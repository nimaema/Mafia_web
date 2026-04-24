"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-surface-dim text-on-surface min-h-screen pb-20 md:pb-0 md:flex">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 min-h-screen p-4">
        <div className="flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-lime-500 text-3xl">admin_panel_settings</span>
          <h1 className="text-xl font-bold">دستیار مافیا</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard/user" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === "/dashboard/user" ? "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            <span className="material-symbols-outlined">person</span>
            <span>پروفایل من</span>
          </Link>
          <Link href="/dashboard/moderator" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname.includes("/dashboard/moderator") ? "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            <span className="material-symbols-outlined">sports_esports</span>
            <span>مدیریت بازی</span>
          </Link>
          <Link href="/dashboard/admin" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname.includes("/dashboard/admin") ? "bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            <span className="material-symbols-outlined">settings</span>
            <span>تنظیمات</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center h-16 z-50 px-2 safe-area-pb">
        <Link href="/dashboard/user" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname === "/dashboard/user" ? "text-lime-600 dark:text-lime-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}>
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-medium">پروفایل</span>
        </Link>
        <Link href="/dashboard/moderator" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname.includes("/dashboard/moderator") ? "text-lime-600 dark:text-lime-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}>
          <span className="material-symbols-outlined text-2xl">sports_esports</span>
          <span className="text-[10px] font-medium">مدیریت بازی</span>
        </Link>
        <Link href="/dashboard/admin" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${pathname.includes("/dashboard/admin") ? "text-lime-600 dark:text-lime-400" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}>
          <span className="material-symbols-outlined text-2xl">settings</span>
          <span className="text-[10px] font-medium">تنظیمات</span>
        </Link>
      </nav>
    </div>
  );
}
