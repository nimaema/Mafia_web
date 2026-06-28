"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

// Idle icon accent per item — a quiet cue, not a rainbow. Active is always brass.
const TONE_COLOR: Record<NavTone, string> = {
  primary: "var(--pm-primary)",
  violet: "#a88adf",
  warning: "var(--pm-warning)",
  success: "var(--pm-success)",
  danger: "var(--pm-danger)",
};

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

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";
  const currentLabel = activeLabel(pathname, adminTab);
  const panelDate = useMemo(formatPanelDate, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { key: "player", label: "بازیکن", icon: "person", items: items.filter((item) => item.group === "player") },
    { key: "moderator", label: "گرداننده", icon: "stadia_controller", items: items.filter((item) => item.group === "moderator") },
    { key: "admin", label: "مدیریت", icon: "shield_person", items: items.filter((item) => item.group === "admin") },
  ].filter((group) => group.items.length);

  const mobilePrimaryKeys = isAdmin
    ? ["dashboard", "users", "adminRequests", "profile"]
    : isModerator
      ? ["dashboard", "moderator", "history", "profile"]
      : ["dashboard", "history", "guide", "profile"];
  const mobilePrimaryItems = mobilePrimaryKeys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is NavItem => Boolean(item));
  const mobilePrimaryKeySet = new Set(mobilePrimaryItems.map((item) => item.key));
  const overflowItems = items.filter((item) => !mobilePrimaryKeySet.has(item.key));
  const moreActive = overflowItems.some((item) => isActive(item));

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, adminTab]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const mobileLabel = (item: NavItem) => {
    if (item.key === "adminRequests") return "بررسی";
    if (item.key === "moderator") return "لابی";
    return item.label;
  };

  /* ---------------------------------------------------- desktop sidebar link */
  const renderDesktopLink = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "group relative grid min-h-[3.4rem] grid-cols-[2.5rem_minmax(0,1fr)_0.9rem] items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-2.5 text-right transition-all duration-300 ease-[var(--ease-fluid)]",
          active
            ? "bg-[var(--pm-primary)]/12 text-[var(--pm-primary)] shadow-[0_8px_24px_-12px_var(--pm-primary-glow)]"
            : "text-[var(--pm-muted)] hover:bg-[var(--pm-surface-soft)] hover:text-[var(--pm-text)]"
        )}
      >
        {/* sliding brass spine on the inline-end (right in RTL) */}
        <span
          className={cx(
            "absolute inset-y-2 right-0 w-[3px] rounded-full bg-[var(--pm-primary)] transition-all duration-300",
            active ? "opacity-100" : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
          )}
        />
        <span
          className={cx(
            "grid size-10 place-items-center rounded-[var(--radius-sm)] border transition-all duration-300",
            active
              ? "border-transparent bg-gradient-to-b from-[var(--pm-primary-strong)] to-[var(--pm-primary)] text-[var(--pm-text-inverse)] shadow-[0_6px_16px_-6px_var(--pm-primary-glow)]"
              : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)] group-hover:-translate-y-0.5"
          )}
          style={!active ? { color: TONE_COLOR[item.tone] } : undefined}
        >
          <span className="material-symbols-outlined text-[1.2rem] leading-none" style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 600, 'opsz' 24" } : undefined}>{item.icon}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black leading-5">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] font-bold leading-4 opacity-70">{item.description}</span>
        </span>
        <span className={cx(
          "material-symbols-outlined text-base transition-all duration-300",
          active ? "translate-x-0 opacity-90" : "opacity-30 group-hover:-translate-x-0.5 group-hover:opacity-70"
        )}>
          chevron_left
        </span>
      </Link>
    );
  };

  /* ---------------------------------------------------- mobile dock item
     The active item morphs into a brass pill (filled icon + label); the
     rest collapse to icon-only — a tactile, modern dock, not a flat row. */
  const renderDockItem = (opts: {
    key: string; icon: string; label: string; active: boolean;
    href?: string; onClick?: () => void; ariaControls?: string; ariaExpanded?: boolean;
  }) => {
    const inner = (
      <>
        <span
          className="material-symbols-outlined text-[1.45rem] leading-none transition-transform duration-300 group-active:scale-90"
          style={opts.active ? { fontVariationSettings: "'FILL' 1, 'wght' 600, 'opsz' 24" } : undefined}
        >
          {opts.icon}
        </span>
        <span
          className={cx(
            "overflow-hidden whitespace-nowrap text-sm font-black transition-all duration-300",
            opts.active ? "max-w-[6rem] opacity-100" : "max-w-0 opacity-0"
          )}
        >
          {opts.label}
        </span>
      </>
    );
    const className = cx(
      "group relative flex h-12 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] outline-none transition-all duration-[350ms] ease-[var(--ease-fluid)] focus-visible:outline-2 focus-visible:outline-[var(--pm-primary)]",
      opts.active
        ? "flex-[1.7] bg-gradient-to-b from-[var(--pm-primary-strong)] to-[var(--pm-primary)] px-3 text-[var(--pm-text-inverse)] shadow-[0_10px_22px_-8px_var(--pm-primary-glow)]"
        : "flex-1 text-[var(--pm-muted)] hover:bg-[var(--pm-surface-soft)] hover:text-[var(--pm-text)]"
    );
    return opts.href ? (
      <Link key={opts.key} href={opts.href} aria-current={opts.active ? "page" : undefined} aria-label={opts.label} className={className} onClick={opts.onClick}>
        {inner}
      </Link>
    ) : (
      <button key={opts.key} type="button" className={className} onClick={opts.onClick} aria-controls={opts.ariaControls} aria-expanded={opts.ariaExpanded} aria-label={opts.label}>
        {inner}
      </button>
    );
  };

  /* ---------------------------------------------------- mobile sheet link */
  const renderMobileSheetLink = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        className={cx(
          "group grid min-h-[4.2rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border p-2.5 text-right transition-all duration-200",
          active
            ? "border-[var(--pm-primary)]/40 bg-[var(--pm-primary)]/12 text-[var(--pm-primary)]"
            : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-text)] hover:border-[var(--pm-primary)]/25 hover:bg-[var(--pm-surface)]"
        )}
      >
        <span
          className={cx(
            "grid size-11 place-items-center rounded-[var(--radius-sm)] border",
            active ? "border-transparent bg-gradient-to-b from-[var(--pm-primary-strong)] to-[var(--pm-primary)] text-[var(--pm-text-inverse)]" : "border-[var(--pm-line)] bg-[var(--pm-surface)]"
          )}
          style={!active ? { color: TONE_COLOR[item.tone] } : undefined}
        >
          <span className="material-symbols-outlined text-[1.35rem] leading-none" style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 600, 'opsz' 24" } : undefined}>{item.icon}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black leading-6">{item.label}</span>
          <span className="mt-0.5 block text-[11px] font-bold leading-5 text-[var(--pm-muted)]">{item.description}</span>
        </span>
        <span className={cx("material-symbols-outlined text-lg", active ? "text-[var(--pm-primary)]" : "text-[var(--pm-muted)]")}>
          {active ? "radio_button_checked" : "chevron_left"}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ============================================ DESKTOP SIDEBAR */}
      <aside className="sticky top-0 z-30 hidden h-screen w-[18.5rem] shrink-0 flex-col gap-3 border-l border-[var(--pm-line)] bg-[var(--pm-surface)]/85 p-3 backdrop-blur-2xl md:flex">
        {/* brand */}
        <Link href="/dashboard/user" className="group flex items-center gap-3 rounded-[var(--radius-md)] p-1.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-primary)]/40 bg-gradient-to-b from-[var(--pm-primary-strong)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)] shadow-[0_10px_24px_-10px_var(--pm-primary-glow)] transition-transform duration-300 group-hover:-translate-y-0.5"
            style={{ backgroundImage: "linear-gradient(180deg, color-mix(in oklab, var(--pm-primary) 86%, white), var(--pm-primary-strong))" }}>
            <span className="material-symbols-outlined text-[1.4rem]">playing_cards</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xl font-bold leading-5 text-[var(--pm-text)]">مافیا بورد</span>
            <span className="block truncate text-[10px] font-bold tracking-wide text-[var(--pm-muted)]">میزِ شب</span>
          </span>
        </Link>

        {/* profile */}
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
          <div className="pm-hero-wash" />
          <div className="relative flex items-center gap-3">
            <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--pm-primary)]/30 bg-[var(--pm-surface)] text-base font-black text-[var(--pm-text)]">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span>{userInitial(user.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[var(--pm-text)]">{user.name || "بازیکن مافیا"}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--pm-primary)]">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  {roleLabel(user.role)}
                </span>
                <span className="rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface)] px-2 py-0.5 text-[10px] font-black text-[var(--pm-muted)]">{currentLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="custom-scrollbar -mr-1 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <section key={group.key}>
              <div className="mb-1.5 flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-sm text-[var(--pm-primary)]/70">{group.icon}</span>
                <p className="text-[10px] font-black tracking-[0.18em] text-[var(--pm-muted)]">{group.label}</p>
                <span className="h-px flex-1 bg-[var(--pm-line)]" />
              </div>
              <div className="grid gap-1">{group.items.map(renderDesktopLink)}</div>
            </section>
          ))}
        </nav>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-2">
          <div className="min-w-0">
            <p className="truncate px-1 text-[11px] font-black text-[var(--pm-primary)]">{panelDate.shamsi}</p>
            <p className="truncate px-1 text-[9px] font-bold text-[var(--pm-muted)]" dir="ltr">{panelDate.miladi}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle nav />
            <form action={logoutAction}>
              <button
                type="submit"
                className="grid size-10 place-items-center rounded-[var(--radius-full)] border border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 text-[var(--pm-danger)] transition-all duration-200 hover:border-[var(--pm-danger)]/45 hover:bg-[var(--pm-danger)] hover:text-white"
                aria-label="خروج"
                title="خروج"
              >
                <span className="material-symbols-outlined text-[1.2rem] leading-none">logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ============================================ MOBILE: backdrop + sheet */}
      {mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[3px] md:hidden"
          aria-label="بستن منوی موبایل"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <section
        id="dashboard-mobile-menu"
        aria-hidden={!mobileMenuOpen}
        className={cx(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.6rem)] z-50 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--pm-line)] bg-[var(--pm-surface)]/96 text-[var(--pm-text)] shadow-[0_30px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 ease-[var(--ease-fluid)] md:hidden",
          mobileMenuOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
        )}
      >
        <div className="relative overflow-hidden border-b border-[var(--pm-line)] p-3">
          <div className="pm-hero-wash" />
          <div className="relative grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--pm-primary)]/30 bg-[var(--pm-surface)] text-sm font-black">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span>{userInitial(user.name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{user.name || "بازیکن مافیا"}</p>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--pm-primary)]">{roleLabel(user.role)}</span>
            </div>
            <button type="button" className="pm-icon-button shadow-none" aria-label="بستن منو" onClick={() => setMobileMenuOpen(false)}>
              <span className="material-symbols-outlined text-[1.2rem] leading-none">close</span>
            </button>
          </div>
          <div className="relative mt-3 grid grid-cols-2 gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 px-3 text-xs font-black text-[var(--pm-danger)] transition-all hover:border-[var(--pm-danger)]/45 hover:bg-[var(--pm-danger)] hover:text-white"
              >
                <span className="material-symbols-outlined text-lg leading-none">logout</span>
                <span>خروج</span>
              </button>
            </form>
          </div>
        </div>

        <div className="custom-scrollbar max-h-[min(54dvh,28rem)] overflow-y-auto p-3">
          {navGroups.map((group) => (
            <section key={group.key} className="motion-list mb-1">
              <div className="mb-2 mt-2 flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-sm text-[var(--pm-primary)]/70">{group.icon}</span>
                <p className="text-[10px] font-black tracking-[0.16em] text-[var(--pm-muted)]">{group.label}</p>
                <span className="h-px flex-1 bg-[var(--pm-line)]" />
              </div>
              <div className="grid gap-2">{group.items.map(renderMobileSheetLink)}</div>
            </section>
          ))}
        </div>
      </section>

      {/* ============================================ MOBILE: floating dock */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] z-50 md:hidden" aria-label="ناوبری اصلی موبایل">
        <div className="relative flex items-stretch gap-1 rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface)]/92 p-1.5 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <span className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[var(--pm-primary)]/50 to-transparent" />
          {mobilePrimaryItems.map((item) =>
            renderDockItem({
              key: item.key,
              icon: item.icon,
              label: mobileLabel(item),
              active: isActive(item),
              href: item.href,
              onClick: () => setMobileMenuOpen(false),
            })
          )}
          {renderDockItem({
            key: "more",
            icon: mobileMenuOpen ? "close" : "apps",
            label: "بیشتر",
            active: mobileMenuOpen || moreActive,
            onClick: () => setMobileMenuOpen((open) => !open),
            ariaControls: "dashboard-mobile-menu",
            ariaExpanded: mobileMenuOpen,
          })}
        </div>
      </nav>
    </>
  );
}
