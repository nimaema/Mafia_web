"use client";

import { factionColor, factionLabel, cx } from "@/components/ui/kit";

type Props = {
  name: string;
  alignment?: "CITIZEN" | "MAFIA" | "NEUTRAL" | string;
  ability?: string | null;
  icon?: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
  compact?: boolean;
};

// Default icon by faction when a role has none.
function defaultIcon(alignment?: string) {
  if (alignment === "MAFIA") return "local_fire_department";
  if (alignment === "NEUTRAL") return "casino";
  return "shield_person";
}

/**
 * A face-up role card in the Midnight Salon language — used in the roles
 * browser, the scenario-builder palette, and as a player's role reveal.
 */
export function RoleCard({ name, alignment, ability, icon, count, selected, onClick, action, compact }: Props) {
  const c = factionColor(alignment);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "group relative flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border p-3.5 text-right transition-all duration-300",
        onClick && "hover:-translate-y-0.5 hover:shadow-[var(--pm-shadow)]",
        compact ? "gap-2" : "gap-3"
      )}
      style={{
        borderColor: selected ? c : "var(--pm-line)",
        background: "linear-gradient(180deg, color-mix(in oklab, var(--pm-surface) 92%, transparent), var(--pm-surface))",
        boxShadow: selected ? `0 0 0 1px ${c}, var(--pm-shadow-soft)` : undefined,
      }}
    >
      <span className="absolute inset-y-0 right-0 w-[3px]" style={{ background: `linear-gradient(180deg, transparent, ${c}, transparent)`, opacity: selected ? 1 : 0.5 }} />
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border" style={{ borderColor: `color-mix(in oklab, ${c} 45%, transparent)`, background: `color-mix(in oklab, ${c} 14%, transparent)`, color: c }}>
          <span className="material-symbols-outlined text-[1.3rem]">{icon || defaultIcon(alignment)}</span>
        </span>
        <span className="flex items-center gap-2">
          {typeof count === "number" && count > 0 && (
            <span className="grid size-7 place-items-center rounded-full text-xs font-black" style={{ background: `color-mix(in oklab, ${c} 18%, transparent)`, color: c }} dir="ltr">{count.toLocaleString("fa-IR")}</span>
          )}
          <span className="rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-black" style={{ borderColor: `color-mix(in oklab, ${c} 35%, transparent)`, color: c }}>{factionLabel(alignment)}</span>
        </span>
      </div>
      <div>
        <p className="font-display text-lg font-bold leading-tight" style={{ color: c }}>{name}</p>
        {ability && !compact && <p className="mt-1.5 line-clamp-3 text-[11.5px] font-semibold leading-5 text-[var(--pm-muted)]">{ability}</p>}
      </div>
      {action}
    </Tag>
  );
}
