import { Moon } from "@phosphor-icons/react/dist/ssr";
import { ordinalFa } from "@/lib/phase";

type NightEvent = {
  id: string;
  nightNumber: number;
  abilityLabel: string;
  abilityChoiceLabel?: string | null;
  abilitySource?: string | null;
  actorAlignment?: string | null;
  wasUsed?: boolean;
  note?: string | null;
  actorPlayer?: { name: string } | null;
  targetPlayer?: { name: string } | null;
  details?: any;
};

const EFFECT: Record<string, string> = { CONVERT_TO_MAFIA: "خریداری", YAKUZA: "یاکوزا", TWO_NAME_INQUIRY: "بازپرسی دو نفره" };
const ALIGNMENT: Record<string, string> = { CITIZEN: "شهروند", MAFIA: "مافیا", NEUTRAL: "مستقل" };

function eventLine(event: NightEvent) {
  const actor = event.actorPlayer?.name || event.abilitySource || (event.actorAlignment ? ALIGNMENT[event.actorAlignment] : "نامشخص");
  if (event.wasUsed === false) return `${actor}: استفاده نکرد`;
  return `${actor} ← ${event.targetPlayer?.name || "نامشخص"}`;
}

function extraLines(event: NightEvent) {
  const details = event.details || {};
  const lines: string[] = [];
  if (Array.isArray(details.targetLabels) && details.targetLabels.length) {
    lines.push(details.targetLabels.map((target: { label: string; playerName?: string | null }) => `${target.label}: ${target.playerName || "نامشخص"}`).join("، "));
  } else {
    if (details.secondaryTargetName) lines.push(`${details.effectType === "YAKUZA" ? "قربانی یاکوزا" : "هدف دوم"}: ${details.secondaryTargetName}`);
    if (Array.isArray(details.extraTargets) && details.extraTargets.length) {
      lines.push(`هدف‌های اضافه: ${details.extraTargets.map((target: { name: string }) => target.name).join("، ")}`);
    }
  }
  if (details.convertedRoleName) lines.push(`تبدیل نقش: ${details.previousRoleName || "نقش قبلی"} ← ${details.convertedRoleName}`);
  if (event.note) lines.push(event.note);
  return lines;
}

/** The moderator's published night notes, grouped by night. */
export function PublicNightLog({ events }: { events: NightEvent[] }) {
  const nights = new Map<number, NightEvent[]>();
  events.forEach((event) => nights.set(event.nightNumber, [...(nights.get(event.nightNumber) || []), event]));
  const ordered = [...nights.entries()].sort(([a], [b]) => a - b);

  return (
    <section aria-labelledby="night-log-title">
      <h2 id="night-log-title" className="text-lg font-extrabold">
        دفترچه شب‌ها
      </h2>
      <ol className="mt-4 flex flex-col gap-3">
        {ordered.map(([night, nightEvents]) => (
          <li key={night} className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
            <p className="flex items-center gap-2 bg-night px-5 py-2.5 text-sm font-extrabold text-moon">
              <Moon size={16} weight="fill" aria-hidden />
              {`شب ${ordinalFa(night)}`}
            </p>
            <ul className="divide-y divide-line px-5">
              {nightEvents.map((event) => {
                const effect = event.details?.effectType && event.details.effectType !== "NONE" ? EFFECT[event.details.effectType] : null;
                return (
                  <li key={event.id} className="py-3">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {event.abilityLabel}
                      {event.abilityChoiceLabel ? <span className="text-muted">{event.abilityChoiceLabel}</span> : null}
                      {effect ? <span className="nq-tag bg-accent-soft text-accent">{effect}</span> : null}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">{eventLine(event)}</p>
                    {extraLines(event).map((line) => (
                      <p key={line} className="mt-1 text-sm font-medium text-muted">
                        {line}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
