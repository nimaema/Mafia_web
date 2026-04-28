import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallPWANotice } from "@/components/InstallPWANotice";


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
    <div className="app-page min-h-screen pb-28 md:pb-0 md:flex md:items-start" dir="rtl">
      <aside className="sticky top-0 z-20 hidden h-screen w-72 shrink-0 flex-col border-l border-zinc-200 bg-white/85 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/85 dark:shadow-black/20 md:flex">
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
          <div className="ui-icon-accent size-12">
            <span className="material-symbols-outlined text-2xl font-black">theater_comedy</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">مافیا بورد</h1>
            <span className="ui-kicker">دستیار مدیریت بازی</span>
          </div>
          </div>
        </div>
        
        <nav className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto">
          <Link href="/dashboard/user" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
            <span>داشبورد</span>
          </Link>

          <Link href="/dashboard/user/profile" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            <span className="material-symbols-outlined">person</span>
            <span>پروفایل من</span>
          </Link>

          <Link href="/dashboard/user/history" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
            <span className="material-symbols-outlined">history</span>
            <span>تاریخچه بازی‌ها</span>
          </Link>

          {isModerator && (
            <>
              <div className="my-4 h-px bg-zinc-200 dark:bg-white/10"></div>
              <p className="px-4 pb-2 text-xs font-black text-zinc-400">گردانندگی</p>
              <Link href="/dashboard/moderator" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-lime-500/10 hover:text-lime-700 dark:text-zinc-400 dark:hover:text-lime-300">
                <span className="material-symbols-outlined">sports_esports</span>
                <span>لابی بازی‌ها</span>
              </Link>
              <Link href="/dashboard/admin?tab=scenarios" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-lime-500/10 hover:text-lime-700 dark:text-zinc-400 dark:hover:text-lime-300">
                <span className="material-symbols-outlined">account_tree</span>
                <span>سناریوها</span>
              </Link>
              <Link href="/dashboard/admin?tab=roles" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-lime-500/10 hover:text-lime-700 dark:text-zinc-400 dark:hover:text-lime-300">
                <span className="material-symbols-outlined">theater_comedy</span>
                <span>نقش‌ها</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <div className="my-4 h-px bg-zinc-200 dark:bg-white/10"></div>
              <p className="px-4 pb-2 text-xs font-black text-zinc-400">مدیریت کل</p>
              <Link href="/dashboard/admin/users" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-zinc-400 dark:hover:text-sky-300">
                <span className="material-symbols-outlined">group</span>
                <span>کاربران سیستم</span>
              </Link>
              <Link href="/dashboard/admin/history" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-sky-500/10 hover:text-sky-700 dark:text-zinc-400 dark:hover:text-sky-300">
                <span className="material-symbols-outlined">manage_history</span>
                <span>تاریخچه کل</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-white/10">
          <ThemeToggle />
          <form action={handleLogout} className="w-full">
            <button 
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>خروج از سیستم</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="relative z-10 w-full flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-50 flex h-[4.5rem] items-stretch gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white/90 px-2 py-2 shadow-lg shadow-zinc-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 md:hidden">
        <Link href="/dashboard/user" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400">
          <span className="material-symbols-outlined text-2xl">dashboard</span>
          <span className="text-[10px] font-black">داشبورد</span>
        </Link>
        {isModerator && (
          <>
            <Link href="/dashboard/moderator" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400">
              <span className="material-symbols-outlined text-2xl">sports_esports</span>
              <span className="text-[10px] font-black">بازی‌ها</span>
            </Link>
            <Link href="/dashboard/admin?tab=scenarios" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
              <span className="text-[10px] font-black">سناریو</span>
            </Link>
            <Link href="/dashboard/admin?tab=roles" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400">
              <span className="material-symbols-outlined text-2xl">theater_comedy</span>
              <span className="text-[10px] font-black">نقش‌ها</span>
            </Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link href="/dashboard/admin/users" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              <span className="text-[10px] font-black">کاربران</span>
            </Link>
            <Link href="/dashboard/admin/history" className="flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-zinc-500 transition-colors hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400">
              <span className="material-symbols-outlined text-2xl">manage_history</span>
              <span className="text-[10px] font-black">تاریخچه</span>
            </Link>
          </>
        )}
        <ThemeToggle nav />
        <form action={handleLogout} className="min-w-16 flex-1">
          <button 
            type="submit"
            className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
            <span className="text-[10px] font-black">خروج</span>
          </button>
        </form>
      </nav>
      <InstallPWANotice />
    </div>
  );
}
