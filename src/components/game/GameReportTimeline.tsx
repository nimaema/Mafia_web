"use client";

import { Moon, PencilSimple, Prohibit, Sun, Trash } from "@phosphor-icons/react";
import { logbookDayLabel, logbookNightLabel } from "@/lib/phase";

type ReportAlignment = "CITIZEN" | "MAFIA" | "NEUTRAL" | string;

export type GameReportEvent = {
  id: string;
  nightNumber: number;
  abilityKey?: string | null;
  abilityLabel: string;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorName?: string | null;
  targetName?: string | null;
  actorPlayer?: { name?: string | null } | null;
  targetPlayer?: { name?: string | null } | null;
  actorAlignment?: ReportAlignment | null;
  wasUsed?: boolean;
  details?: {
    phase?: "NIGHT" | "DAY";
    methodKey?: string | null;
    methodLabel?: string | null;
    effectType?: string | null;
    secondaryTargetName?: string | null;
    extraTargets?: { id?: string | null; name: string }[];
    targetLabels?: { label: string; playerName?: string | null }[];
    convertedRoleName?: string | null;
    previousRoleName?: string | null;
    sacrificePlayerName?: string | null;
    defensePlayers?: { id?: string | null; name: string; roleName?: string | null }[];
  } | null;
  note?: string | null;
};

type GameReportTimelineProps = {
  events: GameReportEvent[];
  title?: string;
  subtitle?: string;
  isPublic?: boolean;
  sample?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyText?: string;
  busy?: boolean;
  onEdit?: (event: GameReportEvent) => void;
  onDelete?: (event: GameReportEvent) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function alignmentLabel(alignment?: ReportAlignment | null) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  if (alignment === "NEUTRAL") return "مستقل";
  return "گرداننده";
}

function effectLabel(effectType?: string | null) {
  if (effectType === "CONVERT_TO_MAFIA") return "خریداری";
  if (effectType === "YAKUZA") return "یاکوزا";
  if (effectType === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره";
  return "ثبت معمولی";
}

function isDayReportEvent(event: GameReportEvent) {
  return event.details?.phase === "DAY" || event.abilityKey?.startsWith("day:") || event.abilityLabel.startsWith("حذف روز");
}

function methodLabel(event: GameReportEvent) {
  return event.details?.methodLabel || event.abilityLabel.replace(/^حذف روز:\s*/, "") || "اتفاق روز";
}

function abilityLabel(event: GameReportEvent) {
  return `${event.abilityLabel}${event.abilityChoiceLabel ? `: ${event.abilityChoiceLabel}` : ""}`;
}

function actorName(event: GameReportEvent) {
  return event.actorName || event.actorPlayer?.name || event.abilitySource || alignmentLabel(event.actorAlignment);
}

function targetName(event: GameReportEvent) {
  return event.targetName || event.targetPlayer?.name || null;
}

function defenseNames(event: GameReportEvent) {
  return event.details?.defensePlayers?.map((player) => player.name).filter(Boolean) || [];
}

function targetLabelText(event: GameReportEvent) {
  const labels = event.details?.targetLabels || [];
  if (!labels.length) return "";
  return labels.map((target) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، ");
}

function eventHeadline(event: GameReportEvent) {
  const target = targetName(event);
  const actor = actorName(event);
  const effect = event.details?.effectType;

  if (isDayReportEvent(event)) {
    const method = methodLabel(event);
    const defenses = defenseNames(event);
    if (defenses.length && target) return `رای‌گیری روز؛ ${target} حذف شد`;
    if (defenses.length) return "دفاع روز ثبت شد";
    if (target) return `${target} با ${method} حذف شد`;
    return `${method} روز ثبت شد`;
  }

  if (event.wasUsed === false) return `${actor} از ${event.abilityLabel} استفاده نکرد`;
  if (effect === "YAKUZA") return target ? `یاکوزا روی ${target} ثبت شد` : "یاکوزا ثبت شد";
  if (effect === "CONVERT_TO_MAFIA") return target ? `${target} خریداری شد` : "خریداری ثبت شد";
  if (effect === "TWO_NAME_INQUIRY") return "بازپرسی دو نفره ثبت شد";
  if (event.abilityKey === "side:mafia-shot" || event.abilityLabel.includes("شلیک مافیا")) {
    return target ? `${target} هدف شلیک مافیا شد` : "شلیک مافیا ثبت شد";
  }
  if (event.details?.targetLabels?.length) return `${event.abilityLabel} با چند انتخاب ثبت شد`;
  if (target) return `${target} هدف ${event.abilityLabel} شد`;
  return abilityLabel(event);
}

function eventNarrative(event: GameReportEvent) {
  const target = targetName(event);
  const actor = actorName(event);
  const defenses = defenseNames(event);
  const secondary = event.details?.secondaryTargetName;
  const sacrifice = event.details?.sacrificePlayerName;
  const labels = targetLabelText(event);
  const extras = event.details?.extraTargets?.map((item) => item.name).filter(Boolean) || [];
  const effect = event.details?.effectType;

  if (isDayReportEvent(event)) {
    if (defenses.length && target) return `${defenses.join("، ")} به دفاع رفتند؛ پس از رای نهایی، ${target} از بازی خارج شد.`;
    if (defenses.length) return `${defenses.join("، ")} به دفاع رفتند؛ حذف نهایی برای این روز ثبت نشد.`;
    if (target) return `در فاز روز، ${target} با ${methodLabel(event)} از بازی خارج شد.`;
    return "این اتفاق روز بدون حذف نهایی ثبت شده است.";
  }

  if (event.wasUsed === false) return "گرداننده ثبت کرده که این توانایی در این شب استفاده نشده و هدفی برای آن وجود ندارد.";
  if (effect === "YAKUZA") {
    const parts = [
      sacrifice ? `${sacrifice} قربانی اجرای یاکوزا شد` : null,
      target ? `${target} به عنوان هدف خریداری انتخاب شد` : null,
    ].filter(Boolean);
    return parts.length ? `${parts.join("؛ ")}.` : "اجرای یاکوزا در گزارش شب ثبت شد.";
  }
  if (event.details?.convertedRoleName) {
    return `نقش/سمت ${target || "بازیکن هدف"} از ${event.details.previousRoleName || "نقش قبلی"} به ${event.details.convertedRoleName} تغییر کرد؛ نتیجه نهایی با سمت جدید سنجیده می‌شود.`;
  }
  if (effect === "TWO_NAME_INQUIRY") {
    return `${actor} دو نام را برای بازپرسی اعلام کرد: ${[target, secondary].filter(Boolean).join(" و ") || "نامشخص"}.`;
  }
  if (labels) return `انتخاب‌های ثبت‌شده: ${labels}.`;
  if (extras.length && target) return `${actor} برای ${event.abilityLabel}، ${target} را هدف اصلی و ${extras.join("، ")} را هدف تکمیلی ثبت کرد.`;
  if (secondary && target) return `${actor} برای ${event.abilityLabel}، ${target} و ${secondary} را ثبت کرد.`;
  if (target) return `${actor} برای ${event.abilityLabel}، ${target} را انتخاب کرد.`;
  return `${event.abilityLabel} در گزارش شب ثبت شد.`;
}

function reportPhases(events: GameReportEvent[]) {
  const rounds = new Map<number, { day: GameReportEvent[]; night: GameReportEvent[] }>();
  events.forEach((event) => {
    const round = event.nightNumber || 1;
    const current = rounds.get(round) || { day: [], night: [] };
    if (isDayReportEvent(event)) current.day.push(event);
    else current.night.push(event);
    rounds.set(round, current);
  });

  return [...rounds.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([round, grouped]) => [
      grouped.day.length ? { key: `day-${round}`, type: "DAY" as const, round, events: grouped.day } : null,
      grouped.night.length ? { key: `night-${round}`, type: "NIGHT" as const, round, events: grouped.night } : null,
    ])
    .filter(Boolean) as { key: string; type: "DAY" | "NIGHT"; round: number; events: GameReportEvent[] }[];
}

function Detail({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "accent" | "day" | "danger" }) {
  const toneClass = tone === "accent" ? "bg-accent-soft text-accent" : tone === "day" ? "bg-warning/14 text-warning" : tone === "danger" ? "bg-danger/12 text-danger" : "bg-raised text-muted";
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", toneClass)}>
      <span className="opacity-75">{label}</span>
      <span className="font-extrabold">{value}</span>
    </span>
  );
}

function ReportEvent({
  event,
  busy,
  onEdit,
  onDelete,
}: {
  event: GameReportEvent;
  busy?: boolean;
  onEdit?: (event: GameReportEvent) => void;
  onDelete?: (event: GameReportEvent) => void;
}) {
  const isDay = isDayReportEvent(event);
  const target = targetName(event);
  const labels = targetLabelText(event);
  const extras = event.details?.extraTargets?.map((item) => item.name).filter(Boolean) || [];
  const defenses = defenseNames(event);
  const unused = event.wasUsed === false;
  const effect = event.details?.effectType && event.details.effectType !== "NONE" ? effectLabel(event.details.effectType) : null;

  return (
    <li className="group relative flex gap-3 py-4">
      <span className={cx("mt-1.5 size-2.5 shrink-0 rounded-full", unused ? "bg-faint" : isDay ? "bg-day" : "bg-accent")} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={cx("font-extrabold leading-7", unused ? "text-muted" : "text-fg")}>{eventHeadline(event)}</h4>
          {effect ? <span className="nq-tag bg-accent-soft text-accent">{effect}</span> : null}
          {unused ? (
            <span className="nq-tag">
              <Prohibit size={14} weight="bold" aria-hidden />
              استفاده نشد
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-medium leading-7 text-muted">{eventNarrative(event)}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Detail label="عامل" value={actorName(event)} />
          {target ? <Detail label="هدف" value={target} tone={isDay ? "day" : "accent"} /> : null}
          {defenses.length > 0 ? <Detail label="دفاع" value={defenses.join("، ")} tone="day" /> : null}
          {labels ? <Detail label="انتخاب‌ها" value={labels} tone="accent" /> : null}
          {event.details?.secondaryTargetName ? (
            <Detail label={event.details.effectType === "YAKUZA" ? "قربانی" : "هدف دوم"} value={event.details.secondaryTargetName} tone={event.details.effectType === "YAKUZA" ? "danger" : "accent"} />
          ) : null}
          {extras.length > 0 ? <Detail label="هدف‌های اضافه" value={extras.join("، ")} tone="accent" /> : null}
          {event.details?.convertedRoleName ? <Detail label="تبدیل" value={`${event.details.previousRoleName || "قبلی"} ← ${event.details.convertedRoleName}`} tone="danger" /> : null}
        </div>
        {event.note ? <p className="mt-2.5 rounded-[var(--radius-sm)] bg-raised px-3 py-2 text-sm font-medium leading-6 text-muted">{event.note}</p> : null}
      </div>
      {onEdit || onDelete ? (
        <div className="flex shrink-0 flex-col gap-1.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {onEdit ? (
            <button type="button" onClick={() => onEdit(event)} disabled={busy} className="nq-icon-btn size-9" aria-label="ویرایش این رویداد">
              <PencilSimple size={18} weight="bold" aria-hidden />
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={() => onDelete(event)} disabled={busy} className="nq-icon-btn size-9 hover:!text-danger" aria-label="حذف این رویداد">
              <Trash size={18} weight="bold" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function GameReportTimeline({
  events,
  title = "گزارش بازی",
  subtitle = "به ترتیب اجرا: اول اتفاقات روز، بعد شب همان دور.",
  isPublic,
  sample,
  className,
  emptyTitle = "هنوز چیزی ثبت نشده",
  emptyText = "با ثبت اتفاقات روز و شب، داستان بازی اینجا نوشته می‌شود.",
  busy,
  onEdit,
  onDelete,
}: GameReportTimelineProps) {
  const phases = reportPhases(events);
  const status = sample ? "نمونه" : isPublic === undefined ? null : isPublic ? "منتشرشده" : "فقط گرداننده";

  return (
    <section className={cx("rounded-[var(--radius-lg)] border border-line bg-surface", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <p className="mt-0.5 text-sm font-medium leading-6 text-muted">{subtitle}</p>
        </div>
        {status ? <span className={cx("nq-tag shrink-0", isPublic || sample ? "bg-accent-soft text-accent" : "bg-warning/14 text-warning")}>{status}</span> : null}
      </header>

      {phases.length === 0 ? (
        <div className="px-5 pb-8 pt-6 text-center">
          <p className="font-extrabold">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium leading-6 text-muted">{emptyText}</p>
        </div>
      ) : (
        <ol className="px-5 pb-3">
          {phases.map((phase) => (
            <li key={phase.key} className="mt-3">
              <p
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold",
                  phase.type === "DAY" ? "bg-day text-day-ink" : "bg-night text-moon",
                )}
              >
                {phase.type === "DAY" ? <Sun size={16} weight="fill" aria-hidden /> : <Moon size={16} weight="fill" aria-hidden />}
                {phase.type === "DAY" ? logbookDayLabel(phase.round) : logbookNightLabel(phase.round)}
              </p>
              <ul className="ms-1 divide-y divide-line border-s border-line ps-4">
                {phase.events.map((event) => (
                  <ReportEvent key={event.id} event={event} busy={busy} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
