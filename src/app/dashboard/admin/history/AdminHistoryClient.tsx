"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteGameHistory, getAdminGameHistoryPage } from "@/actions/dashboard";
import { usePopup } from "@/components/PopupProvider";

type AdminHistoryData = Awaited<ReturnType<typeof getAdminGameHistoryPage>>;

export function AdminHistoryClient({ initialData }: { initialData: AdminHistoryData }) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const { showConfirm, showToast, showAlert } = usePopup();

  const loadPage = (page: number) => {
    startTransition(async () => {
      setData(await getAdminGameHistoryPage(page, data.pageSize));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const removeGame = (gameId: string) => {
    showConfirm("حذف کامل از تاریخچه", "این بازی از تاریخچه همه کاربران حذف می‌شود. ادامه می‌دهید؟", async () => {
      const result = await deleteGameHistory(gameId);
      if (result.success) {
        showToast("بازی از همه تاریخچه‌ها حذف شد", "success");
        setData(await getAdminGameHistoryPage(data.page, data.pageSize));
      } else {
        showAlert("خطا", result.error || "حذف انجام نشد", "error");
      }
    }, "error");
  };

  return (
    <div className="space-y-5" dir="rtl">
      <section className="ui-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="ui-kicker">مدیریت تاریخچه کل</p>
          <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">تاریخچه همه بازی‌ها</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">ادمین می‌تواند بازی‌های ثبت‌شده را برای همه کاربران بررسی یا حذف کند.</p>
        </div>
        <Link href="/dashboard/admin/users" className="ui-button-secondary min-h-11 px-4">
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
          کاربران
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {data.items.map((game) => (
          <article key={game.id} className="ui-card overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-zinc-950 dark:text-white">{game.scenarioName}</h2>
                  <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{game.date} | {game.moderatorName}</p>
                </div>
                <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                  {game.gameCode ? `#${game.gameCode}` : "بدون کد"}
                </span>
              </div>
            </div>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="ui-muted p-3">
                  <p className="text-xl font-black text-zinc-950 dark:text-white">{game.playerCount}</p>
                  <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بازیکن</p>
                </div>
                <div className="ui-muted p-3">
                  <p className="text-xl font-black text-zinc-950 dark:text-white">{game.historyCount}</p>
                  <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">رکورد تاریخچه</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.histories.slice(0, 6).map((history, index) => (
                  <span key={`${game.id}-${history.userName}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                    {history.userName}: {history.roleName}
                  </span>
                ))}
              </div>
              <button onClick={() => removeGame(game.id)} className="ui-button-danger min-h-11 w-full">
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                حذف از همه تاریخچه‌ها
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="ui-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{data.total} بازی ثبت‌شده</p>
        <div className="flex gap-2">
          <button onClick={() => loadPage(data.page - 1)} disabled={!data.hasPrevious || isPending} className="ui-button-secondary min-h-10 px-4">قبلی</button>
          <button onClick={() => loadPage(data.page + 1)} disabled={!data.hasNext || isPending} className="ui-button-primary min-h-10 px-4">بعدی</button>
        </div>
      </section>
    </div>
  );
}
