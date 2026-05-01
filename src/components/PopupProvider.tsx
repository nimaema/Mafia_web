"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, Toast } from './ThemedPopups';

type PopupType = 'info' | 'error' | 'warning' | 'success';

type PopupContextType = {
  showAlert: (title: string, message: string, type?: PopupType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: 'warning' | 'error') => void;
  showToast: (message: string, type?: PopupType) => void;
};

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: PopupType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [toasts, setToasts] = useState<{ id: number; message: string; type: PopupType }[]>([]);

  const showAlert = (title: string, message: string, type: PopupType = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type?: 'warning' | 'error') => {
    const destructive = /حذف|لغو|مسدود|بن|پاک|delete|remove/i.test(`${title} ${message}`);
    setModal({ isOpen: true, title, message, type: type || (destructive ? 'error' : 'warning'), onConfirm });
  };

  const showToast = (message: string, type: PopupType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+8.85rem)] md:bottom-8 right-0 left-0 flex flex-col items-center gap-2 z-[300] pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => removeToast(toast.id)} 
            />
          </div>
        ))}
      </div>
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) throw new Error("usePopup must be used within a PopupProvider");
  return context;
}
