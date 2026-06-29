"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePresenceSnapshot } from "@/hooks/usePresenceSnapshot";
import { getWaitingGamesSafe } from "@/actions/game";
import { getPusherClient } from "@/lib/pusher-client";
import { cx, toFa } from "@/components/ui/kit";

type ConsoleUser = { name?: string | null; image?: string | null; role?: string | null };
type Tone = "primary" | "blue" | "violet" | "warning" | "success" | "danger";
type NavItem = { key: string; href: string; label: string; description: string; icon: string; tone: Tone; group: "player" | "moderator" | "admin" };
type Props = { isAdmin: boolean; isModerator: boolean; user: ConsoleUser; logoutAction: () => Promise<void>; children: React.ReactNode };

const TONE: Record<Tone, string> = {
  primary: "var(--pm-primary)", blue: "var(--pm-blue)", violet: "var(--pm-violet)",
  warning: "var(--pm-warning)", success: "var(--pm-success)", danger: "var(--pm-danger)",
};
const FILLED = { fontVariationSettings: "'FILL' 1, 'wght' 600, 'opsz' 24" } as const;

const roleLabel = (r?: string | null) => (r === "ADMIN" ? "مدیر" : r === "MODERATOR" ? "گرداننده" : "بازیکن");
const userInitial = (n?: string | null) => (n?.trim() ? n.trim()[0] : "م");

function moduleTitle(p: string, tab: string | null) {
  if (p === "/dashboard/user") return "پیشخوان";
  if (p === "/game-guide") return "راهنمای بازی";
  if (p.startsWith("/dashboard/user/history")) return "تاریخچهٔ تو";
  if (p.startsWith("/dashboard/user/profile")) return "پروفایل";
  if (p.startsWith("/dashboard/user/requests") || p === "/dashboard/admin/requests") return "درخواست‌ها";
  if (p === "/dashboard/moderator" || p.startsWith("/dashboard/moderator/lobby")) return "اتاق کنترل";
  if (p.startsWith("/dashboard/moderator/game")) return "اتاق اجرا";
  if (p === "/dashboard/moderator/scenarios" || (p === "/dashboard/admin" && tab === "scenarios")) return "سناریوها";
  if (p === "/dashboard/admin" && (!tab || tab === "roles")) return "نقش‌ها";
  if (p === "/dashboard/admin/users") return "کاربران";
  if (p === "/dashboard/admin/history") return "آرشیو کل";
  if (p === "/dashboard/admin/backups") return "بکاپ‌ها";
  return "پنل";
}

export function ConsoleShell({ isAdmin, isModerator, user, logoutAction, children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab");
  const presence = usePresenceSnapshot();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [lobbies, setLobbies] = useState<any[]>([]);

  const scenarioHref = isAdmin ? "/dashboard/admin?tab=scenarios" : "/dashboard/moderator/scenarios";
  const title = moduleTitle(pathname, adminTab);
  const immersive = pathname.startsWith("/dashboard/moderator/game/");

  const items: NavItem[] = [
    { key: "dashboard", href: "/dashboard/user", label: "پیشخوان", description: "نمای کلی", icon: "space_dashboard", tone: "primary", group: "player" },
    { key: "history", href: "/dashboard/user/history", label: "تاریخچه", description: "نتایج و گزارش‌ها", icon: "history", tone: "violet", group: "player" },
    { key: "guide", href: "/game-guide", label: "راهنما", description: "قوانین بازی", icon: "menu_book", tone: "warning", group: "player" },
    { key: "requests", href: "/dashboard/user/requests", label: "پیشنهادها", description: "نقش و سناریو", icon: "rate_review", tone: "danger", group: "player" },
    { key: "profile", href: "/dashboard/user/profile", label: "پروفایل", description: "حساب و امنیت", icon: "account_circle", tone: "success", group: "player" },
  ];
  if (isModerator) items.push(
    { key: "moderator", href: "/dashboard/moderator", label: "اتاق کنترل", description: "ساخت و اجرای بازی", icon: "stadia_controller", tone: "warning", group: "moderator" },
    { key: "scenarios", href: scenarioHref, label: "سناریوها", description: "ترکیب نقش‌ها", icon: "account_tree", tone: "violet", group: "moderator" },
    { key: "roles", href: "/dashboard/admin?tab=roles", label: "نقش‌ها", description: "توانایی‌ها", icon: "theater_comedy", tone: "primary", group: "moderator" },
  );
  if (isAdmin) items.push(
    { key: "users", href: "/dashboard/admin/users", label: "کاربران", description: "حساب و دسترسی", icon: "group", tone: "primary", group: "admin" },
    { key: "adminRequests", href: "/dashboard/admin/requests", label: "بررسی", description: "تایید درخواست‌ها", icon: "fact_check", tone: "success", group: "admin" },
    { key: "adminHistory", href: "/dashboard/admin/history", label: "آرشیو", description: "همهٔ بازی‌ها", icon: "database_search", tone: "violet", group: "admin" },
    { key: "backups", href: "/dashboard/admin/backups", label: "بکاپ", description: "نسخه‌ها", icon: "cloud_sync", tone: "warning", group: "admin" },
  );

  const isActive = (item: NavItem) => {
    if (item.key === "dashboard") return pathname === "/dashboard/user";
    if (item.key === "history") return pathname.startsWith("/dashboard/user/history");
    if (item.key === "guide") return pathname === "/game-guide";
    if (item.key === "requests") return pathname.startsWith("/dashboard/user/requests");
    if (item.key === "profile") return pathname.startsWith("/dashboard/user/profile");
    if (item.key === "moderator") return pathname === "/dashboard/moderator" || pathname.startsWith("/dashboard/moderator/lobby") || pathname.startsWith("/dashboard/moderator/game");
    if (item.key === "scenarios") return pathname === "/dashboard/moderator/scenarios" || (pathname === "/dashboard/admin" && adminTab === "scenarios");
    if (item.key === "roles") return pathname === "/dashboard/admin" && (!adminTab || adminTab === "roles");
    if (item.key === "users") return pathname === "/dashboard/admin/users";
    if (item.key === "adminRequests") return pathname === "/dashboard/admin/requests";
    if (item.key === "adminHistory") return pathname === "/dashboard/admin/history";
    if (item.key === "backups") return pathname === "/dashboard/admin/backups";
    return false;
  };

  const groups = [
    { key: "player", label: "بازیکن", items: items.filter((i) => i.group === "player") },
    { key: "moderator", label: "گرداننده", items: items.filter((i) => i.group === "moderator") },
    { key: "admin", label: "مدیریت", items: items.filter((i) => i.group === "admin") },
  ].filter((g) => g.items.length);

  const mobileKeys = isAdmin ? ["dashboard", "users", "adminRequests", "profile"] : isModerator ? ["dashboard", "moderator", "history", "profile"] : ["dashboard", "history", "guide", "profile"];
  const mobilePrimary = mobileKeys.map((k) => items.find((i) => i.key === k)).filter((i): i is NavItem => Boolean(i));
  const mobileSet = new Set(mobilePrimary.map((i) => i.key));
  const moreActive = items.some((i) => !mobileSet.has(i.key) && isActive(i));

  useEffect(() => { setSheetOpen(false); setFeedOpen(false); }, [pathname, adminTab]);
  useEffect(() => {
    let live = true;
    const load = () => getWaitingGamesSafe(Date.now()).then((r) => { if (live) setLobbies(r.data || []); });
    load();
    const pusher = getPusherClient();
    const ch = pusher.subscribe("lobby");
    ch.bind("game-created", load); ch.bind("lobby-updated", load);
    return () => { live = false; ch.unbind("game-created", load); ch.unbind("lobby-updated", load); pusher.unsubscribe("lobby"); };
  }, []);

  const onlineFaces = presence.members.slice(0, 5);
  const capacityOf = (g: any) => g?.scenario?.roles?.reduce((s: number, r: any) => s + r.count, 0) || 0;

  if (immersive) return <div className="pm-console">{children}</div>;

  const RailItem = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label} className="group relative grid place-items-center">
        <span className={cx("grid size-11 place-items-center rounded-[var(--radius-md)] border transition-all duration-300",
          active ? "border-transparent bg-gradient-to-b from-[var(--pm-primary)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]" : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)] hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/40")}
          style={!active ? { color: TONE[item.tone] } : undefined}>
          <span className="material-symbols-outlined text-[1.3rem] leading-none" style={active ? FILLED : undefined}>{item.icon}</span>
        </span>
        <span className="pointer-events-none absolute right-[3.4rem] z-50 hidden whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-strong)] px-2.5 py-1.5 text-xs font-black text-[var(--pm-text)] shadow-[var(--pm-shadow)] group-hover:block">
          {item.label}<span className="mt-0.5 block text-[10px] font-bold text-[var(--pm-muted)]">{item.description}</span>
        </span>
      </Link>
    );
  };

  const DockItem = (o: { key: string; icon: string; label: string; active: boolean; href?: string; onClick?: () => void; ariaControls?: string; ariaExpanded?: boolean }) => {
    const inner = (
      <>
        <span className="material-symbols-outlined text-[1.45rem] leading-none" style={o.active ? FILLED : undefined}>{o.icon}</span>
        <span className={cx("overflow-hidden whitespace-nowrap text-sm font-black transition-all duration-300", o.active ? "max-w-[6rem] opacity-100" : "max-w-0 opacity-0")}>{o.label}</span>
      </>
    );
    const className = cx("group flex h-12 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] outline-none transition-all duration-[350ms] ease-[var(--ease-fluid)]",
      o.active ? "flex-[1.7] bg-gradient-to-b from-[var(--pm-primary)] to-[var(--pm-primary-strong)] px-3 text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]" : "flex-1 text-[var(--pm-muted)] hover:bg-[var(--pm-surface-soft)] hover:text-[var(--pm-text)]");
    return o.href
      ? <Link key={o.key} href={o.href} aria-current={o.active ? "page" : undefined} aria-label={o.label} className={className} onClick={o.onClick}>{inner}</Link>
      : <button key={o.key} type="button" aria-label={o.label} aria-controls={o.ariaControls} aria-expanded={o.ariaExpanded} className={className} onClick={o.onClick}>{inner}</button>;
  };

  const LiveFeed = (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
        <div className="flex items-center justify-between">
          <span className="pm-eyebrow">پشتِ میز</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[var(--pm-success)]"><span className="size-1.5 animate-pulse-slow rounded-full bg-[var(--pm-success)]" />{toFa(presence.count || 0)}</span>
        </div>
        <div className="mt-3 flex items-center">
          <div className="flex -space-x-2 space-x-reverse">
            {onlineFaces.length ? onlineFaces.map((m) => (
              <span key={m.id} className="grid size-8 place-items-center overflow-hidden rounded-full border-2 border-[var(--pm-surface)] bg-[var(--pm-surface-strong)] text-[11px] font-black text-[var(--pm-text)]">
                {m.image ? <img src={m.image} alt="" className="size-full object-cover" /> : userInitial(m.name)}
              </span>
            )) : <span className="text-xs font-bold text-[var(--pm-muted)]">کسی آنلاین نیست</span>}
          </div>
          {presence.count > onlineFaces.length && <span className="mr-2 text-xs font-black text-[var(--pm-muted)]">+{toFa(presence.count - onlineFaces.length)}</span>}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3">
        <div className="flex items-center justify-between">
          <span className="pm-eyebrow">میزهای باز</span>
          <span className="pm-chip pm-chip-primary !min-h-6 !py-0.5 text-[10px]">{toFa(lobbies.length)}</span>
        </div>
        <div className="custom-scrollbar mt-3 flex-1 space-y-2 overflow-y-auto">
          {lobbies.length === 0 ? (
            <div className="grid h-full min-h-24 place-items-center text-center"><div><span className="material-symbols-outlined text-2xl text-[var(--pm-muted)] opacity-50">bedtime</span><p className="mt-1 text-[11px] font-bold text-[var(--pm-muted)]">میزها خاموش‌اند</p></div></div>
          ) : lobbies.slice(0, 8).map((g) => {
            const cap = capacityOf(g); const joined = g._count?.players || 0;
            return (
              <Link key={g.id} href={`/lobby/${g.id}`} className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-2.5 transition-colors hover:border-[var(--pm-primary)]/40">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--pm-primary-soft)] text-[var(--pm-primary)]"><span className="material-symbols-outlined text-lg">groups</span></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-[var(--pm-text)]">{g.name}</span><span className="block truncate text-[10px] font-bold text-[var(--pm-muted)]">{g.scenario?.name || "بدون سناریو"}</span></span>
                <span className="shrink-0 font-mono text-[11px] font-black text-[var(--pm-primary)]" dir="ltr">{toFa(joined)}{cap ? `/${toFa(cap)}` : ""}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pm-console relative z-10 flex h-[100dvh] flex-col overflow-hidden" dir="rtl">
      {/* top status bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--pm-line)] bg-[var(--pm-surface)]/80 px-3 backdrop-blur-2xl sm:px-4">
        <Link href="/dashboard/user" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--pm-primary)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]"><span className="material-symbols-outlined text-[1.2rem]">playing_cards</span></span>
          <span className="hidden font-display text-lg font-bold text-[var(--pm-text)] sm:block">مافیا بورد</span>
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-[var(--pm-line)] sm:block" />
        <div className="min-w-0 flex-1"><p className="truncate font-display text-lg font-bold leading-tight text-[var(--pm-text)]">{title}</p></div>
        <span className="hidden items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--pm-muted)] sm:inline-flex"><span className="size-1.5 animate-pulse-slow rounded-full bg-[var(--pm-success)]" />{toFa(presence.count || 0)} آنلاین</span>
        <button type="button" onClick={() => setFeedOpen(true)} className="pm-icon-button size-9 shadow-none xl:hidden" aria-label="نمای زنده"><span className="material-symbols-outlined text-[1.15rem]">monitoring</span></button>
        <div className="hidden sm:block"><ThemeToggle nav /></div>
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] py-1 pl-1 pr-2.5">
          <span className="hidden text-right leading-tight md:block"><span className="block max-w-[7rem] truncate text-xs font-black text-[var(--pm-text)]">{user.name || "بازیکن"}</span><span className="block text-[10px] font-bold text-[var(--pm-primary)]">{roleLabel(user.role)}</span></span>
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--pm-primary)]/30 bg-[var(--pm-surface)] text-xs font-black text-[var(--pm-text)]">{user.image ? <img src={user.image} alt="" className="size-full object-cover" /> : userInitial(user.name)}</span>
        </div>
        <form action={logoutAction} className="hidden shrink-0 md:block"><button type="submit" aria-label="خروج" title="خروج" className="grid size-9 place-items-center rounded-[var(--radius-full)] border border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 text-[var(--pm-danger)] transition-all hover:border-[var(--pm-danger)]/45 hover:bg-[var(--pm-danger)] hover:text-[var(--pm-text-inverse)]"><span className="material-symbols-outlined text-[1.15rem]">logout</span></button></form>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-[4.75rem] shrink-0 flex-col items-center gap-2 border-l border-[var(--pm-line)] bg-[var(--pm-surface)]/55 py-3 backdrop-blur-2xl md:flex" aria-label="ماژول‌ها">
          <div className="custom-scrollbar flex flex-1 flex-col items-center gap-2 overflow-y-auto">
            {groups.map((g, gi) => (
              <div key={g.key} className="flex flex-col items-center gap-2">
                {gi > 0 && <span className="my-1 h-px w-7 bg-[var(--pm-line)]" />}
                {g.items.map(RailItem)}
              </div>
            ))}
          </div>
        </nav>

        <main className="custom-scrollbar relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="motion-page mx-auto max-w-6xl p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:p-6 md:pb-8 lg:p-8">{children}</div>
        </main>

        <aside className="hidden w-[20rem] shrink-0 border-r border-[var(--pm-line)] bg-[var(--pm-surface)]/55 p-3 backdrop-blur-2xl xl:block">{LiveFeed}</aside>
      </div>

      {/* mobile feed drawer */}
      {feedOpen && <button type="button" aria-label="بستن" className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[3px] xl:hidden" onClick={() => setFeedOpen(false)} />}
      <aside className={cx("fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] border-r border-[var(--pm-line)] bg-[var(--pm-surface)]/96 p-3 backdrop-blur-2xl transition-transform duration-300 ease-[var(--ease-fluid)] xl:hidden", feedOpen ? "translate-x-0" : "-translate-x-full")} dir="rtl">
        <div className="mb-3 flex items-center justify-between"><span className="font-display text-lg font-bold">نمای زنده</span><button type="button" onClick={() => setFeedOpen(false)} className="pm-icon-button size-9 shadow-none" aria-label="بستن"><span className="material-symbols-outlined text-lg">close</span></button></div>
        <div className="h-[calc(100%-3rem)]">{LiveFeed}</div>
      </aside>

      {/* mobile nav sheet */}
      {sheetOpen && <button type="button" aria-label="بستن" className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[3px] md:hidden" onClick={() => setSheetOpen(false)} />}
      <section className={cx("fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.6rem)] z-50 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--pm-line)] bg-[var(--pm-surface)]/96 shadow-[var(--pm-shadow)] backdrop-blur-2xl transition-all duration-300 ease-[var(--ease-fluid)] md:hidden", sheetOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0")} dir="rtl">
        <div className="custom-scrollbar max-h-[min(56dvh,30rem)] overflow-y-auto p-3">
          {groups.map((g) => (
            <section key={g.key} className="mb-1">
              <p className="mb-2 mt-2 px-1 text-[10px] font-black tracking-[0.16em] text-[var(--pm-muted)]">{g.label}</p>
              <div className="grid gap-2">
                {g.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link key={item.key} href={item.href} onClick={() => setSheetOpen(false)} aria-current={active ? "page" : undefined} className={cx("grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border p-2.5 text-right transition-all", active ? "border-[var(--pm-primary)]/40 bg-[var(--pm-primary)]/12 text-[var(--pm-primary)]" : "border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-text)]")}>
                      <span className={cx("grid size-11 place-items-center rounded-[var(--radius-sm)] border", active ? "border-transparent bg-gradient-to-b from-[var(--pm-primary)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)]" : "border-[var(--pm-line)] bg-[var(--pm-surface)]")} style={!active ? { color: TONE[item.tone] } : undefined}><span className="material-symbols-outlined text-[1.35rem] leading-none" style={active ? FILLED : undefined}>{item.icon}</span></span>
                      <span className="min-w-0"><span className="block text-sm font-black leading-6">{item.label}</span><span className="block text-[11px] font-bold text-[var(--pm-muted)]">{item.description}</span></span>
                      <span className={cx("material-symbols-outlined text-lg", active ? "text-[var(--pm-primary)]" : "text-[var(--pm-muted)]")}>{active ? "radio_button_checked" : "chevron_left"}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--pm-line)] pt-3">
            <ThemeToggle />
            <form action={logoutAction}><button type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 px-3 text-xs font-black text-[var(--pm-danger)] hover:bg-[var(--pm-danger)] hover:text-[var(--pm-text-inverse)]"><span className="material-symbols-outlined text-lg">logout</span>خروج</button></form>
          </div>
        </div>
      </section>

      {/* mobile dock */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] z-50 md:hidden" aria-label="ناوبری" dir="rtl">
        <div className="flex items-stretch gap-1 rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface)]/92 p-1.5 shadow-[var(--pm-shadow)] backdrop-blur-2xl">
          {mobilePrimary.map((item) => DockItem({ key: item.key, icon: item.icon, label: item.label, active: isActive(item), href: item.href, onClick: () => setSheetOpen(false) }))}
          {DockItem({ key: "more", icon: sheetOpen ? "close" : "apps", label: "بیشتر", active: sheetOpen || moreActive, onClick: () => setSheetOpen((o) => !o), ariaControls: "nav-sheet", ariaExpanded: sheetOpen })}
        </div>
      </nav>
    </div>
  );
}
