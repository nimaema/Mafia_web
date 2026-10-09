"use client";

import { useEffect } from "react";
import { CheckCircle, Info, Warning, WarningCircle, X } from "@phosphor-icons/react";

type PopupTone = "info" | "error" | "warning" | "success";

const TONE = {
  info: { Icon: Info, box: "bg-accent-soft text-accent", button: "nq-btn-primary" },
  success: { Icon: CheckCircle, box: "bg-success/14 text-success", button: "nq-btn-primary" },
  warning: { Icon: Warning, box: "bg-warning/16 text-warning", button: "nq-btn-primary" },
  error: { Icon: WarningCircle, box: "bg-danger/12 text-danger", button: "nq-btn-danger" },
} as const;

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: PopupTone;
};

export const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = "باشه", cancelText = "انصراف", type = "info" }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const tone = TONE[type];

  return (
    <div className="fixed inset-0 z-[520] flex items-end justify-center p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:items-center sm:p-6" dir="rtl" role="alertdialog" aria-modal="true" aria-labelledby="popup-title" aria-describedby="popup-message">
      <button type="button" className="motion-page absolute inset-0 bg-black/55" onClick={onClose} aria-label="بستن" />
      <div className="motion-reveal relative w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-6">
        <div className="flex items-start gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-[0.9rem] ${tone.box}`}>
            <tone.Icon size={26} weight="fill" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 id="popup-title" className="text-lg font-extrabold leading-7">
              {title}
            </h2>
            <p id="popup-message" className="mt-1.5 font-medium leading-7 text-muted">
              {message}
            </p>
          </div>
        </div>
        <div className={`mt-6 grid gap-2 ${onConfirm ? "grid-cols-2" : ""}`}>
          {onConfirm ? (
            <>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`nq-btn nq-btn-lg ${type === "warning" || type === "error" ? "nq-btn-danger" : "nq-btn-primary"}`}
              >
                {confirmText === "باشه" ? "بله، ادامه" : confirmText}
              </button>
              <button type="button" onClick={onClose} className="nq-btn nq-btn-secondary nq-btn-lg">
                {cancelText}
              </button>
            </>
          ) : (
            <button type="button" autoFocus onClick={onClose} className={`nq-btn nq-btn-lg ${tone.button}`}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

type ToastProps = {
  message: string;
  type: PopupTone;
  onClose: () => void;
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const tone = TONE[type];

  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[600] flex justify-center md:inset-x-auto md:left-6 md:top-6" dir="rtl" role="status" aria-live="polite">
      <div className="motion-reveal flex w-full max-w-sm items-center gap-3 rounded-[var(--radius-md)] bg-raised p-2.5 ps-3 shadow-[var(--nq-shadow)] ring-1 ring-line">
        <span className={`grid size-9 shrink-0 place-items-center rounded-[0.7rem] ${tone.box}`}>
          <tone.Icon size={20} weight="fill" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm font-bold leading-6">{message}</span>
        <button type="button" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-[0.6rem] text-muted hover:text-fg" aria-label="بستن پیام">
          <X size={16} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
};
