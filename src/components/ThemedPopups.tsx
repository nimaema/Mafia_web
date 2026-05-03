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
          accent: 'bg-[#98000b]',
          border: 'border-red-500/50',
          iconShell: 'bg-[#0e0e0e] text-red-500 border border-red-500/30',
          icon: 'error',
          confirm: 'bg-red-600 text-white hover:bg-red-700',
          single: 'bg-red-600 text-white hover:bg-red-700',
        }
      : type === 'warning'
        ? {
            accent: 'bg-amber-600',
            border: 'border-amber-500/50',
            iconShell: 'bg-[#0e0e0e] text-amber-500 border border-amber-500/30',
            icon: 'warning',
            confirm: 'bg-amber-500 text-black font-black hover:bg-amber-600',
            single: 'bg-amber-500 text-black font-black hover:bg-amber-600',
          }
        : type === 'success'
          ? {
              accent: 'bg-green-600',
              border: 'border-green-500/50',
              iconShell: 'bg-[#0e0e0e] text-green-500 border border-green-500/30',
              icon: 'check_circle',
              confirm: 'bg-green-600 text-white hover:bg-green-700',
              single: 'bg-green-600 text-white hover:bg-green-700',
            }
          : {
              accent: 'bg-zinc-600',
              border: 'border-zinc-500/50',
              iconShell: 'bg-[#0e0e0e] text-zinc-300 border border-zinc-500/30',
              icon: 'info',
              confirm: 'bg-zinc-800 text-white hover:bg-zinc-700',
              single: 'bg-zinc-800 text-white hover:bg-zinc-700',
            };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative w-full max-w-md overflow-hidden border ${palette.border} bg-white dark:bg-[#0e0e0e] shadow-2xl`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-white/10">
          <div className={`h-full w-1/3 ${palette.accent}`} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-4 z-20 flex size-8 items-center justify-center text-zinc-500 transition-all hover:text-black dark:text-zinc-500 dark:hover:text-white"
          aria-label="بستن"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
        
        <div className="p-8 flex flex-col gap-6 relative z-10 mt-2">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center ${palette.iconShell}`}>
              <span className="material-symbols-outlined text-2xl font-black">
                {palette.icon}
              </span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">{title}</h3>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
            {message}
          </p>
          
          <div className="flex gap-3 mt-4">
            {onConfirm && (
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-black transition-all ${palette.confirm}`}
              >
                {confirmText}
              </button>
            )}
            <button 
              onClick={onClose}
              className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-black transition-all ${
                onConfirm ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10' : palette.single
              }`}
            >
              {onConfirm ? cancelText : confirmText}
            </button>
          </div>
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
          shell: 'border-green-500/30 bg-green-50/95 text-green-900 dark:border-green-500/30 dark:bg-[#0e0e0e] dark:text-green-400',
          icon: 'check_circle',
          iconBox: 'bg-green-600 text-white',
          progress: 'bg-green-600',
        }
      : type === 'error'
        ? {
            shell: 'border-red-500/30 bg-red-50/95 text-red-900 dark:border-red-500/30 dark:bg-[#0e0e0e] dark:text-red-400',
            icon: 'error',
            iconBox: 'bg-red-600 text-white',
            progress: 'bg-red-600',
          }
        : type === 'warning'
          ? {
              shell: 'border-amber-500/30 bg-amber-50/95 text-amber-900 dark:border-amber-500/30 dark:bg-[#0e0e0e] dark:text-amber-400',
              icon: 'warning',
              iconBox: 'bg-amber-500 text-black',
              progress: 'bg-amber-500',
            }
          : {
              shell: 'border-zinc-500/30 bg-zinc-50/95 text-zinc-900 dark:border-white/10 dark:bg-[#0e0e0e] dark:text-zinc-300',
              icon: 'info',
              iconBox: 'bg-zinc-800 text-white',
              progress: 'bg-zinc-600',
            };

  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+8.85rem)] md:bottom-8 right-4 left-4 md:left-auto md:w-96 z-[300] animate-in slide-in-from-bottom-10 duration-300">
      <div className={`relative flex items-center gap-4 overflow-hidden border p-4 shadow-2xl backdrop-blur-xl ${palette.shell}`}>
        <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center font-black ${palette.iconBox}`}>
          {palette.icon}
        </span>
        <span className="font-bold text-sm flex-1">{message}</span>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-black/5 dark:bg-white/10">
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

