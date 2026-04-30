"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, getModeratorGamesSafe, cancelGame } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";

function statusLabel(status: string) {
  if (status === "WAITING") return "در انتظار";
  if (status === "IN_PROGRESS") return "در جریان";
  return "بسته شده";
}

function scenarioCapacity(game: any) {
  return game.scenario?.roles?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
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

  return (
    <div className="flex flex-col gap-5 font-sans" dir="rtl">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="ui-icon-accent size-12">
              <span className="material-symbols-outlined text-2xl">sports_esports</span>
            </div>
            <div className="min-w-0">
              <p className="ui-kicker">مرکز گردانندگی</p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">اتاق کنترل بازی‌ها</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                لابی را بسازید، سناریو را داخل اتاق انتظار تنظیم کنید و بازی‌های فعال را بدون شلوغی مدیریت کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="grid grid-cols-4 gap-2">
            {[
              ["لابی‌ها", activeGames.length, "dashboard"],
              ["بازیکن‌ها", totalPlayers, "group"],
              ["در انتظار", waitingGames, "hourglass_top"],
              ["در جریان", inProgressGames, "bolt"],
            ].map(([label, value, icon]) => (
              <div key={label} className="ui-muted min-w-16 px-3 py-2 text-center">
                <span className="material-symbols-outlined text-base text-lime-600 dark:text-lime-400">{icon}</span>
                <p className="mt-1 text-lg font-black text-zinc-950 dark:text-white">{value}</p>
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
              </div>
            ))}
            </div>
            <div className="flex w-full gap-2 lg:w-auto">
              <button onClick={() => setShowCreateModal(true)} className="ui-button-primary min-h-10 flex-1 px-4 lg:flex-none">
                <span className="material-symbols-outlined text-lg">add_circle</span>
                لابی جدید
              </button>
              <button onClick={refreshGames} className="ui-button-secondary min-h-10 flex-1 px-4 lg:flex-none" disabled={isRefreshing}>
                <span className={`material-symbols-outlined text-lg ${isRefreshing ? "animate-spin" : ""}`}>refresh</span>
                بروزرسانی
              </button>
            </div>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 pb-28 backdrop-blur-xl sm:items-center sm:p-4">
          <div className="ui-card max-h-[calc(100dvh-8rem)] w-full max-w-3xl overflow-hidden sm:max-h-[92vh]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="ui-kicker">راه‌اندازی لابی</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">تنظیم بازی جدید</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  این مرحله فقط اتاق انتظار را می‌سازد. انتخاب سناریو و شروع بازی در صفحه بعد انجام می‌شود.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="ui-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar grid max-h-[calc(100dvh-20rem)] gap-5 overflow-y-auto p-5 sm:max-h-[72vh] lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">نام لابی</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="مثلا: بازی جمعه شب"
                  />
                </label>

                <div className="rounded-lg border border-zinc-200 p-3 dark:border-white/10">
                  <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">نوع ورود</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`rounded-lg border p-4 text-right transition-all ${
                        !isPrivate
                          ? "border-lime-500/40 bg-lime-500/10 text-zinc-950 dark:text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">lock_open</span>
                      <span className="mt-2 block text-sm font-black">باز</span>
                      <span className="mt-1 block text-xs leading-5">بازیکن‌ها فقط با کد وارد می‌شوند.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`rounded-lg border p-4 text-right transition-all ${
                        isPrivate
                          ? "border-amber-500/40 bg-amber-500/10 text-zinc-950 dark:text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">lock</span>
                      <span className="mt-2 block text-sm font-black">خصوصی</span>
                      <span className="mt-1 block text-xs leading-5">کد بازی همراه رمز لازم است.</span>
                    </button>
                  </div>
                </div>

                {isPrivate && (
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز ورود</span>
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

              <aside className="ui-muted h-fit p-4">
                <p className="font-black text-zinc-950 dark:text-white">بعد از ساخت</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {[
                    ["tag", "کد ورود خودکار ساخته می‌شود."],
                    ["account_tree", "سناریو را با توجه به تعداد بازیکنان انتخاب می‌کنید."],
                    ["groups", "فهرست بازیکنان زنده بروزرسانی می‌شود."],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex gap-2">
                      <span className="material-symbols-outlined text-lg text-lime-600 dark:text-lime-400">{icon}</span>
                      <span className="leading-6">{text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleCreateGame} disabled={loading} className="ui-button-primary mt-5 min-h-12 w-full">
                  <span className={`material-symbols-outlined text-xl ${loading ? "animate-spin" : ""}`}>
                    {loading ? "refresh" : "bolt"}
                  </span>
                  ساخت و ورود به لابی
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}

      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-zinc-950 dark:text-white">لابی‌های فعال</p>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {protectedGames > 0 ? `${protectedGames} لابی خصوصی` : "همه لابی‌ها باز هستند"}
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="ui-button-secondary min-h-10 px-3 text-xs">
            <span className="material-symbols-outlined text-lg">add</span>
            ساخت لابی
          </button>
        </div>

        <div className="p-5">
          {errorMessage ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-center">
              <div className="ui-icon size-16 text-red-500">
                <span className="material-symbols-outlined text-3xl">cloud_off</span>
              </div>
              <div>
                <p className="text-xl font-black text-zinc-950 dark:text-white">بارگذاری لابی‌ها ناموفق بود</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
              </div>
              <button onClick={refreshGames} className="ui-button-primary">
                <span className="material-symbols-outlined text-xl">refresh</span>
                تلاش دوباره
              </button>
            </div>
          ) : activeGames.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-center">
              <div className="ui-icon size-20">
                <span className="material-symbols-outlined text-4xl text-zinc-400">videogame_asset_off</span>
              </div>
              <div>
                <p className="text-xl font-black text-zinc-950 dark:text-white">هنوز لابی فعالی ندارید</p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">یک لابی بسازید تا کد ورود و صفحه انتظار آماده شود.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="ui-button-primary">ایجاد اولین لابی</button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {activeGames.map((game) => {
                const capacity = scenarioCapacity(game);
                const players = game._count?.players || 0;
                const progress = capacity > 0 ? Math.min(100, Math.round((players / capacity) * 100)) : 0;
                const isInProgress = game.status === "IN_PROGRESS";
                const statusTone = isInProgress
                  ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300";

                return (
                  <article key={game.id} className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-lime-500/30 hover:shadow-xl hover:shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950">
                    <div className={`absolute inset-x-0 top-0 h-1 ${isInProgress ? "bg-sky-500" : "bg-lime-500"}`} />
                    <div className="flex items-start justify-between gap-4 pt-1">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg border ${statusTone}`}>
                          <span className="material-symbols-outlined text-2xl">{isInProgress ? "sports_esports" : "groups"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">{isInProgress ? "بازی در جریان" : "اتاق انتظار"}</p>
                          <h2 className="mt-1 line-clamp-2 break-words text-lg font-black leading-6 text-zinc-950 dark:text-white">{game.name}</h2>
                          <p className="mt-1 line-clamp-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{game.scenario?.name || "سناریو هنوز انتخاب نشده"}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-zinc-950 px-2.5 py-1 font-mono text-[10px] font-black text-white dark:bg-white dark:text-zinc-950">
                        #{game.code}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        [statusLabel(game.status), isInProgress ? "play_circle" : "pending_actions", statusTone],
                        [`${players}${capacity ? `/${capacity}` : ""}`, "group", "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"],
                        [game.password ? "خصوصی" : "باز", game.password ? "lock" : "lock_open", game.password ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"],
                      ].map(([label, icon, className]) => (
                        <div key={label} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-black ${className}`}>
                          <span className="material-symbols-outlined block text-base">{icon}</span>
                          <span className="mt-1 block truncate">{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <span>پیشرفت ظرفیت</span>
                        <span>{capacity ? `${players} از ${capacity}` : "بعد از انتخاب سناریو"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                        <div className={`h-full rounded-full transition-[width] ${isInProgress ? "bg-sky-500" : "bg-lime-500"}`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 truncate text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                        گرداننده: {game.moderator?.name || "نامشخص"}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-[44px_minmax(0,1fr)] gap-2">
                      <button
                        onClick={() => handleCancelGame(game.id)}
                        className="ui-button-danger min-h-11 px-0"
                        title="لغو لابی"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <Link
                        href={game.status === "WAITING" ? `/dashboard/moderator/lobby/${game.id}` : `/dashboard/moderator/game/${game.id}`}
                        className="ui-button-primary min-h-11"
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
