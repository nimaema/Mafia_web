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

type NavTone = "primary" | "warning" | "danger" | "success" | "violet";

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
  if (role === "ADMIN") return "bg-[var(--pm-primary)]/10 text-[var(--pm-primary)] border border-[var(--pm-primary)]/20 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-black";
  if (role === "MODERATOR") return "bg-[var(--pm-warning)]/10 text-[var(--pm-warning)] border border-[var(--pm-warning)]/20 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-black";
  return "bg-[var(--pm-success)]/10 text-[var(--pm-success)] border border-[var(--pm-success)]/20 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-black";
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
  const map: Record<NavTone, { active: string; idle: string }> = {
    primary: {
      active: "border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/15 text-[var(--pm-primary)] shadow-lg shadow-[var(--pm-primary)]/10",
      idle: "text-[var(--pm-muted)] hover:border-[var(--pm-primary)]/20 hover:bg-[var(--pm-primary)]/5 hover:text-[var(--pm-primary)] border-transparent bg-transparent",
    },
    violet: {
      active: "border-violet-500/30 bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/10",
      idle: "text-[var(--pm-muted)] hover:border-violet-500/20 hover:bg-violet-500/5 hover:text-violet-400 border-transparent bg-transparent",
    },
    warning: {
      active: "border-[var(--pm-warning)]/30 bg-[var(--pm-warning)]/15 text-[var(--pm-warning)] shadow-lg shadow-[var(--pm-warning)]/10",
      idle: "text-[var(--pm-muted)] hover:border-[var(--pm-warning)]/20 hover:bg-[var(--pm-warning)]/5 hover:text-[var(--pm-warning)] border-transparent bg-transparent",
    },
    success: {
      active: "border-[var(--pm-success)]/30 bg-[var(--pm-success)]/15 text-[var(--pm-success)] shadow-lg shadow-[var(--pm-success)]/10",
      idle: "text-[var(--pm-muted)] hover:border-[var(--pm-success)]/20 hover:bg-[var(--pm-success)]/5 hover:text-[var(--pm-success)] border-transparent bg-transparent",
    },
    danger: {
      active: "border-[var(--pm-danger)]/30 bg-[var(--pm-danger)]/15 text-[var(--pm-danger)] shadow-lg shadow-[var(--pm-danger)]/10",
      idle: "text-[var(--pm-muted)] hover:border-[var(--pm-danger)]/20 hover:bg-[var(--pm-danger)]/5 hover:text-[var(--pm-danger)] border-transparent bg-transparent",
    },
  };

  return active ? map[tone].active : map[tone].idle;
}

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";
  const currentLabel = activeLabel(pathname, adminTab);
  const panelDate = useMemo(formatPanelDate, []);

  const items: NavItem[] = [
    { key: "dashboard", href: "/dashboard/user", label: "خانه", description: "لابی‌های زنده و وضعیت بازی", icon: "space_dashboard", tone: "primary", group: "player" },
    { key: "history", href: "/dashboard/user/history", label: "تاریخچه", description: "نتایج، نقش‌ها و گزارش‌ها", icon: "history", tone: "violet", group: "player" },
    { key: "guide", href: "/game-guide", label: "راهنما", description: "قوانین، لابی و گزارش", icon: "menu_book", tone: "warning", group: "player" },
    { key: "requests", href: "/dashboard/user/requests", label: "پیشنهادها", description: "ثبت پیشنهاد نقش و سناریو", icon: "rate_review", tone: "danger", group: "player" },
    { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", description: "تصویر، نام و امنیت حساب", icon: "account_circle", tone: "success", group: "player" },
  ];

  if (isModerator) {
    items.push(
      { key: "moderator", href: "/dashboard/moderator", label: "لابی‌ها", description: "ساخت و مدیریت بازی", icon: "stadia_controller", tone: "warning", group: "moderator" },
      { key: "scenarios", href: scenarioHref, label: "سناریوها", description: "ترکیب‌ها و راهنماها", icon: "account_tree", tone: "violet", group: "moderator" },
      { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", description: "توانایی‌ها و جبهه‌ها", icon: "theater_comedy", tone: "primary", group: "moderator" },
    );
  }

  if (isAdmin) {
    items.push(
      { key: "users", href: "/dashboard/admin/users", label: "کاربران", description: "کنترل حساب و دسترسی", icon: "group", tone: "primary", group: "admin" },
      { key: "adminRequests", href: "/dashboard/admin/requests", label: "بررسی درخواست‌ها", description: "تایید نقش و سناریو", icon: "fact_check", tone: "success", group: "admin" },
      { key: "adminHistory", href: "/dashboard/admin/history", label: "آرشیو کل", description: "همه بازی‌ها و گزارش‌ها", icon: "database_search", tone: "violet", group: "admin" },
      { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "نسخه‌ها و بازیابی امن", icon: "cloud_sync", tone: "warning", group: "admin" },
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
          "motion-nav-item group relative grid min-h-[3.35rem] grid-cols-[2.35rem_minmax(0,1fr)_1rem] items-center gap-2.5 overflow-hidden rounded-[var(--radius-sm)] border px-2.5 text-right",
          toneClasses(item.tone, active)
        )}
      >
        <span className={cx(
          "material-symbols-outlined grid size-9 place-items-center rounded-[var(--radius-sm)] border text-[1.2rem] leading-none",
          active ? "border-transparent bg-white/10" : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)] opacity-70 group-hover:opacity-100"
        )}>
          {item.icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] font-bold opacity-70">{item.description}</span>
        </span>
        <span className="material-symbols-outlined text-base opacity-40 transition-all group-hover:-translate-x-0.5 group-hover:opacity-80">
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
          "motion-nav-item relative flex min-w-[3.65rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-center",
          active ? "bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]" : "text-[var(--pm-muted)] hover:bg-[var(--pm-surface-soft)] hover:text-[var(--pm-text)]"
        )}
      >
        <span className={cx(
          "material-symbols-outlined grid size-8 place-items-center rounded-[var(--radius-sm)] text-[1.16rem] leading-none",
          active ? "bg-[var(--pm-primary)] text-zinc-950" : "bg-[var(--pm-surface-soft)] opacity-80"
        )}>
          {item.icon}
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="sticky top-0 z-30 hidden h-screen w-[19rem] shrink-0 border-l border-[var(--pm-line)] bg-[var(--pm-surface)]/96 p-3 shadow-[var(--pm-shadow-soft)] backdrop-blur-xl md:flex md:flex-col">
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3 shadow-[var(--pm-shadow-soft)]">
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)] text-base font-black text-[var(--pm-text)]">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span>{userInitial(user.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-black text-[var(--pm-text)]">{user.name || "بازیکن مافیا"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={roleTone(user.role)}>{roleLabel(user.role)}</span>
                <span className="pm-chip pm-chip-primary">{currentLabel}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-3 grid grid-cols-[1fr_auto] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black text-[var(--pm-primary)]">{panelDate.shamsi}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-[var(--pm-muted)]" dir="ltr">{panelDate.miladi}</p>
            </div>
            <div className="pm-icon text-[var(--pm-primary)] border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10">
              <span className="material-symbols-outlined text-base">calendar_month</span>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar mt-3 flex flex-1 flex-col gap-3 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-2.5">
          {navGroups.map((group) => (
            <section key={group.key} className="motion-list">
              <div className="mb-1.5 flex items-center gap-2 px-2">
                <span className="h-px flex-1 bg-[var(--pm-line)]" />
                <p className="text-[10px] font-black tracking-[0.16em] text-[var(--pm-muted)]">{group.label}</p>
              </div>
              <div className="grid gap-1.5">
                {group.items.map(renderDesktopLink)}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-2">
          <ThemeToggle nav />
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="pm-icon-button motion-nav-item border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 text-[var(--pm-danger)] shadow-none hover:border-[var(--pm-danger)]/40 hover:bg-[var(--pm-danger)] hover:text-white"
              aria-label="خروج"
              title="خروج"
            >
              <span className="material-symbols-outlined text-[1.2rem] leading-none">logout</span>
            </button>
          </form>
          <p className="min-w-0 truncate text-[11px] font-bold text-[var(--pm-muted)]">کنترل سریع پنل</p>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)]/95 p-2 text-[var(--pm-text)] shadow-[var(--pm-shadow)] backdrop-blur-2xl md:hidden">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <ThemeToggle nav />
          <div className="custom-scrollbar flex h-[4.05rem] items-stretch gap-1 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-1">
            {items.map(renderMobileLink)}
          </div>
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="pm-icon-button border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 text-[var(--pm-danger)] shadow-none hover:border-[var(--pm-danger)]/40 hover:bg-[var(--pm-danger)] hover:text-white"
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
