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

type NavTone = "cyan" | "violet" | "amber" | "emerald" | "rose";

type NavItem = {
  key: string;
  href: string;
  label: string;
  description: string;
  icon: string;
  tone: NavTone;
  group: "player" | "moderator" | "admin";
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
  if (role === "ADMIN") return "مدیر";
  if (role === "MODERATOR") return "گرداننده";
  return "بازیکن";
}

function roleTone(role?: string | null) {
  if (role === "ADMIN") return "pm-chip pm-chip-primary";
  if (role === "MODERATOR") return "pm-chip pm-chip-warning";
  return "pm-chip pm-chip-success";
}

function userInitial(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0] : "م";
}

function activeLabel(pathname: string, adminTab: string | null) {
  if (pathname === "/dashboard/user") return "خانه";
  if (pathname === "/game-guide") return "راهنمای بازی";
  if (pathname.startsWith("/dashboard/user/history")) return "تاریخچه";
  if (pathname.startsWith("/dashboard/user/profile")) return "پروفایل";
  if (pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby")) return "لابی‌ها";
  if (pathname.startsWith("/dashboard/moderator/game")) return "اتاق اجرا";
  if (pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios")) return "سناریوها";
  if (pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles")) return "نقش‌ها";
  if (pathname === "/dashboard/admin/users") return "کاربران";
  if (pathname === "/dashboard/admin/history") return "آرشیو";
  if (pathname === "/dashboard/admin/backups") return "بکاپ";
  return "پنل";
}

function formatPanelDate() {
  const today = new Date();
  return {
    shamsi: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(today),
    miladi: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(today),
  };
}

function toneClasses(tone: NavTone, active: boolean) {
  const map: Record<NavTone, { active: string; idle: string; rail: string }> = {
    cyan: {
      active: "border-cyan-500/25 bg-cyan-500/10 text-cyan-800 shadow-cyan-500/10 dark:border-cyan-300/45 dark:bg-cyan-300/15 dark:text-cyan-100",
      idle: "text-zinc-600 hover:border-cyan-500/22 hover:bg-cyan-500/8 hover:text-cyan-800 dark:text-cyan-100/72 dark:hover:border-cyan-300/24 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-50",
      rail: "from-cyan-300 to-teal-300",
    },
    violet: {
      active: "border-violet-500/25 bg-violet-500/10 text-violet-800 shadow-violet-500/10 dark:border-violet-300/45 dark:bg-violet-300/15 dark:text-violet-100",
      idle: "text-zinc-600 hover:border-violet-500/22 hover:bg-violet-500/8 hover:text-violet-800 dark:text-violet-100/72 dark:hover:border-violet-300/24 dark:hover:bg-violet-300/10 dark:hover:text-violet-50",
      rail: "from-violet-300 to-fuchsia-300",
    },
    amber: {
      active: "border-amber-500/25 bg-amber-500/10 text-amber-800 shadow-amber-500/10 dark:border-amber-300/45 dark:bg-amber-300/15 dark:text-amber-100",
      idle: "text-zinc-600 hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-amber-800 dark:text-amber-100/72 dark:hover:border-amber-300/24 dark:hover:bg-amber-300/10 dark:hover:text-amber-50",
      rail: "from-amber-300 to-orange-300",
    },
    emerald: {
      active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 shadow-emerald-500/10 dark:border-emerald-300/45 dark:bg-emerald-300/15 dark:text-emerald-100",
      idle: "text-zinc-600 hover:border-emerald-500/22 hover:bg-emerald-500/8 hover:text-emerald-800 dark:text-emerald-100/72 dark:hover:border-emerald-300/24 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-50",
      rail: "from-emerald-300 to-teal-300",
    },
    rose: {
      active: "border-rose-500/25 bg-rose-500/10 text-rose-800 shadow-rose-500/10 dark:border-rose-300/45 dark:bg-rose-300/15 dark:text-rose-100",
      idle: "text-zinc-600 hover:border-rose-500/22 hover:bg-rose-500/8 hover:text-rose-800 dark:text-rose-100/72 dark:hover:border-rose-300/24 dark:hover:bg-rose-300/10 dark:hover:text-rose-50",
      rail: "from-rose-300 to-pink-300",
    },
  };

  return active ? map[tone].active : map[tone].idle;
}

function toneRail(tone: NavTone) {
  const map: Record<NavTone, string> = {
    cyan: "from-cyan-300 to-teal-300",
    violet: "from-violet-300 to-fuchsia-300",
    amber: "from-amber-300 to-orange-300",
    emerald: "from-emerald-300 to-teal-300",
    rose: "from-rose-300 to-pink-300",
  };
  return map[tone];
}

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";
  const currentLabel = activeLabel(pathname, adminTab);
  const panelDate = useMemo(formatPanelDate, []);

  const items: NavItem[] = [
    { key: "dashboard", href: "/dashboard/user", label: "خانه", description: "لابی‌های زنده و وضعیت بازی", icon: "space_dashboard", tone: "cyan", group: "player" },
    { key: "history", href: "/dashboard/user/history", label: "تاریخچه", description: "نتایج، نقش‌ها و گزارش‌ها", icon: "history", tone: "violet", group: "player" },
    { key: "guide", href: "/game-guide", label: "راهنما", description: "قوانین، لابی و گزارش", icon: "menu_book", tone: "amber", group: "player" },
    { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", description: "تصویر، نام و امنیت حساب", icon: "account_circle", tone: "emerald", group: "player" },
  ];

  if (isModerator) {
    items.push(
      { key: "moderator", href: "/dashboard/moderator", label: "لابی‌ها", description: "ساخت و مدیریت بازی", icon: "stadia_controller", tone: "amber", group: "moderator" },
      { key: "scenarios", href: scenarioHref, label: "سناریوها", description: "ترکیب‌ها و راهنماها", icon: "account_tree", tone: "violet", group: "moderator" },
      { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", description: "توانایی‌ها و جبهه‌ها", icon: "theater_comedy", tone: "cyan", group: "moderator" },
    );
  }

  if (isAdmin) {
    items.push(
      { key: "users", href: "/dashboard/admin/users", label: "کاربران", description: "کنترل حساب و دسترسی", icon: "group", tone: "cyan", group: "admin" },
      { key: "adminHistory", href: "/dashboard/admin/history", label: "آرشیو کل", description: "همه بازی‌ها و گزارش‌ها", icon: "database_search", tone: "violet", group: "admin" },
      { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "نسخه‌ها و بازیابی امن", icon: "cloud_sync", tone: "amber", group: "admin" },
    );
  }

  const isActive = (item: NavItem) => {
    if (item.key === "dashboard") return pathname === "/dashboard/user";
    if (item.key === "history") return pathname.startsWith("/dashboard/user/history");
    if (item.key === "guide") return pathname === "/game-guide";
    if (item.key === "profile") return pathname.startsWith("/dashboard/user/profile");
    if (item.key === "moderator") {
      return pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby") || pathname.startsWith("/dashboard/moderator/game");
    }
    if (item.key === "scenarios") {
      return pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios");
    }
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
        aria-current={active ? "page" : undefined}
        className={cx(
          "motion-nav-item group relative grid min-h-[3.65rem] grid-cols-[2.5rem_minmax(0,1fr)_1.2rem] items-center gap-3 overflow-hidden rounded-2xl border px-2.5 text-right shadow-sm transition-all",
          toneClasses(item.tone, active),
          active ? "shadow-lg" : "border-transparent bg-white/35 dark:border-white/0 dark:bg-white/[0.025]"
        )}
      >
        <span className={cx("absolute inset-y-2 right-0 w-1 rounded-l-full bg-gradient-to-b opacity-0 transition-opacity", toneRail(item.tone), active && "opacity-100")} />
        <span className={cx(
          "material-symbols-outlined grid size-10 place-items-center rounded-xl border text-[1.28rem] leading-none",
          active ? "border-zinc-950/8 bg-white text-zinc-950 dark:border-white/14 dark:bg-white/14 dark:text-white" : "border-zinc-950/6 bg-white/70 text-zinc-500 group-hover:text-zinc-950 dark:border-white/8 dark:bg-white/[0.045] dark:text-white/70 dark:group-hover:text-white"
        )}>
          {item.icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] font-bold text-zinc-500 dark:text-white/42">{item.description}</span>
        </span>
        <span className="material-symbols-outlined text-lg text-zinc-400 transition-all group-hover:-translate-x-0.5 group-hover:text-zinc-700 dark:text-white/28 dark:group-hover:text-white/70">
          chevron_left
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
        aria-current={active ? "page" : undefined}
        className={cx(
          "motion-nav-item relative flex min-w-[3.7rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-center transition-all",
          active ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/14 dark:bg-white dark:text-zinc-950 dark:shadow-black/20" : "text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-white/58 dark:hover:bg-white/8 dark:hover:text-white"
        )}
      >
        {active && <span className={cx("absolute top-1 h-1 w-6 rounded-full bg-gradient-to-l", toneRail(item.tone))} />}
        <span className={cx(
          "material-symbols-outlined grid size-8 place-items-center rounded-xl text-[1.2rem] leading-none",
          active ? "bg-cyan-300 text-zinc-950" : "bg-zinc-950/[0.045] text-zinc-500 dark:bg-white/[0.055] dark:text-white/70"
        )}>
          {item.icon}
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="sticky top-0 z-30 hidden h-screen w-[18.5rem] shrink-0 border-l border-zinc-200 bg-white/88 p-3 text-zinc-950 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[#12151a]/95 dark:text-white dark:shadow-black/30 md:flex md:flex-col">
        <div className="pm-aurora relative overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white/75 p-3 shadow-2xl shadow-zinc-950/8 dark:border-white/12 dark:bg-white/[0.055] dark:shadow-black/25">
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white text-base font-black text-zinc-950 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:shadow-black/20">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span>{userInitial(user.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{user.name || "بازیکن مافیا"}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={roleTone(user.role)}>{roleLabel(user.role)}</span>
                <span className="pm-chip pm-chip-primary" dir="ltr">{panelDate.miladi}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-3 rounded-2xl border border-zinc-200 bg-zinc-950/[0.035] px-3 py-2 dark:border-white/10 dark:bg-black/18">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[11px] font-black text-zinc-700 dark:text-white/78">
                <span className="material-symbols-outlined text-base text-cyan-700 dark:text-cyan-200">calendar_month</span>
                امروز
              </span>
              <span className="truncate text-[11px] font-black text-cyan-700 dark:text-cyan-100">{panelDate.shamsi}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200/80">COMMAND</p>
            <p className="mt-1 text-lg font-black leading-6">{currentLabel}</p>
          </div>
          <span className="material-symbols-outlined grid size-10 place-items-center rounded-2xl border border-zinc-200 bg-white/80 text-cyan-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-cyan-100">
            route
          </span>
        </div>

        <nav className="custom-scrollbar motion-list mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-[1.35rem] border border-zinc-200 bg-zinc-950/[0.035] p-2 dark:border-white/10 dark:bg-black/16">
          {items.map(renderDesktopLink)}
        </nav>

        <div className="mt-3 flex items-center gap-2 rounded-[1.35rem] border border-zinc-200 bg-zinc-950/[0.035] p-2 dark:border-white/10 dark:bg-black/16">
          <ThemeToggle compact />
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="motion-nav-item inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 text-xs font-black text-rose-700 transition-all hover:bg-rose-500 hover:text-white dark:border-rose-300/18 dark:text-rose-100"
            >
              <span className="material-symbols-outlined grid size-8 place-items-center rounded-full bg-white/10 text-lg leading-none">logout</span>
              <span className="truncate text-right">خروج</span>
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[2rem] border border-zinc-950/8 bg-white/88 p-2 text-zinc-950 shadow-2xl shadow-zinc-950/12 backdrop-blur-2xl dark:border-white/12 dark:bg-[#12151a]/92 dark:text-white dark:shadow-black/35 md:hidden">
        <Link
          href={isModerator ? "/dashboard/moderator" : "/dashboard/user"}
          className="absolute -top-6 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full border border-white bg-gradient-to-br from-cyan-300 to-emerald-300 text-zinc-950 shadow-2xl shadow-cyan-500/22 dark:border-[#12151a]"
          aria-label="اکشن اصلی"
        >
          <span className="material-symbols-outlined text-2xl">{isModerator ? "stadia_controller" : "sports_esports"}</span>
        </Link>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <ThemeToggle nav />
          <div className="custom-scrollbar flex h-[4.25rem] items-stretch gap-1 overflow-x-auto px-2">
          {items.map(renderMobileLink)}
          </div>
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="grid size-11 place-items-center rounded-full border border-rose-500/15 bg-rose-500/10 text-rose-600 shadow-sm shadow-zinc-950/5 transition-all hover:bg-rose-500 hover:text-white dark:text-rose-200"
              aria-label="خروج"
              title="خروج"
            >
              <span className="material-symbols-outlined text-[1.25rem] leading-none">logout</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
