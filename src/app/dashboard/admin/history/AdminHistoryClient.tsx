"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteGameHistory, getAdminGameHistoryPage } from "@/actions/dashboard";
import { publishNightRecords } from "@/actions/game";
import { usePopup } from "@/components/PopupProvider";
import { GameReportTimeline } from "@/components/game/GameReportTimeline";

type AdminHistoryData = Awaited<ReturnType<typeof getAdminGameHistoryPage>>;

type NightReportEvent = {
  id: string;
  nightNumber: number;
  abilityLabel: string;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorName?: string | null;
  targetName?: string | null;
  actorAlignment?: string | null;
  wasUsed?: boolean;
    details?: {
      phase?: "NIGHT" | "DAY";
      methodKey?: string | null;
      methodLabel?: string | null;
      effectType?: string | null;
      secondaryTargetName?: string | null;
      extraTargets?: { id?: string; name: string }[];
      targetLabels?: { label: string; playerId?: string | null; playerName?: string | null }[];
      convertedRoleName?: string | null;
      previousRoleName?: string | null;
      sacrificePlayerName?: string | null;
      defensePlayers?: { id?: string | null; name: string; roleName?: string | null }[];
    } | null;
  note?: string | null;
};

const sampleNightReport: NightReportEvent[] = [
  {
    id: "sample-mafia-shot",
    nightNumber: 1,
    abilityLabel: "شلیک مافیا",
    abilityChoiceLabel: "شلیک اصلی",
    abilitySource: "جبهه مافیا",
    actorAlignment: "MAFIA",
    targetName: "آرمان",
    wasUsed: true,
    details: { effectType: "NONE" },
    note: "هدف با تصمیم جمعی مافیا انتخاب شد.",
  },
  {
    id: "sample-doctor",
    nightNumber: 1,
    abilityLabel: "نجات دکتر",
    abilityChoiceLabel: "نجات اول",
    actorName: "سارا",
    targetName: "آرمان",
    wasUsed: true,
    details: { effectType: "NONE" },
  },
  {
    id: "sample-gun",
    nightNumber: 1,
    abilityLabel: "تفنگدار",
    abilitySource: "تفنگدار",
    actorName: "رها",
    targetName: "سینا",
    wasUsed: true,
    details: {
      effectType: "NONE",
      secondaryTargetName: "نازنین",
      targetLabels: [
        { label: "تفنگ واقعی", playerName: "سینا" },
        { label: "تفنگ مشقی", playerName: "نازنین" },
      ],
    },
  },
  {
    id: "sample-day-vote",
    nightNumber: 1,
    abilityLabel: "حذف روز: رای‌گیری",
    abilitySource: "روز",
    targetName: "هومن",
    wasUsed: true,
      details: {
        phase: "DAY",
        methodKey: "vote",
        methodLabel: "رای‌گیری",
        effectType: "NONE",
        defensePlayers: [
          { name: "هومن", roleName: "شهروند ساده" },
          { name: "رها", roleName: "تفنگدار" },
        ],
      },
      note: "با رای اکثریت از بازی خارج شد.",
  },
  {
    id: "sample-convert",
    nightNumber: 2,
    abilityLabel: "خریداری گادفادر",
    actorName: "کاوه",
    targetName: "نیما",
    wasUsed: true,
    details: {
      effectType: "CONVERT_TO_MAFIA",
      previousRoleName: "شهروند ساده",
      convertedRoleName: "مافیای ساده",
    },
    note: "در نتیجه نهایی، سمت بازیکن بر اساس نقش جدید محاسبه می‌شود.",
  },
  {
    id: "sample-inquiry",
    nightNumber: 2,
    abilityLabel: "بازپرسی",
    actorName: "مریم",
    targetName: "کاوه",
    wasUsed: true,
    details: {
      effectType: "TWO_NAME_INQUIRY",
      secondaryTargetName: "نیما",
    },
  },
];

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
    showConfirm("حذف بازی اصلی", "بازی، لابی و گزارش زنده حذف می‌شود؛ اما خلاصه نتیجه در تاریخچه بازیکنان باقی می‌ماند. ادامه می‌دهید؟", async () => {
      const result = await deleteGameHistory(gameId);
      if (result.success) {
        showToast("بازی حذف شد و خلاصه تاریخچه بازیکنان حفظ شد", "success");
        setData(await getAdminGameHistoryPage(data.page, data.pageSize));
      } else {
        showAlert("خطا", result.error || "حذف انجام نشد", "error");
      }
    }, "error");
  };

  const publishReport = (gameId: string) => {
    showConfirm("عمومی کردن گزارش بازی", "بازیکنان همین بازی می‌توانند گزارش شب و روز را در تاریخچه خود ببینند. ادامه می‌دهید؟", async () => {
      const result = await publishNightRecords(gameId);
      if (result.success) {
        showToast("گزارش برای بازیکنان منتشر شد", "success");
        setData(await getAdminGameHistoryPage(data.page, data.pageSize));
      } else {
        showAlert("خطا", result.error || "انتشار گزارش انجام نشد", "error");
      }
    });
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

      <GameReportTimeline
        events={sampleNightReport}
        sample
        title="نمونه گزارش نهایی برای ادمین"
        subtitle="نمونه نشان می‌دهد گزارش جدید چطور دفاع روز، شات شب، نجات، تبدیل نقش و بازپرسی را روایت می‌کند."
      />

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
              {game.nightEvents.length > 0 ? (
                <GameReportTimeline
                  events={game.nightEvents as NightReportEvent[]}
                  isPublic={game.nightRecordsPublic}
                  title="گزارش نهایی بازی"
                  subtitle="اتفاقات منتشرشده با روایت مرحله‌ای و قابل خواندن برای بازیکنان نمایش داده می‌شود."
                />
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs font-bold leading-6 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                  برای این بازی هنوز گزارش شب ثبت نشده است.
                </div>
              )}
              {game.nightEvents.length > 0 && (
                <button
                  onClick={() => publishReport(game.id)}
                  disabled={game.nightRecordsPublic || isPending}
                  className={game.nightRecordsPublic ? "ui-button-secondary min-h-11 w-full text-cyan-700 dark:text-cyan-300" : "ui-button-primary min-h-11 w-full"}
                >
                  <span className="material-symbols-outlined text-lg">{game.nightRecordsPublic ? "public" : "publish"}</span>
                  {game.nightRecordsPublic ? "گزارش برای بازیکنان فعال است" : "انتشار گزارش برای بازیکنان"}
                </button>
              )}
              <button onClick={() => removeGame(game.id)} className="ui-button-danger min-h-11 w-full">
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                حذف بازی و نگه‌داشتن خلاصه کاربران
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
