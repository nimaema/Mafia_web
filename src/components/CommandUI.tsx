import Link from "next/link";
import type { ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Tone = "cyan" | "emerald" | "amber" | "rose" | "violet" | "neutral";

const toneClasses: Record<Tone, string> = {
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  rose: "border-rose-400/35 bg-rose-400/10 text-rose-200",
  violet: "border-violet-400/35 bg-violet-400/10 text-violet-200",
  neutral: "border-white/10 bg-white/[0.04] text-zinc-300",
};

export function StatusChip({
  children,
  tone = "neutral",
  pulse = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black leading-none", toneClasses[tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", pulse && "animate-pulse", {
        cyan: "bg-cyan-300",
        emerald: "bg-emerald-300",
        amber: "bg-amber-300",
        rose: "bg-rose-300",
        violet: "bg-violet-300",
        neutral: "bg-zinc-400",
      }[tone])} />
      {children}
    </span>
  );
}

export function CommandSurface({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cn("pm-surface", interactive && "pm-surface-interactive", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
  icon,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="material-symbols-outlined grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">{eyebrow}</p>}
          <h2 className="truncate text-lg font-black tracking-tight text-zinc-50">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function CommandButton({
  children,
  href,
  tone = "cyan",
  className,
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  href?: string;
  tone?: Exclude<Tone, "neutral"> | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all",
    tone === "cyan" && "bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)] hover:bg-cyan-200",
    tone === "emerald" && "bg-emerald-300 text-slate-950 hover:bg-emerald-200",
    tone === "amber" && "bg-amber-300 text-slate-950 hover:bg-amber-200",
    tone === "rose" && "bg-rose-500 text-white hover:bg-rose-400",
    tone === "violet" && "bg-violet-400 text-white hover:bg-violet-300",
    tone === "ghost" && "border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-cyan-300/30 hover:bg-cyan-300/10",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <CommandSurface className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="material-symbols-outlined text-4xl text-cyan-200/50">{icon}</span>
      <div>
        <p className="font-black text-zinc-100">{title}</p>
        {text && <p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p>}
      </div>
      {action}
    </CommandSurface>
  );
}

export function StatCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={cn("rounded-2xl border p-3", toneClasses[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70">{label}</p>
      <div className="mt-1 text-lg font-black text-zinc-50">{value}</div>
    </div>
  );
}
