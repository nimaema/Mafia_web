"use client";

import { useEffect } from "react";

type PopupType = "info" | "error" | "warning" | "success";

const popupTone: Record<PopupType, { icon: string; accent: string; button: string }> = {
  info: { icon: "info", accent: "text-cyan-200 border-cyan-300/25 bg-cyan-300/10", button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200" },
  success: { icon: "check_circle", accent: "text-emerald-200 border-emerald-300/25 bg-emerald-300/10", button: "bg-emerald-300 text-slate-950 hover:bg-emerald-200" },
  warning: { icon: "warning", accent: "text-amber-200 border-amber-300/25 bg-amber-300/10", button: "bg-amber-300 text-slate-950 hover:bg-amber-200" },
  error: { icon: "error", accent: "text-rose-200 border-rose-300/25 bg-rose-400/10", button: "bg-rose-500 text-white hover:bg-rose-400" },
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: PopupType;
};

export const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = "تایید", cancelText = "لغو", type = "info" }: ModalProps) => {
  if (!isOpen) return null;
  const tone = popupTone[type];

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/65 p-3 backdrop-blur-md md:items-center" dir="rtl">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="بستن" />
      <div className="pm-safe-sheet pm-surface relative z-10 w-full max-w-md p-5">
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${tone.accent}`}>
            {tone.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-zinc-50">{title}</h3>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
          </div>
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full w-2/3 ${type === "error" ? "bg-rose-400" : type === "warning" ? "bg-amber-300" : type === "success" ? "bg-emerald-300" : "bg-cyan-300"}`} />
        </div>

        <div className="mt-5 flex gap-2">
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`min-h-11 flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${tone.button}`}
            >
              {confirmText}
            </button>
          )}
          <button
            onClick={onClose}
            className={`${onConfirm ? "flex-1 border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-cyan-300/25" : `w-full ${tone.button}`} min-h-11 rounded-xl px-4 py-2.5 text-sm font-black transition-all`}
          >
            {onConfirm ? cancelText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

type ToastProps = {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const tone = popupTone[type];

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[260] md:bottom-6 md:left-6 md:right-auto md:w-96" dir="rtl">
      <div className={`flex items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl ${tone.accent}`}>
        <span className="material-symbols-outlined text-[20px]">{tone.icon}</span>
        <span className="flex-1 text-sm font-black">{message}</span>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
