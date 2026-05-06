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
  if (pathname.startsWith("/dashboard/user/requests") || pathname === "/dashboard/admin/requests") return "درخواست‌ها";
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
    { key: "requests", href: "/dashboard/user/requests", label: "پیشنهادها", description: "ثبت پیشنهاد نقش و سناریو", icon: "rate_review", tone: "rose", group: "player" },
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
      { key: "adminRequests", href: "/dashboard/admin/requests", label: "بررسی درخواست‌ها", description: "تایید نقش و سناریو", icon: "fact_check", tone: "emerald", group: "admin" },
      { key: "adminHistory", href: "/dashboard/admin/history", label: "آرشیو کل", description: "همه بازی‌ها و گزارش‌ها", icon: "database_search", tone: "violet", group: "admin" },
      { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "نسخه‌ها و بازیابی امن", icon: "cloud_sync", tone: "amber", group: "admin" },
    );
  }

  const isActive = (item: NavItem) => {
    if (item.key === "dashboard") return pathname === "/dashboard/user";
    if (item.key === "history") return pathname.startsWith("/dashboard/user/history");
    if (item.key === "guide") return pathname === "/game-guide";
    if (item.key === "requests") return pathname.startsWith("/dashboard/user/requests");
    if (item.key === "profile") return pathname.startsWith("/dashboard/user/profile");
    if (item.key === "moderator") {
      return pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby") || pathname.startsWith("/dashboard/moderator/game");
    }
    if (item.key === "scenarios") {
      return pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios");
    }
    if (item.key === "roles") return pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles");
    if (item.key === "users") return pathname === "/dashboard/admin/users";
    if (item.key === "adminRequests") return pathname === "/dashboard/admin/requests";
    if (item.key === "adminHistory") return pathname === "/dashboard/admin/history";
    if (item.key === "backups") return pathname === "/dashboard/admin/backups";
    return false;
  };

  const navGroups = [
    { key: "player", label: "بازیکن", items: items.filter((item) => item.group === "player") },
    { key: "moderator", label: "گرداننده", items: items.filter((item) => item.group === "moderator") },
    { key: "admin", label: "مدیریت", items: items.filter((item) => item.group === "admin") },
  ].filter((group) => group.items.length);

  const renderDesktopLink = (item: NavItem) => {
    const active = isActive(item);

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "motion-nav-item group relative grid min-h-[3.35rem] grid-cols-[2.35rem_minmax(0,1fr)_1rem] items-center gap-2.5 overflow-hidden rounded-[1.15rem] border px-2.5 text-right shadow-sm transition-all",
          toneClasses(item.tone, active),
          active ? "shadow-lg shadow-zinc-950/8 dark:shadow-black/20" : "border-transparent bg-white/38 hover:bg-white/72 dark:border-white/0 dark:bg-white/[0.025] dark:hover:bg-white/[0.055]"
        )}
      >
        <span className={cx("absolute inset-y-2 right-0 w-1 rounded-l-full bg-gradient-to-b opacity-0 transition-opacity", toneRail(item.tone), active && "opacity-100")} />
        <span className={cx(
          "material-symbols-outlined grid size-9 place-items-center rounded-xl border text-[1.2rem] leading-none",
          active ? "border-zinc-950/8 bg-white text-zinc-950 dark:border-white/14 dark:bg-white/14 dark:text-white" : "border-zinc-950/6 bg-white/70 text-zinc-500 group-hover:text-zinc-950 dark:border-white/8 dark:bg-white/[0.045] dark:text-white/70 dark:group-hover:text-white"
        )}>
          {item.icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] font-bold text-zinc-500 dark:text-white/46">{item.description}</span>
        </span>
        <span className="material-symbols-outlined text-base text-zinc-400 transition-all group-hover:-translate-x-0.5 group-hover:text-zinc-700 dark:text-white/28 dark:group-hover:text-white/70">
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
          "motion-nav-item relative flex min-w-[3.65rem] flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2 py-1.5 text-center transition-all",
          active ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/14 dark:bg-white dark:text-zinc-950 dark:shadow-black/20" : "text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-white/58 dark:hover:bg-white/8 dark:hover:text-white"
        )}
      >
        {active && <span className={cx("absolute top-1 h-0.5 w-7 rounded-full bg-gradient-to-l", toneRail(item.tone))} />}
        <span className={cx(
          "material-symbols-outlined grid size-8 place-items-center rounded-xl text-[1.16rem] leading-none",
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
      <aside className="sticky top-0 z-30 hidden h-screen w-[19rem] shrink-0 border-l border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92)_45%,rgba(236,254,255,0.74))] p-3 text-zinc-950 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,21,26,0.98),rgba(14,16,20,0.96)_50%,rgba(8,47,73,0.18))] dark:text-white dark:shadow-black/35 md:flex md:flex-col">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-zinc-200 bg-white/76 p-3 shadow-2xl shadow-zinc-950/8 dark:border-white/12 dark:bg-white/[0.055] dark:shadow-black/25">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_14rem),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_12rem)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[1.1rem] border border-zinc-200 bg-white text-base font-black text-zinc-950 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-white/[0.08] dark:text-white dark:shadow-black/20">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span>{userInitial(user.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-black">{user.name || "بازیکن مافیا"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={roleTone(user.role)}>{roleLabel(user.role)}</span>
                <span className="pm-chip pm-chip-primary">{currentLabel}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-3 grid grid-cols-[1fr_auto] items-center gap-2 rounded-[1.1rem] border border-zinc-200 bg-zinc-950/[0.035] px-3 py-2 dark:border-white/10 dark:bg-black/18">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black text-cyan-700 dark:text-cyan-100">{panelDate.shamsi}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-zinc-500 dark:text-white/46" dir="ltr">{panelDate.miladi}</p>
            </div>
            <span className="material-symbols-outlined grid size-9 place-items-center rounded-xl bg-white text-base text-cyan-700 shadow-sm shadow-zinc-950/5 dark:bg-white/[0.08] dark:text-cyan-100">
              calendar_month
            </span>
          </div>
        </div>

        <nav className="custom-scrollbar mt-3 flex flex-1 flex-col gap-3 overflow-y-auto rounded-[1.55rem] border border-zinc-200 bg-white/45 p-2.5 dark:border-white/10 dark:bg-black/16">
          {navGroups.map((group) => (
            <section key={group.key} className="motion-list">
              <div className="mb-1.5 flex items-center gap-2 px-2">
                <span className="h-px flex-1 bg-gradient-to-l from-cyan-400/40 to-transparent" />
                <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400 dark:text-white/36">{group.label}</p>
              </div>
              <div className="grid gap-1.5">
                {group.items.map(renderDesktopLink)}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-[1.35rem] border border-zinc-200 bg-white/62 p-2 dark:border-white/10 dark:bg-black/16">
          <ThemeToggle nav />
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="motion-nav-item grid size-11 place-items-center rounded-full border border-rose-500/18 bg-rose-500/10 text-rose-600 shadow-sm shadow-zinc-950/5 transition-all hover:bg-rose-500 hover:text-white dark:text-rose-200"
              aria-label="خروج"
              title="خروج"
            >
              <span className="material-symbols-outlined text-[1.2rem] leading-none">logout</span>
            </button>
          </form>
          <p className="min-w-0 truncate text-[11px] font-bold text-zinc-500 dark:text-white/42">کنترل سریع پنل</p>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-[1.55rem] border border-zinc-950/8 bg-white/90 p-2 text-zinc-950 shadow-2xl shadow-zinc-950/12 backdrop-blur-2xl dark:border-white/12 dark:bg-[#12151a]/94 dark:text-white dark:shadow-black/35 md:hidden">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <ThemeToggle nav />
          <div className="custom-scrollbar flex h-[4.05rem] items-stretch gap-1 overflow-x-auto rounded-[1.25rem] border border-zinc-950/6 bg-zinc-950/[0.035] p-1 dark:border-white/8 dark:bg-white/[0.035]">
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
