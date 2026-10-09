"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

/** A labeled on/off switch row. The whole row is the hit target. */
export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-md)] bg-raised px-4 py-3.5 text-right disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        {description ? <span className="mt-0.5 block text-sm font-medium leading-6 text-muted">{description}</span> : null}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-line-strong"}`} aria-hidden>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200 ${checked ? "start-6" : "start-1"}`} />
      </span>
    </button>
  );
}
