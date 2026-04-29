"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteGameHistory, getAdminGameHistoryPage } from "@/actions/dashboard";
import { usePopup } from "@/components/PopupProvider";

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
    effectType?: string | null;
    secondaryTargetName?: string | null;
    extraTargets?: { id?: string; name: string }[];
    convertedRoleName?: string | null;
    previousRoleName?: string | null;
    sacrificePlayerName?: string | null;
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

function effectLabel(effectType?: string | null) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت ساده";
}

function alignmentLabel(alignment?: string | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "NEUTRAL") return "مستقل";
  return "نامشخص";
}

function groupNightEvents(events: NightReportEvent[]) {
  const groups = new Map<number, NightReportEvent[]>();
  events.forEach((event) => {
    const existing = groups.get(event.nightNumber) || [];
    groups.set(event.nightNumber, [...existing, event]);
  });
  return [...groups.entries()].sort(([left], [right]) => left - right);
}

function NightReportBlock({
  events,
  sample = false,
  isPublic,
}: {
  events: NightReportEvent[];
  sample?: boolean;
  isPublic?: boolean;
}) {
  if (!events.length) return null;

  return (
    <div className={sample ? "rounded-lg border border-lime-500/20 bg-lime-500/10 p-4" : "rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-lime-600 dark:text-lime-300">dark_mode</span>
          <p className="text-sm font-black text-zinc-950 dark:text-white">{sample ? "نمونه گزارش شب برای ادمین" : "گزارش شب بازی"}</p>
        </div>
        <span className={sample || isPublic ? "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-1 text-[10px] font-black text-lime-700 dark:text-lime-300" : "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300"}>
          {sample ? "نمونه" : isPublic ? "منتشرشده" : "فقط ادمین"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {groupNightEvents(events).map(([nightNumber, nightEvents]) => (
          <div key={`${sample ? "sample" : "real"}-${nightNumber}`} className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-zinc-950 dark:text-white">شب {nightNumber}</p>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{nightEvents.length} رکورد</span>
            </div>
            <div className="mt-2 space-y-2">
              {nightEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs leading-6 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-zinc-950 dark:text-white">
                      {event.abilityLabel}{event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}
                    </p>
                    <span className={event.wasUsed === false ? "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300" : "rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-[10px] font-black text-lime-700 dark:text-lime-300"}>
                      {event.wasUsed === false ? "استفاده نشد" : "استفاده شد"}
                    </span>
                    {event.details?.effectType && event.details.effectType !== "NONE" && (
                      <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
                        {effectLabel(event.details.effectType)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1">
                    {event.actorName || event.abilitySource || alignmentLabel(event.actorAlignment)}
                    {event.wasUsed === false ? " ← بدون هدف" : ` ← ${event.targetName || "نامشخص"}`}
                  </p>
                  {event.details?.secondaryTargetName && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      {event.details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: {event.details.secondaryTargetName}
                    </p>
                  )}
                  {Array.isArray(event.details?.extraTargets) && event.details.extraTargets.length > 0 && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      هدف‌های اضافه: {event.details.extraTargets.map((target) => target.name).join("، ")}
                    </p>
                  )}
                  {event.details?.convertedRoleName && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      تبدیل نقش: {event.details.previousRoleName || "نقش قبلی"} ← {event.details.convertedRoleName}
                    </p>
                  )}
                  {event.note && <p className="mt-1 text-zinc-500 dark:text-zinc-400">{event.note}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

      <NightReportBlock events={sampleNightReport} sample />

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
                <NightReportBlock events={game.nightEvents as NightReportEvent[]} isPublic={game.nightRecordsPublic} />
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs font-bold leading-6 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                  برای این بازی هنوز گزارش شب ثبت نشده است.
                </div>
              )}
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
