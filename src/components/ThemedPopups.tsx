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

  const accentClass =
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-amber-500' :
    type === 'success' ? 'bg-lime-500' :
    'bg-sky-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 blur-[60px] pointer-events-none"></div>
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white/80 text-zinc-500 transition-all hover:bg-zinc-950 hover:text-white dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-950"
          aria-label="بستن"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
        
        <div className="p-8 flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              type === 'error' ? 'bg-red-500/10 text-red-500' : 
              type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
              type === 'success' ? 'bg-lime-500/10 text-lime-500' : 
              'bg-blue-500/10 text-blue-500'
            }`}>
              <span className="material-symbols-outlined text-2xl font-black">
                {type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'check_circle' : 'info'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
          </div>
          
          <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
            {message}
          </p>
          
          <div className="flex gap-3 mt-2">
            {onConfirm && (
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 py-4 rounded-lg font-black text-sm transition-all shadow-lg ${
                  type === 'error' ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' :
                  type === 'warning' ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/20' :
                  'bg-lime-500 text-zinc-950 hover:bg-lime-400 shadow-lime-500/20'
                }`}
              >
                {confirmText}
              </button>
            )}
            <button 
              onClick={onClose}
              className={`flex-1 py-4 rounded-lg font-black text-sm transition-all ${
                onConfirm ? 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800' : 'bg-lime-500 text-zinc-950 hover:bg-lime-400 shadow-lime-500/20'
              }`}
            >
              {onConfirm ? cancelText : confirmText}
            </button>
          </div>
        </div>
        <div className="h-1 bg-zinc-100 dark:bg-white/10">
          <div className={`h-full w-1/3 rounded-l-full ${accentClass} animate-pulse`} />
        </div>
      </div>
    </div>
  );
};

type ToastProps = {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const durationMs = 5000;

  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 z-[300] animate-in slide-in-from-bottom-10 duration-300">
      <div className={`relative overflow-hidden p-4 rounded-lg border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${
        type === 'success' ? 'bg-lime-500/10 border-lime-500/20 text-lime-600 dark:text-lime-400' :
        type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' :
        'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
      }`}>
        <span className="material-symbols-outlined font-black">
          {type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
        </span>
        <span className="font-bold text-sm flex-1">{message}</span>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg bg-black/5 dark:bg-white/10">
          <span
            className={`block h-full ${
              type === 'success' ? 'bg-lime-500' : type === 'error' ? 'bg-red-500' : 'bg-sky-500'
            }`}
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
