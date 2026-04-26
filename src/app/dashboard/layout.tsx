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
    <div className="bg-gray-300 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 min-h-screen pb-20 md:pb-0 flex flex-col md:flex-row transition-all duration-500 overflow-hidden" dir="rtl">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-500/5 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse-slow" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="relative z-10 hidden md:flex flex-col w-80 bg-[#ffffffcc] dark:bg-black/40 backdrop-blur-3xl border-l border-[#0f172a]/10 dark:border-white/5 h-screen p-8 sticky top-0 transition-all duration-300 shadow-2xl">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-lime-600 rounded-2xl flex items-center justify-center shadow-xl shadow-lime-500/20 rotate-3">
            <span className="material-symbols-outlined text-zinc-950 text-3xl font-black">theater_comedy</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">مافیا بورد</h1>
            <span className="text-[10px] uppercase tracking-widest text-lime-600 dark:text-lime-400 font-bold">Premium Companion</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
          <Link href="/dashboard/user" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">person</span>
            <span className="font-bold text-sm tracking-wide">پروفایل من</span>
          </Link>

          <Link href="/dashboard/user/history" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">history</span>
            <span className="font-bold text-sm tracking-wide">تاریخچه بازی‌ها</span>
          </Link>

          {isModerator && (
            <>
              <div className="h-px bg-white/5 my-4 mx-4"></div>
              <p className="text-[10px] text-zinc-500 px-5 font-black uppercase tracking-widest mb-2">گردانندگی</p>
              <Link href="/dashboard/moderator" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-lime-600 dark:hover:text-lime-400 group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">sports_esports</span>
                <span className="font-bold text-sm tracking-wide">لابی بازی‌ها</span>
              </Link>
              <Link href="/dashboard/admin?tab=scenarios" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-600 dark:text-emerald-400 group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">account_tree</span>
                <span className="font-bold text-sm tracking-wide">سناریوها</span>
              </Link>
              <Link href="/dashboard/admin?tab=roles" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-600 dark:text-teal-400 group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">theater_comedy</span>
                <span className="font-bold text-sm tracking-wide">نقش‌ها</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <div className="h-px bg-white/5 my-4 mx-4"></div>
              <p className="text-[10px] text-zinc-500 px-5 font-black uppercase tracking-widest mb-2">مدیریت کل</p>
              <Link href="/dashboard/admin?tab=users" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-600 dark:text-blue-400 group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">group</span>
                <span className="font-bold text-sm tracking-wide">کاربران</span>
              </Link>
              <Link href="/dashboard/admin" className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-[#0f172a] dark:hover:text-white group">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
                <span className="font-bold text-sm tracking-wide">تنظیمات سیستم</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto pt-8 flex flex-col gap-4 border-t border-black/10 dark:border-white/5">
          <ThemeToggle />
          <form action={handleLogout} className="w-full">
            <button 
              type="submit"
              className="flex items-center gap-3 px-5 py-4 rounded-2xl text-red-600 dark:text-red-400/80 hover:text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-all duration-300 w-full group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">logout</span>
              <span className="font-black text-sm tracking-widest uppercase">خروج از سیستم</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full p-4 md:p-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#ffffffcc] dark:bg-zinc-950/80 backdrop-blur-3xl border border-[#0f172a]/10 dark:border-white/10 flex justify-around items-center h-20 z-50 rounded-[2rem] px-4 shadow-[0_20px_50px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
        <Link href="/dashboard/user" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 hover:text-white">
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">پروفایل</span>
        </Link>
        {isModerator && (
          <>
            <Link href="/dashboard/moderator" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 hover:text-lime-400">
              <span className="material-symbols-outlined text-2xl">sports_esports</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">بازی‌ها</span>
            </Link>
            <Link href="/dashboard/admin?tab=roles" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 hover:text-teal-600 dark:text-teal-400">
              <span className="material-symbols-outlined text-2xl">theater_comedy</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">نقش‌ها</span>
            </Link>
          </>
        )}
        {isAdmin && (
          <Link href="/dashboard/admin" className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-zinc-500 hover:text-white">
            <span className="material-symbols-outlined text-2xl">settings</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">تنظیمات</span>
          </Link>
        )}
        <form action={handleLogout} className="flex-1 h-full">
          <button 
            type="submit"
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-red-600 dark:text-red-400/60 hover:text-red-600 dark:text-red-400"
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">خروج</span>
          </button>
        </form>
      </nav>
    </div>
  );
}
