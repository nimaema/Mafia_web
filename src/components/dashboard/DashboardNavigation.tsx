"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  BookOpenText,
  ChatCircleText,
  Checks,
  ClockCounterClockwise,
  CloudArrowUp,
  DotsThreeOutline,
  DoorOpen,
  House,
  MaskHappy,
  SignOut,
  TreeStructure,
  UserCircle,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { MaskMark } from "@/components/brand/MaskMark";
import { Wordmark } from "@/components/brand/Wordmark";

type DashboardUser = {
  id?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  short?: string;
  icon: Icon;
  group: "player" | "moderator" | "admin";
};

type DashboardNavigationProps = {
  isAdmin: boolean;
  isModerator: boolean;
  user: DashboardUser;
  logoutAction: () => Promise<void>;
};

function roleLabel(role?: string | null) {
  if (role === "ADMIN") return "مدیر";
  if (role === "MODERATOR") return "گرداننده";
  return "بازیکن";
}

const GROUP_LABEL = { player: "بازی", moderator: "گردانندگی", admin: "مدیریت" } as const;

export function DashboardNavigation({ isAdmin, isModerator, user, logoutAction }: DashboardNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const [sheetOpen, setSheetOpen] = useState(false);

  const items: NavItem[] = [
    { key: "dashboard", href: "/dashboard/user", label: "خانه", icon: House, group: "player" },
    { key: "history", href: "/dashboard/user/history", label: "بازی‌های من", short: "بازی‌ها", icon: ClockCounterClockwise, group: "player" },
    { key: "guide", href: "/game-guide", label: "نقش‌ها و راهنما", short: "راهنما", icon: BookOpenText, group: "player" },
    { key: "requests", href: "/dashboard/user/requests", label: "پیشنهادها", icon: ChatCircleText, group: "player" },
    { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", short: "من", icon: UserCircle, group: "player" },
  ];

  if (isModerator) {
    items.push(
      { key: "moderator", href: "/dashboard/moderator", label: "لابی‌های من", short: "لابی", icon: DoorOpen, group: "moderator" },
      { key: "scenarios", href: isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios", label: "سناریوها", icon: TreeStructure, group: "moderator" },
      { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", icon: MaskHappy, group: "moderator" },
    );
  }

  if (isAdmin) {
    items.push(
      { key: "users", href: "/dashboard/admin/users", label: "کاربران", icon: UsersThree, group: "admin" },
      { key: "adminRequests", href: "/dashboard/admin/requests", label: "بررسی پیشنهادها", short: "بررسی", icon: Checks, group: "admin" },
      { key: "adminHistory", href: "/dashboard/admin/history", label: "آرشیو بازی‌ها", icon: Archive, group: "admin" },
      { key: "backups", href: "/dashboard/admin/backups", label: "پشتیبان‌گیری", icon: CloudArrowUp, group: "admin" },
    );
  }

  const isActive = (item: NavItem) => {
    switch (item.key) {
      case "dashboard":
        return pathname === "/dashboard/user";
      case "history":
        return pathname.startsWith("/dashboard/user/history");
      case "guide":
        return pathname === "/game-guide";
      case "requests":
        return pathname.startsWith("/dashboard/user/requests");
      case "profile":
        return pathname.startsWith("/dashboard/user/profile");
      case "moderator":
        return pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby") || pathname.startsWith("/dashboard/moderator/game");
      case "scenarios":
        return pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios");
      case "roles":
        return pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles");
      case "users":
        return pathname === "/dashboard/admin/users";
      case "adminRequests":
        return pathname === "/dashboard/admin/requests";
      case "adminHistory":
        return pathname === "/dashboard/admin/history";
      case "backups":
        return pathname === "/dashboard/admin/backups";
      default:
        return false;
    }
  };

  const groups = (["player", "moderator", "admin"] as const)
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length);

  const tabKeys = isAdmin ? ["dashboard", "moderator", "users", "profile"] : isModerator ? ["dashboard", "moderator", "history", "profile"] : ["dashboard", "history", "guide", "profile"];
  const tabs = tabKeys.map((key) => items.find((item) => item.key === key)).filter((item): item is NavItem => Boolean(item));
  const sheetItems = items.filter((item) => !tabKeys.includes(item.key));
  const moreActive = sheetItems.some(isActive);

  useEffect(() => setSheetOpen(false), [pathname, adminTab]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const name = user.name || "بازیکن";

  return (
    <>
      {/* Phone: top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/92 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.6rem)] backdrop-blur-xl md:hidden">
        <Link href="/dashboard/user" aria-label="نقاب، خانه">
          <Wordmark className="h-9 text-fg" title="" />
        </Link>
        <Link href="/dashboard/user/profile" aria-label={`پروفایل ${name}`}>
          <MaskAvatar seed={user.id || name} image={user.image} size="sm" />
        </Link>
      </header>

      {/* Desktop: sidebar */}
      <aside className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-l border-line bg-surface md:flex">
        <Link href="/dashboard/user" className="flex items-center gap-2.5 px-6 pb-4 pt-6" aria-label="نقاب، خانه">
          <Wordmark className="h-10 text-fg" title="" />
          <MaskMark className="h-5 text-accent" />
        </Link>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 pb-4" aria-label="ناوبری اصلی">
          {groups.map(({ group, items: groupItems }) => (
            <div key={group} className="mt-4 first:mt-1">
              {groups.length > 1 ? <p className="px-3 pb-1.5 text-xs font-bold text-faint">{GROUP_LABEL[group]}</p> : null}
              <ul className="flex flex-col gap-0.5">
                {groupItems.map((item) => {
                  const active = isActive(item);
                  const ItemIcon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-[0.8rem] px-3 text-[0.95rem] font-bold transition-colors ${
                          active ? "bg-accent-soft text-accent" : "text-muted hover:bg-raised hover:text-fg"
                        }`}
                      >
                        <ItemIcon size={20} weight={active ? "fill" : "regular"} aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-line p-4">
          <MaskAvatar seed={user.id || name} image={user.image} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{name}</p>
            <p className="text-xs font-medium text-muted">{roleLabel(user.role)}</p>
          </div>
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="nq-icon-btn hover:!text-danger" aria-label="خروج از حساب" title="خروج از حساب">
              <SignOut size={20} weight="bold" aria-hidden />
            </button>
          </form>
        </div>
      </aside>

      {/* Phone: bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="ناوبری اصلی"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((item) => {
            const active = isActive(item);
            const ItemIcon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.72rem] font-bold ${active ? "text-accent" : "text-muted"}`}
                >
                  <ItemIcon size={24} weight={active ? "fill" : "regular"} aria-hidden />
                  {item.short || item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-controls="nav-sheet"
              className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.72rem] font-bold ${moreActive ? "text-accent" : "text-muted"}`}
            >
              <DotsThreeOutline size={24} weight={moreActive ? "fill" : "regular"} aria-hidden />
              بیشتر
            </button>
          </li>
        </ul>
      </nav>

      {/* Phone: "more" sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="منوی بیشتر" id="nav-sheet">
          <button type="button" className="absolute inset-0 bg-black/50 motion-page" aria-label="بستن منو" onClick={() => setSheetOpen(false)} />
          <div className="motion-reveal absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-surface px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line-strong" aria-hidden />
            <div className="flex items-center gap-3 px-1">
              <MaskAvatar seed={user.id || name} image={user.image} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{name}</p>
                <p className="text-xs font-medium text-muted">{roleLabel(user.role)}</p>
              </div>
              <button type="button" className="nq-icon-btn" onClick={() => setSheetOpen(false)} aria-label="بستن منو">
                <X size={20} weight="bold" aria-hidden />
              </button>
            </div>

            {groups.map(({ group }) => {
              const groupSheetItems = sheetItems.filter((item) => item.group === group);
              if (!groupSheetItems.length) return null;
              return (
                <div key={group} className="mt-5">
                  <p className="px-1 pb-1.5 text-xs font-bold text-faint">{GROUP_LABEL[group]}</p>
                  <ul className="overflow-hidden rounded-[var(--radius-md)] bg-raised">
                    {groupSheetItems.map((item) => {
                      const active = isActive(item);
                      const ItemIcon = item.icon;
                      return (
                        <li key={item.key} className="border-b border-line last:border-0">
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-13 items-center gap-3 px-4 py-3 font-bold ${active ? "text-accent" : "text-fg"}`}
                          >
                            <ItemIcon size={22} weight={active ? "fill" : "regular"} aria-hidden />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
              <ThemeToggle />
              <form action={logoutAction}>
                <button type="submit" className="nq-btn nq-btn-danger w-full">
                  <SignOut size={20} weight="bold" aria-hidden />
                  خروج از حساب
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
