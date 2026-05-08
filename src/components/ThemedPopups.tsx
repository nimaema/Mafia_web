"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'error' | 'warning' | 'success';
};

export const Modal = ({ isOpen, onClose, title, message, onConfirm, confirmText = "تایید", cancelText = "لغو", type = 'info' }: ModalProps) => {
  if (!isOpen) return null;

  const palette =
    type === 'error'
      ? {
          accent: 'bg-[var(--pm-danger)]',
          orb: 'bg-[var(--pm-danger)]/10',
          iconBox: 'text-[var(--pm-danger)] border-[var(--pm-danger)]/20 bg-[var(--pm-danger)]/10',
          icon: 'error',
          confirmBtn: 'ui-button-danger',
        }
      : type === 'warning'
        ? {
            accent: 'bg-[var(--pm-warning)]',
            orb: 'bg-[var(--pm-warning)]/10',
            iconBox: 'text-[var(--pm-warning)] border-[var(--pm-warning)]/20 bg-[var(--pm-warning)]/10',
            icon: 'warning',
            confirmBtn: 'ui-button-primary',
          }
        : type === 'success'
          ? {
              accent: 'bg-[var(--pm-success)]',
              orb: 'bg-[var(--pm-success)]/10',
              iconBox: 'text-[var(--pm-success)] border-[var(--pm-success)]/20 bg-[var(--pm-success)]/10',
              icon: 'check_circle',
              confirmBtn: 'ui-button-primary',
            }
          : {
              accent: 'bg-[var(--pm-primary)]',
              orb: 'bg-[var(--pm-primary)]/10',
              iconBox: 'text-[var(--pm-primary)] border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10',
              icon: 'info',
              confirmBtn: 'ui-button-primary',
            };

  return (
    <div className="fixed inset-0 z-[520] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:items-center sm:p-4" dir="rtl">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60 dark:backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />
      <div className="pm-safe-modal motion-pop ui-card relative flex w-full max-w-md flex-col overflow-hidden !rounded-[var(--radius-lg)] shadow-2xl">
        <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-[60px] ${palette.orb}`}></div>
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-xl border border-[var(--pm-line)] bg-[var(--pm-surface-soft)] text-[var(--pm-muted)] transition-all hover:bg-[var(--pm-line)] hover:text-[var(--pm-text)]"
          aria-label="بستن"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
        
        <div className="custom-scrollbar relative z-10 flex min-h-0 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${palette.iconBox}`}>
              <span className="material-symbols-outlined text-2xl font-black">
                {palette.icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pm-primary)] opacity-80">MESSAGE</p>
              <h3 className="mt-1 break-words text-xl font-black leading-7 text-[var(--pm-text)]">{title}</h3>
            </div>
          </div>
          
          <p className="ui-muted p-4 text-sm font-bold leading-7 text-[var(--pm-text)] opacity-90">
            {message}
          </p>
          
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            {onConfirm && (
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={palette.confirmBtn}
              >
                {confirmText}
              </button>
            )}
            <button 
              onClick={onClose}
              className={onConfirm ? 'ui-button-secondary' : palette.confirmBtn}
            >
              {onConfirm ? cancelText : confirmText}
            </button>
          </div>
        </div>
        <div className="h-1 bg-[var(--pm-line)] w-full absolute bottom-0 left-0 right-0">
          <div className={`h-full w-1/3 animate-pulse rounded-l-full ${palette.accent}`} />
        </div>
      </div>
    </div>
  );
};

type ToastProps = {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const durationMs = 5000;
  const palette =
    type === 'success'
      ? {
          shell: 'border-[var(--pm-success)]/30 bg-[var(--pm-surface)] text-[var(--pm-success)] shadow-2xl',
          icon: 'check_circle',
          iconBox: 'bg-[var(--pm-success)]/10 text-[var(--pm-success)]',
          progress: 'bg-[var(--pm-success)]',
        }
      : type === 'error'
        ? {
            shell: 'border-[var(--pm-danger)]/30 bg-[var(--pm-surface)] text-[var(--pm-danger)] shadow-2xl',
            icon: 'error',
            iconBox: 'bg-[var(--pm-danger)]/10 text-[var(--pm-danger)]',
            progress: 'bg-[var(--pm-danger)]',
          }
        : type === 'warning'
          ? {
              shell: 'border-[var(--pm-warning)]/30 bg-[var(--pm-surface)] text-[var(--pm-warning)] shadow-2xl',
              icon: 'warning',
              iconBox: 'bg-[var(--pm-warning)]/10 text-[var(--pm-warning)]',
              progress: 'bg-[var(--pm-warning)]',
            }
          : {
              shell: 'border-[var(--pm-primary)]/30 bg-[var(--pm-surface)] text-[var(--pm-primary)] shadow-2xl',
              icon: 'info',
              iconBox: 'bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]',
              progress: 'bg-[var(--pm-primary)]',
            };

  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-3 right-3 z-[600] animate-in slide-in-from-top-4 duration-300 md:left-auto md:right-6 md:w-[26rem]" dir="rtl">
      <div className={`relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-md)] border p-3 shadow-2xl backdrop-blur-2xl ${palette.shell}`}>
        <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-black ${palette.iconBox}`}>
          {palette.icon}
        </span>
        <span className="flex-1 text-sm font-black leading-6 text-[var(--pm-text)]">{message}</span>
        <button onClick={onClose} className="grid size-8 place-items-center rounded-[var(--radius-xs)] bg-[var(--pm-line)] text-[var(--pm-muted)] transition-opacity hover:opacity-100 opacity-70">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-[var(--radius-md)] bg-[var(--pm-line)]">
          <span
            className={`block h-full ${palette.progress}`}
            style={{ animation: `toast-progress ${durationMs}ms linear forwards` }}
          />
        </span>
      </div>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
