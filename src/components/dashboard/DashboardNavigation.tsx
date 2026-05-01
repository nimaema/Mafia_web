"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  icon: string;
  tone: "lime" | "sky" | "zinc";
};

type NavSection = {
  title: string;
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

function userInitial(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0] : "م";
}

function iconTone(tone: NavItem["tone"], active: boolean) {
  if (active) {
    if (tone === "sky") return "bg-sky-400 text-sky-950 shadow-sm shadow-sky-500/25";
    if (tone === "lime") return "bg-lime-400 text-zinc-950 shadow-sm shadow-lime-500/25";
    return "bg-zinc-200 text-zinc-950 dark:bg-zinc-100";
  }

  if (tone === "sky") return "bg-sky-500/10 text-sky-600 group-hover:bg-sky-500 group-hover:text-white dark:text-sky-300";
  if (tone === "lime") return "bg-lime-500/10 text-lime-700 group-hover:bg-lime-500 group-hover:text-zinc-950 dark:text-lime-300";
  return "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-950 group-hover:text-white dark:bg-white/[0.06] dark:text-zinc-300";
}

function activeDot(tone: NavItem["tone"]) {
  if (tone === "sky") return "bg-sky-400";
  if (tone === "lime") return "bg-lime-400";
  return "bg-zinc-400";
}

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";

  const sections: NavSection[] = [
    {
      title: "فضای بازیکن",
      items: [
        { key: "dashboard", href: "/dashboard/user", label: "داشبورد", icon: "dashboard", tone: "lime" },
        { key: "history", href: "/dashboard/user/history", label: "تاریخچه بازی‌ها", icon: "history", tone: "zinc" },
        { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", icon: "person", tone: "zinc" },
      ],
    },
  ];

  if (isModerator) {
    sections.push({
      title: "گردانندگی",
      items: [
        { key: "moderator", href: "/dashboard/moderator", label: "لابی بازی‌ها", icon: "sports_esports", tone: "lime" },
        { key: "scenarios", href: scenarioHref, label: "سناریوها", icon: "account_tree", tone: "lime" },
        { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", icon: "theater_comedy", tone: "lime" },
      ],
    });
  }

  if (isAdmin) {
    sections.push({
      title: "مدیریت کل",
      items: [
        { key: "users", href: "/dashboard/admin/users", label: "کاربران", icon: "group", tone: "sky" },
        { key: "adminHistory", href: "/dashboard/admin/history", label: "تاریخچه کل", icon: "manage_history", tone: "sky" },
        { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", icon: "database", tone: "sky" },
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

  const renderDesktopLink = (item: NavItem) => {
    const active = isActive(item);

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-black transition-all",
          active
            ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950 dark:shadow-black/20"
            : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
      >
        <span className={cx("material-symbols-outlined flex size-9 items-center justify-center rounded-lg text-xl transition-all", iconTone(item.tone, active))}>
          {item.icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <span className={cx("size-2 rounded-full transition-opacity", active ? activeDot(item.tone) : "bg-transparent opacity-0 group-hover:bg-zinc-300 group-hover:opacity-100")} />
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
          "group flex min-w-[4.7rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition-all",
          active
            ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10 dark:bg-white dark:text-zinc-950"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
      >
        <span className={cx("material-symbols-outlined flex size-8 items-center justify-center rounded-lg text-xl transition-all", iconTone(item.tone, active))}>
          {item.icon}
        </span>
        <span className="w-full truncate text-[10px] font-black leading-4">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="sticky top-0 z-20 hidden h-screen w-[19rem] shrink-0 flex-col border-l border-zinc-200/80 bg-zinc-50/90 p-4 shadow-2xl shadow-zinc-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.92] dark:shadow-black/25 md:flex">
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 text-lg font-black text-white dark:border-white/10 dark:bg-white dark:text-zinc-950">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="size-full object-cover" />
                ) : (
                  <span>{userInitial(user.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-zinc-950 dark:text-white">{user.name || "بازیکن مافیا"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-lime-500 shadow-sm shadow-lime-500/50" />
                  <span className="truncate text-xs font-bold text-zinc-500 dark:text-zinc-400">{roleLabel(user.role)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950/70">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined flex size-9 items-center justify-center rounded-lg bg-lime-500 text-xl text-zinc-950">theater_comedy</span>
                  <div>
                    <p className="text-sm font-black text-zinc-950 dark:text-white">مافیا بورد</p>
                    <p className="mt-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">کنترل بازی</p>
                  </div>
                </div>
                <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300">
                  فعال
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar mt-4 flex flex-1 flex-col gap-5 overflow-y-auto pb-2 pl-1">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="flex items-center gap-2 px-2">
                <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
                <p className="shrink-0 text-[10px] font-black text-zinc-400 dark:text-zinc-500">{section.title}</p>
              </div>
              {section.items.map(renderDesktopLink)}
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-zinc-200 pt-4 dark:border-white/10">
          <ThemeToggle />
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-lg border border-red-500/15 bg-red-500/10 px-3 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-500 hover:text-white dark:text-red-300"
            >
              <span className="material-symbols-outlined flex size-9 items-center justify-center rounded-lg bg-red-500/10 text-xl transition-all group-hover:bg-white/15">logout</span>
              <span className="flex-1 text-right">خروج از سیستم</span>
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-50 overflow-hidden rounded-lg border border-zinc-200/80 bg-white/[0.92] shadow-2xl shadow-zinc-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.92] md:hidden">
        <div className="h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
        <div className="custom-scrollbar flex h-[5.25rem] items-stretch gap-1 overflow-x-auto px-2 py-2">
          {allItems.map(renderMobileLink)}
          <ThemeToggle nav />
          <form action={logoutAction} className="min-w-[4.7rem]">
            <button
              type="submit"
              className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-red-500 transition-all hover:bg-red-500/10 hover:text-red-600 dark:text-red-300"
            >
              <span className="material-symbols-outlined flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-xl">logout</span>
              <span className="w-full truncate text-[10px] font-black leading-4">خروج</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
