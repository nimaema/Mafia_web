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

type NavTone = "lime" | "sky" | "amber" | "zinc";

type NavItem = {
  key: string;
  href: string;
  label: string;
  description: string;
  icon: string;
  tone: NavTone;
};

type NavSection = {
  title: string;
  subtitle: string;
  icon: string;
  tone: NavTone;
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

function roleIcon(role?: string | null) {
  if (role === "ADMIN") return "admin_panel_settings";
  if (role === "MODERATOR") return "sports_esports";
  return "person";
}

function roleTone(role?: string | null) {
  if (role === "ADMIN") return "border-sky-400/30 bg-sky-400/15 text-sky-200";
  if (role === "MODERATOR") return "border-lime-400/30 bg-lime-400/15 text-lime-200";
  return "border-white/15 bg-white/10 text-zinc-200";
}

function userInitial(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0] : "م";
}

function toneIcon(tone: NavTone, active: boolean) {
  if (active) {
    if (tone === "sky") return "bg-sky-400 text-sky-950 shadow-sm shadow-sky-500/25";
    if (tone === "amber") return "bg-amber-300 text-amber-950 shadow-sm shadow-amber-500/25";
    if (tone === "lime") return "bg-lime-400 text-zinc-950 shadow-sm shadow-lime-500/25";
    return "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950";
  }

  if (tone === "sky") return "bg-sky-500/10 text-sky-600 group-hover:bg-sky-500 group-hover:text-white dark:text-sky-300";
  if (tone === "amber") return "bg-amber-500/10 text-amber-700 group-hover:bg-amber-400 group-hover:text-amber-950 dark:text-amber-300";
  if (tone === "lime") return "bg-lime-500/10 text-lime-700 group-hover:bg-lime-500 group-hover:text-zinc-950 dark:text-lime-300";
  return "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white dark:bg-white/[0.06] dark:text-zinc-300";
}

function toneText(tone: NavTone) {
  if (tone === "sky") return "text-sky-600 dark:text-sky-300";
  if (tone === "amber") return "text-amber-600 dark:text-amber-300";
  if (tone === "lime") return "text-lime-700 dark:text-lime-300";
  return "text-zinc-500 dark:text-zinc-400";
}

function toneBar(tone: NavTone) {
  if (tone === "sky") return "bg-sky-400";
  if (tone === "amber") return "bg-amber-300";
  if (tone === "lime") return "bg-lime-400";
  return "bg-zinc-400";
}

function activeLabel(pathname: string, adminTab: string | null) {
  if (pathname === "/dashboard/user") return "داشبورد";
  if (pathname.startsWith("/dashboard/user/history")) return "تاریخچه بازی‌ها";
  if (pathname.startsWith("/dashboard/user/profile")) return "پروفایل";
  if (pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby")) return "لابی بازی‌ها";
  if (pathname.startsWith("/dashboard/moderator/game")) return "اتاق گرداننده";
  if (pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios")) return "سناریوها";
  if (pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles")) return "نقش‌ها";
  if (pathname === "/dashboard/admin/users") return "کاربران";
  if (pathname === "/dashboard/admin/history") return "تاریخچه کل";
  if (pathname === "/dashboard/admin/backups") return "بکاپ";
  return "پنل";
}

function formatPanelDate() {
  const today = new Date();
  return {
    shamsi: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(today),
    miladi: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(today),
    shamsiCompact: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(today),
    miladiCompact: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(today),
    mobile: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      day: "numeric",
      month: "short",
    }).format(today),
    mobileMiladi: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
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

  const sections: NavSection[] = [
    {
      title: "فضای بازیکن",
      subtitle: "داشبورد، سابقه و پروفایل",
      icon: "person_pin_circle",
      tone: "lime",
      items: [
        { key: "dashboard", href: "/dashboard/user", label: "داشبورد", description: "خلاصه وضعیت و بازی‌های فعال", icon: "dashboard", tone: "lime" },
        { key: "history", href: "/dashboard/user/history", label: "تاریخچه بازی‌ها", description: "نتایج، نقش‌ها و گزارش‌ها", icon: "history", tone: "zinc" },
        { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", description: "نام، تصویر و تنظیمات حساب", icon: "person", tone: "zinc" },
      ],
    },
  ];

  if (isModerator) {
    sections.push({
      title: "گردانندگی",
      subtitle: "لابی، سناریو و اتاق اجرا",
      icon: "sports_esports",
      tone: "amber",
      items: [
        { key: "moderator", href: "/dashboard/moderator", label: "لابی بازی‌ها", description: "ساخت، شروع و مدیریت لابی", icon: "sports_esports", tone: "lime" },
        { key: "scenarios", href: scenarioHref, label: "سناریوها", description: "کتابخانه ترکیب‌های بازی", icon: "account_tree", tone: "amber" },
        { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", description: "توانایی‌ها و جبهه‌ها", icon: "theater_comedy", tone: "lime" },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "مدیریت کل",
      subtitle: "کاربران، تاریخچه و بکاپ",
      icon: "admin_panel_settings",
      tone: "sky",
      items: [
        { key: "users", href: "/dashboard/admin/users", label: "کاربران", description: "نقش، وضعیت و کنترل حساب", icon: "group", tone: "sky" },
        { key: "adminHistory", href: "/dashboard/admin/history", label: "تاریخچه کل", description: "همه بازی‌ها و گزارش‌ها", icon: "manage_history", tone: "sky" },
        { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "دیتابیس، نقش‌ها و سناریوها", icon: "database", tone: "amber" },
      ],
    });
  }

  const allItems = sections.flatMap((section) => section.items);

  const isActive = (item: NavItem) => {
    if (item.key === "dashboard") return pathname === "/dashboard/user";
    if (item.key === "history") return pathname.startsWith("/dashboard/user/history");
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

  const itemToneByKey = new Map<string, NavTone>(
    sections.flatMap((section) => section.items.map((item) => [item.key, section.tone] as const))
  );

  const renderDesktopLink = (item: NavItem) => {
    const active = isActive(item);
    const tone = itemToneByKey.get(item.key) ?? item.tone;

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "motion-nav-item group relative grid min-h-[4.35rem] grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-center gap-3 overflow-hidden rounded-2xl border px-3 text-right transition-all",
          active
            ? "border-zinc-200 bg-white text-zinc-950 shadow-lg shadow-zinc-950/10 dark:border-white/10 dark:bg-white/[0.09] dark:text-white dark:shadow-black/20"
            : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white/80 hover:text-zinc-950 hover:shadow-sm dark:text-zinc-400 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
      >
        {active && <span className={cx("absolute inset-y-3 right-0 w-1 rounded-l-full", toneBar(tone))} />}
        <span className={cx("material-symbols-outlined grid size-12 place-items-center rounded-2xl text-[1.45rem] leading-none transition-all", toneIcon(tone, active))}>
          {item.icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{item.label}</span>
          <span className="mt-1 block truncate text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{item.description}</span>
        </span>
        <span
          className={cx(
            "material-symbols-outlined text-lg transition-all",
            active ? toneText(tone) : "text-zinc-300 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-300"
          )}
        >
          chevron_left
        </span>
      </Link>
    );
  };

  const renderMobileLink = (item: NavItem) => {
    const active = isActive(item);
    const tone = itemToneByKey.get(item.key) ?? item.tone;

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "motion-nav-item group relative flex min-w-[4.9rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-all",
          active
            ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10 dark:bg-white dark:text-zinc-950"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
      >
        {active && <span className={cx("absolute top-1 h-1 w-6 rounded-full", toneBar(tone))} />}
        <span className={cx("material-symbols-outlined grid size-8 place-items-center rounded-xl text-xl leading-none transition-all", toneIcon(tone, active))}>
          {item.icon}
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="motion-page sticky top-0 z-20 hidden h-screen w-[21rem] shrink-0 flex-col border-l border-zinc-200 bg-zinc-100/90 p-3 shadow-2xl shadow-zinc-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/30 md:flex">
        <div className="motion-pop overflow-hidden rounded-[1.25rem] border border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20 dark:border-white/10">
          <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white text-lg font-black text-zinc-950 shadow-lg shadow-black/20">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="size-full object-cover" />
                  ) : (
                    <span>{userInitial(user.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user.name || "بازیکن مافیا"}</p>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-zinc-400">در حال مشاهده: {currentLabel}</p>
                </div>
              </div>
              <span className={cx("material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-xl border text-lg leading-none", roleTone(user.role))}>
                {roleIcon(user.role)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-[0.9fr_1.1fr] gap-2">
              <div className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400">دسترسی</p>
                    <p className="mt-0.5 truncate text-xs font-black text-white">{roleLabel(user.role)}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-lime-300/20 bg-lime-300/10 px-2 py-1 text-[10px] font-black text-lime-200">
                    <span className="size-1.5 rounded-full bg-lime-400" />
                    فعال
                  </span>
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-2.5 py-2">
                <span className="material-symbols-outlined grid size-8 place-items-center rounded-lg bg-white/10 text-base leading-none text-lime-200">
                  calendar_month
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-zinc-400">امروز</p>
                  <p className="mt-0.5 truncate text-xs font-black text-white">{panelDate.shamsiCompact}</p>
                  <p className="truncate text-[10px] font-bold text-zinc-400" dir="ltr">{panelDate.miladiCompact}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar motion-list mt-3 flex flex-1 flex-col gap-3 overflow-y-auto rounded-[1.25rem] border border-zinc-200 bg-white/75 p-2.5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.035]">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 dark:border-white/10 dark:bg-zinc-950/45">
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-zinc-200 bg-white/70 px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.035]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cx("h-7 w-1 rounded-full", toneBar(section.tone))} />
                  <span className={cx("material-symbols-outlined grid size-7 place-items-center text-base leading-none", toneText(section.tone))}>
                    {section.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-black text-zinc-950 dark:text-white">{section.title}</span>
                    <span className="mt-0.5 block truncate text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{section.subtitle}</span>
                  </span>
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[9px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-400">
                  {section.items.length} مورد
                </span>
              </div>
              <div className="grid gap-1.5">{section.items.map(renderDesktopLink)}</div>
            </section>
          ))}
        </nav>

        <div className="motion-reveal mt-3 rounded-[1.25rem] border border-zinc-200 bg-white/75 p-2 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.035]">
          <ThemeToggle />
          <form action={logoutAction} className="mt-1.5 w-full">
            <button
              type="submit"
              className="group grid w-full grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-2.5 rounded-xl border border-red-500/15 bg-white/80 px-2.5 py-2 text-xs font-black text-red-600 shadow-sm shadow-zinc-950/5 transition-all hover:border-red-500/30 hover:bg-red-500 hover:text-white dark:bg-white/[0.04] dark:text-red-300 dark:hover:bg-red-500"
            >
              <span className="material-symbols-outlined grid size-8 place-items-center rounded-lg bg-red-500/10 text-base leading-none transition-all group-hover:bg-white/15">logout</span>
              <span className="min-w-0 truncate text-right">خروج از سیستم</span>
              <span className="material-symbols-outlined grid size-5 place-items-center text-sm leading-none opacity-50">chevron_left</span>
            </button>
          </form>
        </div>
      </aside>

      <nav className="motion-pop fixed bottom-3 left-3 right-3 z-50 overflow-hidden rounded-[1.4rem] border border-zinc-200/80 bg-white/[0.96] shadow-2xl shadow-zinc-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.96] md:hidden">
        <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-300" />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-zinc-200/70 px-3 py-2 dark:border-white/10">
          <span className="truncate text-xs font-black text-zinc-950 dark:text-white">{currentLabel}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300">
              {panelDate.mobile}
            </span>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black text-sky-700 dark:text-sky-300" dir="ltr">
              {panelDate.mobileMiladi}
            </span>
          </span>
        </div>
        <div className="custom-scrollbar flex h-[5.55rem] items-stretch gap-1 overflow-x-auto px-2 py-2">
          {allItems.map(renderMobileLink)}
          <ThemeToggle nav />
          <form action={logoutAction} className="min-w-[4.9rem]">
            <button
              type="submit"
              className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-red-500 transition-all hover:bg-red-500/10 hover:text-red-600 dark:text-red-300"
            >
              <span className="material-symbols-outlined grid size-8 place-items-center rounded-xl bg-red-500/10 text-xl leading-none">logout</span>
              <span className="w-full truncate text-[10px] font-black leading-4">خروج</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
