"use client";

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

function phaseMeta(type: "DAY" | "NIGHT") {
  if (type === "DAY") {
    return {
      icon: "wb_sunny",
      label: "روز",
      card: "border-amber-500/20 bg-amber-500/[0.06]",
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      iconBox: "bg-amber-500 text-zinc-950",
    };
  }
  return {
    icon: "dark_mode",
    label: "شب",
    card: "border-cyan-500/20 bg-cyan-500/[0.06]",
    badge: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    iconBox: "bg-cyan-500 text-zinc-950",
  };
}

function eventTone(event: GameReportEvent) {
  if (isDayReportEvent(event)) return phaseMeta("DAY");
  if (event.wasUsed === false) {
    return {
      icon: "block",
      label: "استفاده نشد",
      card: "border-zinc-300 bg-zinc-100/75 dark:border-white/10 dark:bg-white/[0.045]",
      badge: "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300",
      iconBox: "bg-zinc-500 text-white",
    };
  }
  return phaseMeta("NIGHT");
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

function DetailChip({ label, value, tone = "zinc" }: { label: string; value: string; tone?: "zinc" | "cyan" | "amber" | "red" }) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : tone === "red"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
          : "border-zinc-200 bg-white/78 text-zinc-600 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-300";

  return (
    <span className={cx("inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black", toneClass)}>
      <span className="text-[10px] opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function ReportEventCard({
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
  const tone = eventTone(event);
  const target = targetName(event);
  const actor = actorName(event);
  const labels = targetLabelText(event);
  const extras = event.details?.extraTargets?.map((item) => item.name).filter(Boolean) || [];
  const defenses = defenseNames(event);

  return (
    <article className={cx("group relative overflow-hidden rounded-[1.2rem] border p-3 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/10 dark:shadow-black/20", tone.card)}>
      <div className="flex gap-3">
        <span className={cx("grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm", tone.iconBox)}>
          <span className="material-symbols-outlined text-2xl">{tone.icon}</span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <span className={cx("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-black", tone.badge)}>
              <span className="material-symbols-outlined text-sm">{tone.icon}</span>
              {tone.label}
            </span>
            {event.details?.effectType && event.details.effectType !== "NONE" && (
              <span className="inline-flex items-center rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black text-sky-700 dark:text-sky-300">
                {effectLabel(event.details.effectType)}
              </span>
            )}
            <h4 className="min-w-0 flex-1 basis-full text-base font-black leading-7 text-zinc-950 dark:text-white sm:basis-auto">
              {eventHeadline(event)}
            </h4>
          </div>

          <p className="mt-2 text-sm font-bold leading-7 text-zinc-600 dark:text-zinc-300">{eventNarrative(event)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <DetailChip label="عامل" value={actor} />
            {target && <DetailChip label="هدف" value={target} tone={isDayReportEvent(event) ? "amber" : "cyan"} />}
            {defenses.length > 0 && <DetailChip label="دفاع" value={defenses.join("، ")} tone="amber" />}
            {labels && <DetailChip label="انتخاب‌ها" value={labels} tone="cyan" />}
            {event.details?.secondaryTargetName && <DetailChip label={event.details.effectType === "YAKUZA" ? "قربانی" : "هدف دوم"} value={event.details.secondaryTargetName} tone={event.details.effectType === "YAKUZA" ? "red" : "cyan"} />}
            {extras.length > 0 && <DetailChip label="هدف‌های اضافه" value={extras.join("، ")} tone="cyan" />}
            {event.details?.convertedRoleName && <DetailChip label="تبدیل" value={`${event.details.previousRoleName || "قبلی"} ← ${event.details.convertedRoleName}`} tone="red" />}
          </div>

          {event.note && (
            <p className="mt-3 rounded-lg border border-zinc-200 bg-white/72 px-3 py-2 text-xs font-bold leading-6 text-zinc-500 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-400">
              {event.note}
            </p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex shrink-0 flex-col gap-2 opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(event)}
                disabled={busy}
                className="grid size-9 place-items-center rounded-lg border border-sky-500/15 bg-sky-500/10 text-sky-600 transition-all hover:bg-sky-500 hover:text-white disabled:opacity-40 dark:text-sky-300"
                aria-label="ویرایش رکورد"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(event)}
                disabled={busy}
                className="grid size-9 place-items-center rounded-lg border border-red-500/15 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-40"
                aria-label="حذف رکورد"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function GameReportTimeline({
  events,
  title = "گزارش نهایی بازی",
  subtitle = "وقایع به ترتیب اجرا نوشته شده‌اند؛ اول اتفاقات روز، بعد اتفاقات شب همان دور.",
  isPublic,
  sample,
  className,
  emptyTitle = "هنوز گزارشی ثبت نشده است",
  emptyText = "با ثبت اتفاقات روز و شب، گزارش نهایی اینجا به شکل خط زمانی نمایش داده می‌شود.",
  busy,
  onEdit,
  onDelete,
}: GameReportTimelineProps) {
  const phases = reportPhases(events);
  const dayCount = events.filter(isDayReportEvent).length;
  const nightCount = events.length - dayCount;

  return (
    <section className={cx("overflow-hidden rounded-[1.45rem] border border-zinc-200 bg-white/86 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/62", className)}>
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/86 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="material-symbols-outlined text-xl text-cyan-700 dark:text-cyan-100">receipt_long</span>
            <h3 className="text-base font-black text-zinc-950 dark:text-white">{title}</h3>
          </div>
          <p className="mt-1 text-xs font-bold leading-6 text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black">
          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">{events.length} اتفاق</span>
          <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">{dayCount} روز</span>
          <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-700 dark:text-cyan-300">{nightCount} شب</span>
          {(sample || isPublic !== undefined) && (
            <span className={sample || isPublic ? "rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-700 dark:text-cyan-300" : "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300"}>
              {sample ? "نمونه" : isPublic ? "منتشرشده" : "فقط مدیریت"}
            </span>
          )}
        </div>
      </div>

      {phases.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="ui-icon size-16">
            <span className="material-symbols-outlined text-3xl text-zinc-400">edit_note</span>
          </div>
          <div>
            <p className="font-black text-zinc-950 dark:text-white">{emptyTitle}</p>
            <p className="mt-1 max-w-md text-sm font-bold leading-6 text-zinc-500 dark:text-zinc-400">{emptyText}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {phases.map((phase, index) => {
            const meta = phaseMeta(phase.type);
            return (
              <article key={phase.key} className={cx("overflow-hidden rounded-[1.35rem] border", meta.card)}>
                <div className="flex flex-col gap-3 border-b border-current/10 bg-white/48 p-3 dark:bg-zinc-950/22 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cx("grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-black shadow-sm", meta.iconBox)}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cx("material-symbols-outlined text-lg", phase.type === "DAY" ? "text-amber-600 dark:text-amber-300" : "text-cyan-600 dark:text-cyan-300")}>{meta.icon}</span>
                        <p className="font-black text-zinc-950 dark:text-white">{meta.label} {phase.round}</p>
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        {phase.type === "DAY" ? "گفتگو، دفاع، رای‌گیری یا حذف روز" : "اکشن‌های شب، شات، نجات، استعلام یا تبدیل"}
                      </p>
                    </div>
                  </div>
                  <span className={cx("inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-[11px] font-black", meta.badge)}>
                    {phase.events.length} اتفاق
                  </span>
                </div>

                <div className="space-y-3 p-3">
                  {phase.events.map((event) => (
                    <ReportEventCard key={event.id} event={event} busy={busy} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
