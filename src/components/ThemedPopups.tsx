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
          accent: 'bg-red-500',
          orb: 'bg-red-500/10',
          iconShell: 'bg-red-500/10 text-red-500',
          icon: 'error',
          confirm: 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20',
          single: 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20',
        }
      : type === 'warning'
        ? {
            accent: 'bg-amber-500',
            orb: 'bg-amber-500/10',
            iconShell: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            icon: 'warning',
            confirm: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/20',
            single: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/20',
          }
        : type === 'success'
          ? {
              accent: 'bg-cyan-500',
              orb: 'bg-cyan-500/10',
              iconShell: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
              icon: 'check_circle',
              confirm: 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-cyan-500/20',
              single: 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-cyan-500/20',
            }
          : {
              accent: 'bg-sky-500',
              orb: 'bg-sky-500/10',
              iconShell: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
              icon: 'info',
              confirm: 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20',
              single: 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20',
            };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:items-center sm:p-4">
      <div 
        className="absolute inset-0 bg-zinc-950/78 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />
      <div className="pm-safe-modal motion-pop relative flex w-full max-w-md flex-col overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#15171b]/96 text-white shadow-2xl shadow-black/45 backdrop-blur-2xl">
        <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-[70px] ${palette.orb}`}></div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,212,0.12),transparent_18rem)]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/62 transition-all hover:bg-white hover:text-zinc-950"
          aria-label="بستن"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
        
        <div className="custom-scrollbar relative z-10 flex min-h-0 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${palette.iconShell}`}>
              <span className="material-symbols-outlined text-2xl font-black">
                {palette.icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">MESSAGE</p>
              <h3 className="mt-1 break-words text-xl font-black leading-7 text-white">{title}</h3>
            </div>
          </div>
          
          <p className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm font-bold leading-7 text-white/68">
            {message}
          </p>
          
          <div className="grid gap-2 sm:grid-cols-2">
            {onConfirm && (
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`min-h-12 rounded-2xl px-4 text-sm font-black shadow-lg transition-all ${palette.confirm}`}
              >
                {confirmText}
              </button>
            )}
            <button 
              onClick={onClose}
              className={`min-h-12 rounded-2xl px-4 text-sm font-black transition-all ${
                onConfirm ? 'border border-white/10 bg-white/[0.07] text-white/70 hover:bg-white hover:text-zinc-950' : palette.single
              }`}
            >
              {onConfirm ? cancelText : confirmText}
            </button>
          </div>
        </div>
        <div className="h-1 bg-white/10">
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
          shell: 'border-cyan-500/30 bg-cyan-50/95 text-cyan-700 shadow-cyan-950/10 dark:border-cyan-400/25 dark:bg-cyan-950/35 dark:text-cyan-300',
          icon: 'check_circle',
          iconBox: 'bg-cyan-500 text-zinc-950',
          progress: 'bg-cyan-500',
        }
      : type === 'error'
        ? {
            shell: 'border-red-500/30 bg-red-50/95 text-red-700 shadow-red-950/10 dark:border-red-400/25 dark:bg-red-950/35 dark:text-red-300',
            icon: 'error',
            iconBox: 'bg-red-500 text-white',
            progress: 'bg-red-500',
          }
        : type === 'warning'
          ? {
              shell: 'border-amber-500/35 bg-amber-50/95 text-amber-800 shadow-amber-950/10 dark:border-amber-400/25 dark:bg-amber-950/35 dark:text-amber-300',
              icon: 'warning',
              iconBox: 'bg-amber-500 text-zinc-950',
              progress: 'bg-amber-500',
            }
          : {
              shell: 'border-sky-500/30 bg-sky-50/95 text-sky-700 shadow-sky-950/10 dark:border-sky-400/25 dark:bg-sky-950/35 dark:text-sky-300',
              icon: 'info',
              iconBox: 'bg-sky-500 text-white',
              progress: 'bg-sky-500',
            };

  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+8.85rem)] right-3 left-3 z-[300] animate-in slide-in-from-bottom-10 duration-300 md:bottom-8 md:left-auto md:right-6 md:w-96">
      <div className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl ${palette.shell}`}>
        <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-xl font-black shadow-sm ${palette.iconBox}`}>
          {palette.icon}
        </span>
        <span className="flex-1 text-sm font-black leading-6">{message}</span>
        <button onClick={onClose} className="grid size-8 place-items-center rounded-xl bg-black/5 opacity-60 transition-opacity hover:opacity-100 dark:bg-white/10">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-2xl bg-black/5 dark:bg-white/10">
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
