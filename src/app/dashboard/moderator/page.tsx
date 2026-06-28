"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, getModeratorGamesSafe, cancelGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { getPusherClient } from "@/lib/pusher-client";
import { SeatRing } from "@/components/game/SeatRing";

const toFa = (n: number) => Number(n).toLocaleString("fa-IR");

function statusLabel(status: string) {
  if (status === "WAITING") return "در انتظار";
  if (status === "IN_PROGRESS") return "در جریان";
  return "بسته شده";
}

function scenarioCapacity(game: any) {
  return game.scenario?.roles?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
}

function statusIcon(status: string) {
  if (status === "IN_PROGRESS") return "sports_esports";
  if (status === "WAITING") return "groups";
  return "inventory_2";
}

function statusTone(status: string) {
  if (status === "IN_PROGRESS") return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (status === "WAITING") return "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]";
  return "border-zinc-500/20 bg-zinc-500/10 text-[var(--pm-muted)]";
}

export default function ModeratorDashboard() {
  const router = useRouter();
  const { showAlert, showConfirm, showToast } = usePopup();
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [telegramJoinEnabled, setTelegramJoinEnabled] = useState(true);
  const [filter, setFilter] = useState<"all" | "WAITING" | "IN_PROGRESS" | "READY">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    refreshGames();

    const pusher = getPusherClient();
    const channel = pusher.subscribe("lobby");
    channel.bind("game-created", refreshGames);
    channel.bind("lobby-updated", refreshGames);

    return () => {
      channel.unbind("game-created", refreshGames);
      channel.unbind("lobby-updated", refreshGames);
      pusher.unsubscribe("lobby");
    };
  }, []);

  const refreshGames = async () => {
    setIsRefreshing(true);
    setErrorMessage("");
    try {
      const result = await getModeratorGamesSafe(Date.now());
      setActiveGames(result.data);
      if (!result.success) setErrorMessage(result.error || "لیست بازی‌ها بارگذاری نشد.");
    } catch (error) {
      console.error(error);
      setErrorMessage("لیست بازی‌ها بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی را بررسی کنید.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGame = async () => {
    const lobbyName = name.trim();
    const lobbyPassword = isPrivate ? password.trim() : "";

    if (isPrivate && !lobbyPassword) {
      showAlert("رمز لابی", "برای لابی خصوصی یک رمز کوتاه وارد کنید.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await createGame(lobbyName, lobbyPassword, telegramJoinEnabled);
      if (res.success) {
        setShowCreateModal(false);
        setName("");
        setPassword("");
        setIsPrivate(false);
        setTelegramJoinEnabled(true);
        router.push(`/dashboard/moderator/lobby/${res.gameId}`);
      } else {
        showAlert("خطا", res.error || "خطا در ایجاد بازی", "error");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showAlert("خطا", "ایجاد لابی ناموفق بود. اتصال سرور و دیتابیس را بررسی کنید.", "error");
      setLoading(false);
    }
  };

  const handleCancelGame = async (gameId: string) => {
    showConfirm("لغو بازی", "آیا از لغو و حذف این لابی اطمینان دارید؟", async () => {
      try {
        const res = await cancelGame(gameId);
        if (res.success) {
          refreshGames();
          showToast("لابی با موفقیت لغو شد", "success");
        } else {
          showAlert("خطا", res.error || "خطا در لغو بازی", "error");
        }
      } catch (error) {
        console.error(error);
        showAlert("خطا", "خطای شبکه", "error");
      }
    }, "error");
  };

  const waitingGames = activeGames.filter((game) => game.status === "WAITING").length;
  const inProgressGames = activeGames.filter((game) => game.status === "IN_PROGRESS").length;
  const protectedGames = activeGames.filter((game) => game.password).length;
  const totalPlayers = activeGames.reduce((sum, game) => sum + (game._count?.players || 0), 0);
  const readyGames = activeGames.filter((game) => {
    const capacity = scenarioCapacity(game);
    return game.status === "WAITING" && capacity > 0 && (game._count?.players || 0) === capacity;
  }).length;
  const featuredGame = activeGames.find((game) => game.status === "IN_PROGRESS") || activeGames.find((game) => game.status === "WAITING") || activeGames[0];
  const stats = [
    { label: "لابی‌ها", value: activeGames.length, icon: "dashboard", tone: "text-[var(--pm-primary)]" },
    { label: "بازیکن‌ها", value: totalPlayers, icon: "group", tone: "text-sky-300" },
    { label: "آماده شروع", value: readyGames, icon: "task_alt", tone: "text-amber-300" },
    { label: "در جریان", value: inProgressGames, icon: "bolt", tone: "text-violet-300" },
  ];

  const isGameReady = (game: any) => {
    const capacity = scenarioCapacity(game);
    return game.status === "WAITING" && capacity > 0 && (game._count?.players || 0) === capacity;
  };
  const filterTabs: Array<{ key: typeof filter; label: string; count: number }> = [
    { key: "all", label: "همه", count: activeGames.length },
    { key: "WAITING", label: "در انتظار", count: waitingGames },
    { key: "READY", label: "آماده", count: readyGames },
    { key: "IN_PROGRESS", label: "در جریان", count: inProgressGames },
  ];
  const visibleGames = activeGames.filter((game) => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = `${game.name || ""} ${game.code || ""} ${game.scenario?.name || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filter === "all") return true;
    if (filter === "READY") return isGameReady(game);
    return game.status === filter;
  });

  return (
    <div className="flex flex-col gap-5 font-sans" dir="rtl">
      <section className="pm-contrast-surface relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-zinc-950 text-white shadow-xl shadow-zinc-950/10 dark:border-[var(--pm-line)]">
        <div className="pm-hero-wash" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
        <div className="relative p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--pm-primary)] text-zinc-950 shadow-sm shadow-[var(--pm-primary)]/30 sm:size-14">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">sports_esports</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pm-primary)]">مرکز گردانندگی</p>
                <h1 className="mt-1 line-clamp-2 break-words text-2xl font-black leading-8 sm:text-3xl sm:leading-10">اتاق کنترل بازی‌ها</h1>
                <p className="mt-2 line-clamp-2 max-w-2xl text-xs font-bold leading-6 text-zinc-300 sm:text-sm">
                  لابی‌ها، سناریوها و بازی‌های در جریان را از یک نمای زنده و مرتب کنترل کنید.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <button onClick={() => setShowCreateModal(true)} className="pm-button-primary min-h-10 px-3 text-xs sm:px-4">
                <span className="material-symbols-outlined text-lg">add_circle</span>
                لابی جدید
              </button>
              <button onClick={refreshGames} className="pm-button-secondary min-h-10 border-[var(--pm-line)] bg-white/10 px-3 text-xs text-white hover:bg-white hover:text-zinc-950" disabled={isRefreshing}>
                <span className={`material-symbols-outlined text-lg ${isRefreshing ? "animate-spin" : ""}`}>sync</span>
                همگام‌سازی
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="grid min-w-[560px] grid-cols-4 gap-2 sm:min-w-0">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--pm-line)] bg-white/10 p-3 backdrop-blur">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`material-symbols-outlined text-xl ${item.tone}`}>{item.icon}</span>
                      <span className="text-xl font-black text-white">{item.value}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-black text-zinc-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--pm-line)] bg-white/10 p-3 backdrop-blur">
              {featuredGame ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-[var(--pm-primary)]">{featuredGame.status === "IN_PROGRESS" ? "بازی در جریان" : "لابی بعدی"}</p>
                    <p className="mt-1 truncate text-sm font-black text-white">{featuredGame.name}</p>
                    <p className="mt-1 truncate text-[10px] font-bold text-zinc-300">{featuredGame.scenario?.name || "سناریو انتخاب نشده"}</p>
                  </div>
                  <Link
                    href={featuredGame.status === "WAITING" ? `/dashboard/moderator/lobby/${featuredGame.id}` : `/dashboard/moderator/game/${featuredGame.id}`}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-3 text-xs font-black text-[var(--pm-text)] transition-colors hover:border-[var(--pm-primary)]/40 hover:bg-[var(--pm-primary)]/10 hover:text-[var(--pm-primary)]"
                  >
                    ورود
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">لابی فعالی نیست</p>
                    <p className="mt-1 text-[10px] font-bold text-zinc-300">برای شروع، یک لابی تازه بسازید.</p>
                  </div>
                  <button onClick={() => setShowCreateModal(true)} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pm-primary)] px-3 text-xs font-black text-zinc-950">
                    ساخت
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/75 backdrop-blur-xl sm:items-center">
          <div className="pm-safe-modal relative flex w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white shadow-2xl shadow-black/30 dark:border-[var(--pm-line)] dark:bg-zinc-950">
            <div className="pm-contrast-surface relative overflow-hidden border-b border-[var(--pm-line)] bg-zinc-950 p-4 text-white sm:p-5">
              <div className="pm-hero-wash" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pm-primary)]">راه‌اندازی لابی</p>
                  <h2 className="mt-1 text-2xl font-black text-white">تنظیم بازی جدید</h2>
                  <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-zinc-300">
                    ابتدا اتاق انتظار ساخته می‌شود؛ سناریو، توانایی‌ها و شروع بازی در مرحله بعد تنظیم می‌شوند.
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-white/10 text-white transition-colors hover:bg-white hover:text-zinc-950">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <div className="custom-scrollbar grid flex-1 gap-4 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50/70 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-[var(--pm-muted)]">نام لابی</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="مثلا: بازی جمعه شب"
                    />
                  </label>
                  <p className="mt-2 text-[10px] font-bold leading-5 text-[var(--pm-muted)]">اگر خالی بماند، نام کوتاه خودکار ساخته می‌شود.</p>
                </div>

                <div className="rounded-lg border border-[var(--pm-line)] bg-white p-3 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/60">
                  <p className="text-xs font-black text-[var(--pm-muted)]">نوع ورود</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`relative overflow-hidden rounded-lg border p-4 text-right transition-all ${
                        !isPrivate
                          ? "border-[var(--pm-primary)]/40 bg-[var(--pm-primary)]/10 text-zinc-950 shadow-sm shadow-lime-500/15 dark:text-white"
                          : "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] hover:bg-white dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]"
                      }`}
                    >
                      {!isPrivate && <span className="absolute inset-x-0 top-0 h-1 bg-[var(--pm-primary)]" />}
                      <span className="material-symbols-outlined text-xl">lock_open</span>
                      <span className="mt-2 block text-sm font-black">باز</span>
                      <span className="mt-1 block text-xs leading-5">ورود با کد لابی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`relative overflow-hidden rounded-lg border p-4 text-right transition-all ${
                        isPrivate
                          ? "border-amber-500/40 bg-amber-500/10 text-zinc-950 shadow-sm shadow-amber-500/15 dark:text-white"
                          : "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] hover:bg-white dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]"
                      }`}
                    >
                      {isPrivate && <span className="absolute inset-x-0 top-0 h-1 bg-amber-400" />}
                      <span className="material-symbols-outlined text-xl">lock</span>
                      <span className="mt-2 block text-sm font-black">خصوصی</span>
                      <span className="mt-1 block text-xs leading-5">کد همراه رمز</span>
                    </button>
                  </div>
                </div>

                {isPrivate && (
                  <label className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">رمز ورود</span>
                    <input
                      type="text"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="یک رمز کوتاه برای بازیکنان"
                      dir="ltr"
                    />
                  </label>
                )}

                <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[var(--pm-text)]">ورود از تلگرام</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-sky-700 dark:text-sky-300">
                        بازیکنان لینک‌شده می‌توانند با ربات و کد لابی وارد شوند.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTelegramJoinEnabled((value) => !value)}
                      className={`min-h-10 shrink-0 rounded-lg border px-3 text-xs font-black transition-all ${
                        telegramJoinEnabled
                          ? "border-sky-500/30 bg-sky-500 text-white"
                          : "border-[var(--pm-line)] bg-white text-[var(--pm-muted)] dark:bg-zinc-950"
                      }`}
                    >
                      <span className="material-symbols-outlined align-middle text-base">{telegramJoinEnabled ? "toggle_on" : "toggle_off"}</span>
                      {telegramJoinEnabled ? "فعال" : "غیرفعال"}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="h-fit rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-4 shadow-[var(--pm-shadow-soft)]">
                <p className="font-black text-[var(--pm-text)]">جریان بعد از ساخت</p>
                <div className="mt-4 grid gap-2">
                  {[
                    { icon: "tag", text: "کد ورود خودکار ساخته می‌شود." },
                    { icon: "account_tree", text: "سناریو را در صفحه لابی انتخاب می‌کنید." },
                    { icon: "groups", text: "بازیکنان به صورت زنده دیده می‌شوند." },
                  ].map((item) => (
                    <div key={item.text} className="flex gap-2 rounded-lg border border-[var(--pm-line)] bg-white/80 p-3 text-sm text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-zinc-300">
                      <span className="material-symbols-outlined text-lg text-[var(--pm-primary)] dark:text-[var(--pm-primary)]">{item.icon}</span>
                      <span className="leading-6">{item.text}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="sticky bottom-0 border-t border-[var(--pm-line)] bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] dark:border-[var(--pm-line)] dark:bg-zinc-950/95 sm:p-5">
              <button onClick={handleCreateGame} disabled={loading} className="pm-button-primary min-h-12 w-full text-base">
                <span className={`material-symbols-outlined text-xl ${loading ? "animate-spin" : ""}`}>
                  {loading ? "progress_activity" : "bolt"}
                </span>
                ساخت و ورود به لابی
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="pm-card rounded-[var(--radius-xl)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="pm-eyebrow">اتاق‌های فعال</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold text-[var(--pm-text)]">لابی‌ها و بازی‌های شما</h2>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="pm-button-primary ms-cta min-h-11 px-4 text-sm">
            <span className="material-symbols-outlined text-lg">add</span>
            لابی تازه
          </button>
        </div>

        {/* filter tabs + search */}
        {activeGames.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="custom-scrollbar -mx-1 flex gap-1.5 overflow-x-auto rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-1">
              {filterTabs.map((tab) => {
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-black transition-all duration-200 ${
                      active ? "bg-gradient-to-b from-[var(--pm-primary-strong)] to-[var(--pm-primary)] text-[var(--pm-text-inverse)] shadow-[0_6px_16px_-8px_var(--pm-primary-glow)]" : "text-[var(--pm-muted)] hover:bg-[var(--pm-surface)] hover:text-[var(--pm-text)]"
                    }`}
                  >
                    {tab.label}
                    <span className={`grid min-w-5 place-items-center rounded-full px-1 text-[10px] ${active ? "bg-black/15 text-[var(--pm-text-inverse)]" : "bg-[var(--pm-surface)] text-[var(--pm-muted)]"}`}>{toFa(tab.count)}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative lg:w-64">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--pm-muted)]">search</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی نام، کد یا سناریو…" className="!min-h-11 !pl-10 text-sm" dir="rtl" />
            </div>
          </div>
        )}

        <div className="mt-5">
          {errorMessage ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/[0.06] p-8 text-center">
              <span className="grid size-16 place-items-center rounded-[var(--radius-md)] border border-[var(--pm-danger)]/25 bg-[var(--pm-danger)]/10 text-[var(--pm-danger)]">
                <span className="material-symbols-outlined text-3xl">cloud_off</span>
              </span>
              <div>
                <p className="font-display text-xl font-bold text-[var(--pm-text)]">بارگذاری لابی‌ها ناموفق بود</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-[var(--pm-muted)]">{errorMessage}</p>
              </div>
              <button onClick={refreshGames} className="pm-button-primary"><span className="material-symbols-outlined text-xl">refresh</span>تلاش دوباره</button>
            </div>
          ) : activeGames.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-8 text-center">
              <span className="grid size-20 place-items-center rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface)] text-[var(--pm-muted)]">
                <span className="material-symbols-outlined text-4xl">playing_cards</span>
              </span>
              <div>
                <p className="font-display text-xl font-bold text-[var(--pm-text)]">هنوز میزی نچیده‌ای</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--pm-muted)]">یک لابی بساز تا کدِ ورود و صفحهٔ انتظار آماده شود و بازیکن‌ها سرِ میز بنشینند.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="pm-button-primary ms-cta"><span className="material-symbols-outlined text-xl">add</span>اولین میز را بچین</button>
            </div>
          ) : visibleGames.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--pm-muted)] opacity-50">filter_list_off</span>
              <p className="font-black text-[var(--pm-text)]">میزی با این فیلتر نیست</p>
              <button onClick={() => { setFilter("all"); setQuery(""); }} className="pm-button-secondary min-h-10 px-4 text-xs">پاک‌کردن فیلتر</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visibleGames.map((game) => {
                const capacity = scenarioCapacity(game);
                const players = game._count?.players || 0;
                const isInProgress = game.status === "IN_PROGRESS";
                const isReady = isGameReady(game);
                const seatPlayers = Array.from({ length: Math.min(players, capacity || players) }, () => ({ name: "" }));
                const accent = isInProgress ? "var(--pm-blue)" : isReady ? "var(--pm-warning)" : "var(--pm-primary)";
                const statusWord = isInProgress ? "در جریان" : isReady ? "آماده" : "انتظار";

                return (
                  <article key={game.id} className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/40 hover:shadow-[var(--pm-shadow)]">
                    <span className="absolute inset-y-0 right-0 w-[3px]" style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)` }} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-black" style={{ borderColor: `color-mix(in oklab, ${accent} 35%, transparent)`, background: `color-mix(in oklab, ${accent} 12%, transparent)`, color: accent }}>
                        <span className="material-symbols-outlined text-sm">{statusIcon(game.status)}</span>
                        {statusWord}
                      </span>
                      <span className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-2.5 py-1 font-mono text-[11px] font-black text-[var(--pm-primary)]" dir="ltr">#{game.code}</span>
                    </div>

                    <SeatRing
                      capacity={capacity || undefined}
                      players={seatPlayers}
                      className="my-3 !max-w-[8.5rem]"
                      center={
                        <div>
                          <p className="font-display text-2xl font-bold text-[var(--pm-text)]" dir="ltr">{toFa(players)}{capacity ? <span className="text-[var(--pm-muted)]">/{toFa(capacity)}</span> : null}</p>
                          <p className="text-[10px] font-bold text-[var(--pm-muted)]">{capacity ? (isReady ? "تکمیل" : `${toFa(Math.max(capacity - players, 0))} مانده`) : "بدون سناریو"}</p>
                        </div>
                      }
                    />

                    <h3 className="truncate text-center font-display text-lg font-bold text-[var(--pm-text)]">{game.name}</h3>
                    <p className="mt-0.5 truncate text-center text-xs font-bold text-[var(--pm-muted)]">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>

                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      <span className={`pm-chip ${game.password ? "pm-chip-warning" : ""} !min-h-7 !py-1 text-[10px]`}>
                        <span className="material-symbols-outlined text-sm">{game.password ? "lock" : "lock_open"}</span>
                        {game.password ? "خصوصی" : "باز"}
                      </span>
                      <span className={`pm-chip ${game.telegramJoinEnabled ? "pm-chip-primary" : ""} !min-h-7 !py-1 text-[10px]`}>
                        <span className="material-symbols-outlined text-sm">send</span>
                        {game.telegramJoinEnabled ? "تلگرام" : "بی‌تلگرام"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2">
                      <Link
                        href={game.status === "WAITING" ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`}
                        className="pm-button-primary min-h-11 w-full"
                      >
                        <span className="material-symbols-outlined text-xl">{isInProgress ? "play_arrow" : "tune"}</span>
                        {isInProgress ? "ادامهٔ اتاق" : "مدیریت میز"}
                      </Link>
                      <button onClick={() => handleCancelGame(game.id)} className="pm-button-danger min-h-11 w-full px-0" title="لغو لابی" aria-label="لغو لابی">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
