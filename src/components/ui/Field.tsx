import type { ComponentProps, ReactNode } from "react";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  /** Right-aligned element in the label row, e.g. a "forgot password" link. */
  aside?: ReactNode;
  hint?: string;
  error?: string | null;
};

/** Label above, input, then hint or error below. Never placeholder-as-label. */
export function Field({ label, aside, hint, error, id, name, className = "", ...input }: FieldProps) {
  const fieldId = id || (name ? `field-${name}` : undefined);
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-bold text-fg">
          {label}
        </label>
        {aside}
      </div>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${error ? "border-danger" : ""} ${className}`}
        {...input}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs font-bold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs font-medium leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
