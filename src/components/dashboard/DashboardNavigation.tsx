"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type DashboardUser = {
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  description: string;
  icon: string;
};

type NavSection = {
  title: string;
  subtitle: string;
  icon: string;
  items: NavItem[];
};

type DashboardNavigationProps = {
  isAdmin: boolean;
  isModerator: boolean;
  user: DashboardUser;
  logoutAction: () => Promise<void>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function roleLabel(role?: string | null) {
  if (role === "ADMIN") return "مدیر سیستم";
  if (role === "MODERATOR") return "گرداننده";
  return "بازیکن";
}

function formatPanelDate() {
  const today = new Date();
  return {
    shamsiCompact: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long" }).format(today),
    miladiCompact: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(today),
  };
}

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";
  const panelDate = useMemo(formatPanelDate, []);

  const sections: NavSection[] = [
    {
      title: "فضای بازیکن",
      subtitle: "داشبورد، سابقه و پروفایل",
      icon: "person_pin_circle",
      items: [
        { key: "dashboard", href: "/dashboard/user", label: "داشبورد", description: "خلاصه وضعیت و بازی‌های فعال", icon: "dashboard" },
        { key: "history", href: "/dashboard/user/history", label: "تاریخچه بازی‌ها", description: "نتایج، نقش‌ها و گزارش‌ها", icon: "history" },
        { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", description: "نام، تصویر و تنظیمات حساب", icon: "person" },
      ],
    },
  ];

  if (isModerator) {
    sections.push({
      title: "گردانندگی",
      subtitle: "لابی، سناریو و اتاق اجرا",
      icon: "sports_esports",
      items: [
        { key: "moderator", href: "/dashboard/moderator", label: "لابی بازی‌ها", description: "ساخت، شروع و مدیریت لابی", icon: "sports_esports" },
        { key: "scenarios", href: scenarioHref, label: "سناریوها", description: "کتابخانه ترکیب‌های بازی", icon: "account_tree" },
        { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", description: "توانایی‌ها و جبهه‌ها", icon: "theater_comedy" },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "مدیریت کل",
      subtitle: "کاربران، تاریخچه و بکاپ",
      icon: "admin_panel_settings",
      items: [
        { key: "users", href: "/dashboard/admin/users", label: "کاربران", description: "نقش، وضعیت و کنترل حساب", icon: "group" },
        { key: "adminHistory", href: "/dashboard/admin/history", label: "تاریخچه کل", description: "همه بازی‌ها و گزارش‌ها", icon: "manage_history" },
        { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "دیتابیس، نقش‌ها و سناریوها", icon: "database" },
      ],
    });
  }

  const allItems = sections.flatMap((section) => section.items);

  const isActive = (item: NavItem) => {
    if (item.key === "dashboard") return pathname === "/dashboard/user";
    if (item.key === "history") return pathname.startsWith("/dashboard/user/history");
    if (item.key === "profile") return pathname.startsWith("/dashboard/user/profile");
    if (item.key === "moderator") return pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby") || pathname.startsWith("/dashboard/moderator/game");
    if (item.key === "scenarios") return pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios");
    if (item.key === "roles") return pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles");
    if (item.key === "users") return pathname === "/dashboard/admin/users";
    if (item.key === "adminHistory") return pathname === "/dashboard/admin/history";
    if (item.key === "backups") return pathname === "/dashboard/admin/backups";
    return false;
  };

  const renderDesktopLink = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cx(
          "group flex items-center gap-3 px-4 py-3 relative overflow-hidden transition-all duration-300 rounded-none border-b border-zinc-200/50 dark:border-white/5 last:border-0",
          active ? "bg-red-50 dark:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-white/5"
        )}
      >
        <div className={cx(
          "absolute right-0 top-0 bottom-0 w-1 transition-all duration-300",
          active ? "bg-red-600 dark:bg-[#ffb4ab] shadow-[0_0_10px_rgba(220,38,38,0.5)] dark:shadow-[0_0_10px_#ffb4ab]" : "bg-transparent group-hover:bg-red-400/50 dark:group-hover:bg-[#ffb4ab]/50"
        )} />
        
        <span className={cx(
          "material-symbols-outlined text-xl transition-colors duration-300",
          active ? "text-red-600 dark:text-[#ffb4ab]" : "text-zinc-500 dark:text-[#c8c6c6] group-hover:text-zinc-900 dark:group-hover:text-white"
        )}>
          {item.icon}
        </span>
        
        <div className="flex flex-col flex-1 min-w-0">
          <span className={cx("text-sm font-black tracking-wide truncate transition-colors", active ? "text-red-700 dark:text-white" : "text-zinc-700 dark:text-[#c8c6c6] group-hover:text-zinc-950 dark:group-hover:text-white")}>{item.label}</span>
        </div>

        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" dir="ltr">
          [{item.key}]
        </span>
      </Link>
    );
  };

  const renderMobileLink = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cx(
          "flex min-w-[5.5rem] flex-col items-center justify-center gap-1.5 py-3 relative transition-all duration-300 shrink-0",
          active ? "text-red-600 dark:text-[#ffb4ab]" : "text-zinc-500 dark:text-[#c8c6c6] hover:text-zinc-900 dark:hover:text-white"
        )}
      >
        {active && <div className="absolute top-0 left-2 right-2 h-[3px] bg-red-600 dark:bg-[#ffb4ab] shadow-[0_0_8px_rgba(220,38,38,0.5)] dark:shadow-[0_0_8px_#ffb4ab]" />}
        <span className="material-symbols-outlined text-[1.6rem]">{item.icon}</span>
        <span className="text-[11px] font-black">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Cinematic Brutalism) */}
      <aside className="sticky top-0 z-20 hidden h-screen w-72 shrink-0 flex-col bg-white dark:bg-[#0e0e0e] border-l border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white md:flex selection:bg-red-200 dark:selection:bg-[#98000b] transition-colors duration-300">
        {/* Header Profile Area */}
        <div className="relative p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#131313] overflow-hidden group transition-colors duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 dark:bg-[#98000b]" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/20 shrink-0 overflow-hidden relative transition-colors duration-300">
              <div className="absolute inset-0 bg-red-500/10 dark:bg-[#ffb4ab]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black text-red-600 dark:text-[#ffb4ab]">{user.name?.charAt(0) || "U"}</div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-zinc-500 dark:text-[#c8c6c6] font-mono tracking-widest uppercase mb-1 truncate transition-colors duration-300" dir="ltr">ID: {user.name || "UNKNOWN"}</span>
              <span className="text-sm font-black text-zinc-950 dark:text-white truncate transition-colors duration-300">{roleLabel(user.role)}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500 transition-colors duration-300">
            <span>{panelDate.shamsiCompact}</span>
            <span dir="ltr">{panelDate.miladiCompact}</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col">
              <div className="mb-3 px-2 flex items-center gap-2">
                <span className="text-red-500 dark:text-[#ffb4ab] opacity-50">///</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-[#c6c6c6]">{section.title}</span>
              </div>
              <div className="border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#131313] flex flex-col transition-colors duration-300">
                {section.items.map(renderDesktopLink)}
              </div>
            </section>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#131313] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">تم نوری</span>
            <ThemeToggle />
          </div>
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="group flex items-center gap-3 w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 hover:border-red-400 dark:hover:border-[#ffb4ab] hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-[#ffb4ab] transition-all px-4 py-3 font-bold text-sm tracking-wide justify-center"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="uppercase">خروج از سیستم</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Navigation (Cinematic Brutalism) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="h-1 bg-gradient-to-r from-transparent via-red-600 dark:via-[#98000b] to-transparent opacity-50" />
        <div className="custom-scrollbar flex items-stretch gap-2 overflow-x-auto px-4 pb-safe-bottom snap-x snap-mandatory">
          {allItems.map((item) => (
            <div key={item.key} className="snap-center">
              {renderMobileLink(item)}
            </div>
          ))}
          
          <div className="snap-center flex items-center justify-center px-4 border-r border-zinc-200 dark:border-white/10 ml-2">
            <ThemeToggle nav />
          </div>

          <form action={logoutAction} className="snap-center flex shrink-0">
            <button
              type="submit"
              className="flex min-w-[5.5rem] flex-col items-center justify-center gap-1.5 px-4 py-3 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-[#ffb4ab] transition-colors"
            >
              <span className="material-symbols-outlined text-[1.6rem]">logout</span>
              <span className="text-[11px] font-black">خروج از سیستم</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
