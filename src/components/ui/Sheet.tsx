"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional element shown above the title (e.g. a result badge). */
  eyebrow?: ReactNode;
  /** Replaces the default plain header, e.g. a drenched result banner. */
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
};

/** Bottom sheet on phones, centered dialog on larger screens. Escape and the backdrop close it. */
export function Sheet({ open, onClose, title, eyebrow, header, children, footer, size = "md" }: SheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  // Portal to <body> so page-level stacking contexts (entrance animations) never trap the sheet under the nav.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" dir="rtl" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="motion-page absolute inset-0 bg-black/55" aria-label="بستن" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={`motion-reveal relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] bg-surface outline-none sm:rounded-[var(--radius-xl)] ${size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
      >
        {header ? (
          <div className="relative">
            {header}
            <span id={titleId} className="sr-only">
              {title}
            </span>
            <button type="button" onClick={onClose} className="nq-icon-btn absolute left-4 top-4 bg-black/15 text-current hover:text-current" aria-label="بستن">
              <X size={20} weight="bold" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-5">
            <div className="min-w-0">
              {eyebrow}
              <h2 id={titleId} className="text-xl font-extrabold leading-8">
                {title}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="nq-icon-btn shrink-0" aria-label="بستن">
              <X size={20} weight="bold" aria-hidden />
            </button>
          </div>
        )}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-line px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
