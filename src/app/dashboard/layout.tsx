import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const isAdmin = session.user?.role === "ADMIN";
  const isModerator = session.user?.role === "MODERATOR" || isAdmin;

  // Simple server-side logout action
  const handleLogout = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pb-20 md:pb-0 flex flex-col md:flex-row transition-colors duration-300">
      {/* Desktop Sidebar (Right side for RTL) */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 min-h-screen p-6 sticky top-0 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-12 h-12 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
            <span className="material-symbols-outlined text-zinc-950 text-3xl font-bold">admin_panel_settings</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-blue-600 dark:text-zinc-100">مدیریت مافیا</h1>
        </div>
        
        <nav className="flex flex-col gap-3 flex-grow">
          <Link href="/dashboard/user" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
            <span className="material-symbols-outlined">person</span>
            <span className="font-medium">پروفایل من</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
            <span className="material-symbols-outlined">history</span>
            <span className="font-medium">تاریخچه بازی‌ها</span>
          </Link>

          {isModerator && (
            <>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>
              <p className="text-xs text-zinc-400 px-4 font-bold mb-1">پنل گرداننده</p>
              <Link href="/dashboard/moderator" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
                <span className="material-symbols-outlined">sports_esports</span>
                <span className="font-medium">بازی جدید / در جریان</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
                <span className="material-symbols-outlined">list_alt</span>
                <span className="font-medium">مدیریت سناریوها</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>
              <p className="text-xs text-zinc-400 px-4 font-bold mb-1">پنل ادمین</p>
              <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
                <span className="material-symbols-outlined">settings</span>
                <span className="font-medium">تنظیمات ادمین</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-lg hover:text-blue-600 dark:hover:text-lime-400">
                <span className="material-symbols-outlined">group</span>
                <span className="font-medium">مدیریت کاربران</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col gap-3">
          <ThemeToggle />

          <form action={handleLogout} className="w-full">
            <button 
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full text-lg"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-bold">خروج از حساب</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 md:p-10 overflow-x-hidden transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center h-20 z-50 px-2 safe-area-pb shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors duration-300">
        <Link href="/dashboard/user" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-lime-400">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-xs font-bold">پروفایل</span>
        </Link>
        {isModerator && (
          <Link href="/dashboard/moderator" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-lime-400">
            <span className="material-symbols-outlined text-2xl">sports_esports</span>
            <span className="text-xs font-bold">بازی</span>
          </Link>
        )}
        {isAdmin && (
          <Link href="/dashboard/admin" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-lime-400">
            <span className="material-symbols-outlined text-2xl">settings</span>
            <span className="text-xs font-bold">مدیریت</span>
          </Link>
        )}
        <form action={handleLogout} className="flex-1 h-full">
          <button 
            type="submit"
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-red-500/80 hover:text-red-600"
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
            <span className="text-xs font-bold">خروج</span>
          </button>
        </form>
      </nav>
    </div>
  );
}