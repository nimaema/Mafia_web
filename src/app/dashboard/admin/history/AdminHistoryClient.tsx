"use client";

import { useState, useTransition } from "react";
import { deleteGameHistory, getAdminGameHistoryPage } from "@/actions/dashboard";
import { publishNightRecords } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatusChip } from "@/components/CommandUI";

type AdminHistoryData = Awaited<ReturnType<typeof getAdminGameHistoryPage>>;

function resultLabel(result?: string) {
  if (result === "WIN") return "برد";
  if (result === "LOSS") return "باخت";
  return "نامشخص";
}

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
    showConfirm("حذف بازی اصلی", "بازی و گزارش زنده حذف می‌شود؛ خلاصه تاریخچه بازیکنان حفظ می‌شود.", async () => {
      const result = await deleteGameHistory(gameId);
      if (result.success) {
        showToast("بازی حذف شد و خلاصه تاریخچه باقی ماند", "success");
        setData(await getAdminGameHistoryPage(data.page, data.pageSize));
      } else {
        showAlert("خطا", result.error || "حذف انجام نشد", "error");
      }
    }, "error");
  };

  const publishReport = (gameId: string) => {
    showConfirm("عمومی کردن گزارش", "بازیکنان همین بازی گزارش شب و روز را در تاریخچه خود می‌بینند.", async () => {
      const result = await publishNightRecords(gameId);
      if (result.success) {
        showToast("گزارش عمومی شد", "success");
        setData(await getAdminGameHistoryPage(data.page, data.pageSize));
      } else {
        showAlert("خطا", result.error || "انتشار گزارش انجام نشد", "error");
      }
    }, "warning");
  };

  if (data.error) return <EmptyState icon="lock" title={data.error} />;

  return (
    <div className="space-y-5">
      <CommandSurface className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <StatusChip tone="violet">Admin Game Archive</StatusChip>
            <h1 className="mt-3 text-3xl font-black text-zinc-50">تاریخچه همه بازی‌ها</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">مدیر می‌تواند گزارش‌ها را عمومی کند یا بازی اصلی را بدون حذف خلاصه نتایج پاک کند.</p>
          </div>
          <StatusChip tone="cyan">{data.total} بازی</StatusChip>
        </div>
      </CommandSurface>

      {data.items.length === 0 ? (
        <EmptyState icon="history_toggle_off" title="هنوز تاریخچه‌ای ثبت نشده" />
      ) : (
        <div className="space-y-3">
          {data.items.map((game: any) => (
            <CommandSurface key={game.id} interactive className="p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={game.nightRecordsPublic ? "emerald" : "amber"}>{game.nightRecordsPublic ? "گزارش عمومی" : "گزارش خصوصی"}</StatusChip>
                    <StatusChip tone="cyan">{game.playerCount} بازیکن</StatusChip>
                    {game.gameCode && <StatusChip tone="neutral">#{game.gameCode}</StatusChip>}
                  </div>
                  <h2 className="mt-3 truncate text-xl font-black text-zinc-50">{game.gameName}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{game.scenarioName} · گرداننده: {game.moderatorName} · {game.date}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {game.histories.slice(0, 8).map((history: any, index: number) => (
                      <div key={`${history.userName}-${index}`} className="pm-ledger-row flex items-center justify-between gap-2 p-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-100">{history.userName}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">{history.roleName}</p>
                        </div>
                        <StatusChip tone={history.result === "WIN" ? "emerald" : history.result === "LOSS" ? "rose" : "neutral"}>{resultLabel(history.result)}</StatusChip>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <SectionHeader title="گزارش ثبت‌شده" eyebrow={`${game.nightEvents.length} رویداد`} icon="receipt_long" />
                  {game.nightEvents.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-zinc-500">گزارشی ثبت نشده است.</p>
                  ) : (
                    <div className="pm-scrollbar max-h-64 space-y-2 overflow-y-auto">
                      {game.nightEvents.slice(0, 12).map((event: any) => (
                        <div key={event.id} className="pm-ledger-row p-3 text-sm">
                          <p className="font-black text-zinc-100">دور {event.nightNumber}: {event.abilityLabel}</p>
                          <p className="mt-1 text-zinc-400">{event.actorName || event.abilitySource || "نامشخص"} {event.wasUsed === false ? "بدون هدف" : `← ${event.targetName || "نامشخص"}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {!game.nightRecordsPublic && <CommandButton tone="emerald" onClick={() => publishReport(game.id)}>عمومی کن</CommandButton>}
                    <CommandButton tone="rose" onClick={() => removeGame(game.id)}>حذف بازی</CommandButton>
                  </div>
                </div>
              </div>
            </CommandSurface>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <CommandSurface className="flex items-center justify-between p-3">
          <CommandButton tone="ghost" disabled={!data.hasPrevious || isPending} onClick={() => loadPage(data.page - 1)}>قبلی</CommandButton>
          <span className="text-sm font-black text-zinc-300">صفحه {data.page + 1} از {data.totalPages}</span>
          <CommandButton tone="ghost" disabled={!data.hasNext || isPending} onClick={() => loadPage(data.page + 1)}>بعدی</CommandButton>
        </CommandSurface>
      )}
    </div>
  );
}
