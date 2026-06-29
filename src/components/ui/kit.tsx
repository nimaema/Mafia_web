"use client";

/**
 * مافیا بورد v3 UI kit — the shared atoms every screen composes from.
 * Pure --pm-* token consumers, so each adapts to Neon Tehran (dark) and
 * Daylight Atelier (light) with no per-theme code.
 */

import type { ReactNode } from "react";
import { useEffect } from "react";

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export const toFa = (n: number | string) => Number(n).toLocaleString("fa-IR");

type Alignment = "CITIZEN" | "MAFIA" | "NEUTRAL" | string;

export function factionColor(a?: Alignment) {
  if (a === "MAFIA") return "var(--pm-danger)";
  if (a === "CITIZEN") return "var(--pm-blue)";
  if (a === "NEUTRAL") return "var(--pm-violet)";
  return "var(--pm-muted)";
}
export function factionLabel(a?: Alignment) {
  if (a === "MAFIA") return "مافیا";
  if (a === "CITIZEN") return "شهروند";
  if (a === "NEUTRAL") return "مستقل";
  return "—";
}

export function SectionHeader({ eyebrow, title, sub, action, size = "lg" }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode; size?: "lg" | "md" }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <span className="pm-eyebrow">{eyebrow}</span>}
        <h2 className={cx("font-display font-bold text-[var(--pm-text)]", eyebrow && "mt-1.5", size === "lg" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")}>{title}</h2>
        {sub && <p className="mt-1.5 max-w-xl text-sm font-semibold leading-7 text-[var(--pm-muted)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function FactionBadge({ alignment, children }: { alignment?: Alignment; children?: ReactNode }) {
  const c = factionColor(alignment);
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-[11px] font-black"
      style={{ borderColor: `color-mix(in oklab, ${c} 38%, transparent)`, background: `color-mix(in oklab, ${c} 13%, transparent)`, color: c }}>
      {children ?? factionLabel(alignment)}
    </span>
  );
}

export function StatTile({ label, value, icon, tone = "var(--pm-text)" }: { label: string; value: ReactNode; icon?: string; tone?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-3.5">
      <div className="flex items-center justify-between">
        {icon && <span className="material-symbols-outlined text-lg text-[var(--pm-muted)]">{icon}</span>}
        <p className="font-display text-2xl font-bold leading-none" style={{ color: tone }} dir="ltr">{value}</p>
      </div>
      <p className="mt-2 text-[11px] font-bold text-[var(--pm-muted)]">{label}</p>
    </div>
  );
}

export function LedgerRow({ glyph, glyphTone = "var(--pm-primary)", title, code, meta, end, onClick, href }: { glyph: string; glyphTone?: string; title: ReactNode; code?: string; meta?: ReactNode; end?: ReactNode; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: `color-mix(in oklab, ${glyphTone} 40%, transparent)`, background: `color-mix(in oklab, ${glyphTone} 13%, transparent)`, color: glyphTone }}>
        <span className="material-symbols-outlined text-xl">{glyph}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-lg font-bold text-[var(--pm-text)]">{title}</span>
          {code && <span className="rounded-[var(--radius-sm)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] px-1.5 py-0.5 font-mono text-[10px] font-black text-[var(--pm-primary)]" dir="ltr">#{code}</span>}
        </span>
        {meta && <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold text-[var(--pm-muted)]">{meta}</span>}
      </span>
      {end && <span className="flex shrink-0 items-center gap-2">{end}</span>}
    </>
  );
  const className = "group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--pm-line)] bg-[var(--pm-surface)] p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/40 hover:shadow-[var(--pm-shadow-soft)] sm:gap-4 sm:p-4";
  if (href) return <a href={href} className={className}>{inner}</a>;
  return <button type="button" onClick={onClick} className={className}>{inner}</button>;
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-8 text-center">
      <span className="grid size-20 place-items-center rounded-full border border-[var(--pm-line)] bg-[var(--pm-surface)] text-[var(--pm-muted)]">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </span>
      <div>
        <p className="font-display text-xl font-bold text-[var(--pm-text)]">{title}</p>
        {text && <p className="mx-auto mt-1.5 max-w-sm text-sm font-semibold leading-7 text-[var(--pm-muted)]">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export type SegOption<T extends string> = { key: T; label: string; count?: number };
export function Segmented<T extends string>({ options, value, onChange, className }: { options: SegOption<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx("custom-scrollbar -mx-1 flex gap-1.5 overflow-x-auto rounded-[var(--radius-pill)] border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] p-1", className)}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)}
            className={cx("flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-black transition-all duration-200",
              active ? "bg-gradient-to-b from-[var(--pm-primary)] to-[var(--pm-primary-strong)] text-[var(--pm-text-inverse)] shadow-[var(--pm-shadow-glow)]" : "text-[var(--pm-muted)] hover:bg-[var(--pm-surface)] hover:text-[var(--pm-text)]")}>
            {o.label}
            {typeof o.count === "number" && <span className={cx("grid min-w-5 place-items-center rounded-full px-1 text-[10px]", active ? "bg-black/20" : "bg-[var(--pm-surface)] text-[var(--pm-muted)]")}>{toFa(o.count)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[var(--radius-md)] bg-[var(--pm-surface-soft)]", className)} />;
}

export function Modal({ open, onClose, eyebrow, title, sub, children, maxWidth = "max-w-2xl" }: { open: boolean; onClose: () => void; eyebrow?: string; title?: string; sub?: string; children: ReactNode; maxWidth?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/70 backdrop-blur-xl sm:items-center" onClick={onClose} dir="rtl">
      <div className={cx("pm-card pm-safe-modal custom-scrollbar w-full overflow-y-auto rounded-[var(--radius-xl)] p-5 text-[var(--pm-text)] sm:p-6", maxWidth)} onClick={(e) => e.stopPropagation()}>
        {(title || eyebrow) && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <span className="pm-eyebrow">{eyebrow}</span>}
              {title && <h3 className={cx("font-display text-2xl font-bold sm:text-3xl", eyebrow && "mt-2")}>{title}</h3>}
              {sub && <p className="mt-2 text-sm font-bold text-[var(--pm-muted)]">{sub}</p>}
            </div>
            <button onClick={onClose} aria-label="بستن" className="pm-icon-button size-10 shrink-0 shadow-none"><span className="material-symbols-outlined text-xl">close</span></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, side = "end", title, children, width = "w-[min(26rem,90vw)]" }: { open: boolean; onClose: () => void; side?: "start" | "end"; title?: string; children: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const sideClass = side === "start" ? "right-0" : "left-0";
  const hidden = side === "start" ? "translate-x-full" : "-translate-x-full";
  return (
    <>
      {open && <button type="button" aria-label="بستن" className="fixed inset-0 z-[250] bg-black/55 backdrop-blur-[3px]" onClick={onClose} />}
      <aside dir="rtl" className={cx("fixed inset-y-0 z-[260] overflow-y-auto border-[var(--pm-line)] bg-[var(--pm-surface)]/97 p-4 backdrop-blur-2xl transition-transform duration-300 ease-[var(--ease-fluid)]", sideClass, width, side === "start" ? "border-l" : "border-r", open ? "translate-x-0" : hidden)}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">{title}</h3>
            <button onClick={onClose} aria-label="بستن" className="pm-icon-button size-9 shadow-none"><span className="material-symbols-outlined text-lg">close</span></button>
          </div>
        )}
        {children}
      </aside>
    </>
  );
}

export function FactionSplitBar({ citizen = 0, mafia = 0, neutral = 0 }: { citizen?: number; mafia?: number; neutral?: number }) {
  const total = Math.max(1, citizen + mafia + neutral);
  const seg = (n: number, c: string) => (n > 0 ? <span style={{ width: `${(n / total) * 100}%`, background: c }} className="h-full" /> : null);
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-[var(--pm-line)]">
      {seg(citizen, "var(--pm-blue)")}
      {seg(mafia, "var(--pm-danger)")}
      {seg(neutral, "var(--pm-violet)")}
    </div>
  );
}
