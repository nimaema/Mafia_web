import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallPWAButton } from "@/components/InstallPWAButton";

const roleLabel: Record<string, string> = {
  ADMIN: "مدیر",
  MODERATOR: "گرداننده",
  USER: "بازیکن",
};

function formatDates() {
  const now = new Date();
  return {
    fa: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "medium" }).format(now),
    en: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(now),
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const isAdmin = session.user?.role === "ADMIN";
  const isModerator = session.user?.role === "MODERATOR" || isAdmin;
  const dates = formatDates();

  const handleLogout = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  const navItems = [
    { href: "/dashboard/user", icon: "dashboard", label: "خانه", show: true },
    { href: "/dashboard/user/history", icon: "history", label: "تاریخچه", show: true },
    { href: "/dashboard/user/profile", icon: "person", label: "پروفایل", show: true },
    { href: "/dashboard/moderator", icon: "sports_esports", label: "گردانندگی", show: isModerator },
    { href: "/dashboard/admin?tab=scenarios", icon: "account_tree", label: "سناریو", show: isModerator },
    { href: "/dashboard/admin?tab=roles", icon: "theater_comedy", label: "نقش", show: isModerator },
    { href: "/dashboard/admin?tab=users", icon: "admin_panel_settings", label: "مدیریت", show: isAdmin },
  ].filter((item) => item.show);
  const mobileItems = [
    { href: "/dashboard/user", icon: "dashboard", label: "خانه", show: true },
    { href: "/dashboard/user/history", icon: "history", label: "تاریخچه", show: true },
    { href: "/dashboard/moderator", icon: "sports_esports", label: "بازی", show: isModerator },
    { href: isAdmin ? "/dashboard/admin?tab=users" : "/dashboard/admin?tab=roles", icon: isAdmin ? "admin_panel_settings" : "theater_comedy", label: isAdmin ? "مدیریت" : "نقش", show: isModerator || isAdmin },
  ].filter((item) => item.show).slice(0, 4);

  return (
    <div className="pm-app-bg min-h-screen text-zinc-100" dir="rtl">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <aside className="fixed bottom-5 right-5 top-5 z-40 hidden w-[88px] flex-col items-center justify-between rounded-[2rem] border border-white/10 bg-[#11191a]/80 p-3 shadow-2xl backdrop-blur-2xl md:flex">
        <Link href="/dashboard/user" className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(0,229,255,0.24)]">
          <span className="material-symbols-outlined text-[28px]">theater_comedy</span>
        </Link>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="group grid h-12 w-12 place-items-center rounded-2xl border border-white/5 bg-white/[0.03] text-zinc-400 transition-all hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <span className="material-symbols-outlined text-[22px] transition-transform group-hover:scale-110">{item.icon}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <ThemeToggle compact />
          <InstallPWAButton compact />
          <form action={handleLogout}>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200 transition-all hover:bg-rose-400/20" title="خروج">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </form>
        </div>
      </aside>

      <header className="fixed left-3 right-3 top-3 z-30 rounded-[1.75rem] border border-white/10 bg-[#11191a]/85 p-3 shadow-2xl backdrop-blur-2xl md:left-5 md:right-[120px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 md:hidden">
              <span className="material-symbols-outlined">theater_comedy</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-50">{session.user?.name || "بازیکن PlayMafia"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black text-zinc-400">
                <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2 py-0.5 text-violet-100">{roleLabel[session.user?.role || "USER"]}</span>
                <span className="hidden sm:inline">{dates.fa}</span>
                <span className="hidden text-cyan-100/70 sm:inline">{dates.en}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex">
              <InstallPWAButton compact />
            </div>
            <ThemeToggle compact />
            <form action={handleLogout} className="hidden md:block">
              <button className="grid h-10 w-10 place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200 transition-all hover:bg-rose-400/20" title="خروج">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-28 pt-24 md:pr-[120px] md:pl-5 md:pt-28">
        {children}
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-5 gap-1 rounded-[1.75rem] border border-white/10 bg-[#11191a]/90 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
        {mobileItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-zinc-400 transition-all hover:bg-cyan-300/10 hover:text-cyan-100">
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="max-w-full truncate text-[10px] font-black">{item.label}</span>
          </Link>
        ))}
        <form action={handleLogout}>
          <button className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-rose-200 transition-all hover:bg-rose-400/10">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-[10px] font-black">خروج</span>
          </button>
        </form>
      </nav>
    </div>
  );
}
