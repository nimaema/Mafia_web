import type { ReactNode } from "react";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";

type Tone = "danger" | "success" | "info" | "warning";

const STYLES: Record<Tone, string> = {
  danger: "bg-danger/12 text-danger",
  success: "bg-success/12 text-success",
  info: "bg-accent-soft text-accent",
  warning: "bg-warning/14 text-warning",
};

const ICONS = { danger: WarningCircle, success: CheckCircle, info: Info, warning: WarningCircle } as const;

/** Inline, contextual message. Toasts are only for transient confirmations. */
export function Notice({ tone = "info", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  const Icon = ICONS[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-bold leading-6 ${STYLES[tone]} ${className}`}>
      <Icon size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
