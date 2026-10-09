import type { ReactNode } from "react";
import { ShieldCheck, Knife, Star } from "@phosphor-icons/react/dist/ssr";
import { faction, type Faction } from "@/lib/faction";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-raised text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success/14 text-success",
  warning: "bg-warning/16 text-warning",
  danger: "bg-danger/14 text-danger",
};

export function Tag({ tone = "neutral", icon, children, className = "" }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`nq-tag ${TONES[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

const FACTION_ICON = { CITIZEN: ShieldCheck, MAFIA: Knife, NEUTRAL: Star } as const;

export function FactionTag({ alignment, className = "" }: { alignment: Faction | string | null | undefined; className?: string }) {
  const f = faction(alignment);
  if (!f) return null;
  const Icon = FACTION_ICON[alignment as Faction];
  return (
    <span className={`nq-tag ${f.soft} ${f.text} ${className}`}>
      <Icon weight="fill" className="size-3.5" aria-hidden />
      {f.label}
    </span>
  );
}
