"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, getModeratorGamesSafe, cancelGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { getPusherClient } from "@/lib/pusher-client";

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
      const res = await createGame(lobbyName, lobbyPassword);
      if (res.success) {
        setShowCreateModal(false);
        setName("");
        setPassword("");
        setIsPrivate(false);
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

  return (
    <div className="flex flex-col gap-5 font-sans" dir="rtl">
      <section className="pm-contrast-surface relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-zinc-950 text-white shadow-xl shadow-zinc-950/10 dark:border-[var(--pm-line)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.28),transparent_24rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_20rem)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-cyan-400 via-sky-400 to-amber-400" />
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
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-white px-3 text-xs font-black text-zinc-950 transition-colors hover:bg-cyan-300"
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
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.3),transparent_22rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_18rem)]" />
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
                          ? "border-cyan-500/40 bg-[var(--pm-primary)]/10 text-zinc-950 shadow-sm shadow-cyan-500/15 dark:text-white"
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
              </div>

              <aside className="h-fit rounded-lg border border-[var(--pm-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#ecfeff_100%)] p-4 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.9)_0%,rgba(9,9,11,0.96)_60%,rgba(0,168,150,0.18)_100%)]">
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

      <section className="relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_56%,#eff6ff_100%)] shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.9)_0%,rgba(9,9,11,0.96)_60%,rgba(12,74,110,0.18)_100%)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-sky-400 via-cyan-400 to-amber-400" />
        <div className="flex flex-col gap-3 border-b border-[var(--pm-line)]/80 p-4 dark:border-[var(--pm-line)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">اتاق‌های فعال</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">لابی‌ها و بازی‌های شما</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black">
              <span className="rounded-lg border border-[var(--pm-line)] bg-white px-2.5 py-1 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-zinc-300">{waitingGames} در انتظار</span>
              <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-700 dark:text-sky-300">{inProgressGames} در جریان</span>
              <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">{protectedGames} خصوصی</span>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="pm-button-primary min-h-10 px-3 text-xs">
            <span className="material-symbols-outlined text-lg">add</span>
            ساخت لابی
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {errorMessage ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-red-500/20 bg-red-500/5 p-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500">
                <span className="material-symbols-outlined text-3xl">cloud_off</span>
              </div>
              <div>
                <p className="text-xl font-black text-[var(--pm-text)]">بارگذاری لابی‌ها ناموفق بود</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--pm-muted)]">{errorMessage}</p>
              </div>
              <button onClick={refreshGames} className="pm-button-primary">
                <span className="material-symbols-outlined text-xl">refresh</span>
                تلاش دوباره
              </button>
            </div>
          ) : activeGames.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-[var(--pm-line)] bg-white/70 p-8 text-center dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div className="flex size-20 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                <span className="material-symbols-outlined text-4xl text-[var(--pm-muted)]">videogame_asset_off</span>
              </div>
              <div>
                <p className="text-xl font-black text-[var(--pm-text)]">هنوز لابی فعالی ندارید</p>
                <p className="mt-2 text-sm text-[var(--pm-muted)]">یک لابی بسازید تا کد ورود و صفحه انتظار آماده شود.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="pm-button-primary">ایجاد اولین لابی</button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {activeGames.map((game) => {
                const capacity = scenarioCapacity(game);
                const players = game._count?.players || 0;
                const progress = capacity > 0 ? Math.min(100, Math.round((players / capacity) * 100)) : 0;
                const isInProgress = game.status === "IN_PROGRESS";
                const isReady = game.status === "WAITING" && capacity > 0 && players === capacity;
                const tone = statusTone(game.status);
                const progressText = capacity ? (isReady ? "ظرفیت تکمیل" : `${Math.max(capacity - players, 0)} نفر تا تکمیل`) : "سناریو انتخاب نشده";

                return (
                  <article key={game.id} className="group relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white/90 p-4 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/30 hover:shadow-xl hover:shadow-zinc-950/10 dark:border-[var(--pm-line)] dark:bg-zinc-950/70 dark:hover:bg-zinc-950">
                    <div className={`absolute inset-x-0 top-0 h-1 ${isInProgress ? "bg-sky-500" : isReady ? "bg-amber-400" : "bg-[var(--pm-primary)]"}`} />
                    <div className={`absolute inset-y-0 right-0 w-1 ${isInProgress ? "bg-sky-500" : isReady ? "bg-amber-400" : "bg-[var(--pm-primary)]"}`} />
                    <div className="flex items-start justify-between gap-4 pt-1">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                          <span className="material-symbols-outlined text-2xl">{statusIcon(game.status)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-[var(--pm-muted)]">{isInProgress ? "بازی در جریان" : isReady ? "آماده شروع" : "اتاق انتظار"}</p>
                          <h2 className="mt-1 line-clamp-2 break-words text-lg font-black leading-6 text-[var(--pm-text)]">{game.name}</h2>
                          <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--pm-muted)]">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-zinc-950 px-2.5 py-1 font-mono text-[10px] font-black text-white dark:bg-white dark:text-zinc-950">
                        #{game.code}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { label: statusLabel(game.status), icon: statusIcon(game.status), className: tone },
                        { label: `${players}${capacity ? `/${capacity}` : ""}`, icon: "group", className: "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-zinc-300" },
                        { label: game.password ? "خصوصی" : "باز", icon: game.password ? "lock" : "lock_open", className: game.password ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-zinc-300" },
                      ].map((item) => (
                        <div key={item.label} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black ${item.className}`}>
                          <span className="material-symbols-outlined block text-base">{item.icon}</span>
                          <span className="mt-1 block truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-[var(--pm-line)] bg-zinc-50/80 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-[var(--pm-muted)]">
                        <span>پیشرفت ظرفیت</span>
                        <span className={isReady ? "text-amber-700 dark:text-amber-300" : "text-[var(--pm-muted)]"}>{progressText}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 ring-1 ring-zinc-950/5 dark:bg-white/10 dark:ring-white/10">
                        <div className={`h-full rounded-full transition-[width] ${isInProgress ? "bg-sky-500" : isReady ? "bg-amber-400" : "bg-gradient-to-l from-cyan-400 to-sky-400"}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[44px_minmax(0,1fr)] gap-2">
                      <button
                        onClick={() => handleCancelGame(game.id)}
                        className="pm-button-danger min-h-11 px-0"
                        title="لغو لابی"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <Link
                        href={game.status === "WAITING" ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`}
                        className="pm-button-primary min-h-11"
                      >
                        <span className="material-symbols-outlined text-xl">{isInProgress ? "play_arrow" : "tune"}</span>
                        {isInProgress ? "ادامه اتاق بازی" : "مدیریت لابی"}
                      </Link>
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
