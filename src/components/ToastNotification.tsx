import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: Toast = { id, type, message, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container floating at top-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-zinc-950/95 border-emerald-500/40 text-zinc-100 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-zinc-950/95 border-rose-500/40 text-zinc-100 shadow-rose-950/40'
                : 'bg-zinc-950/95 border-cyan-500/40 text-zinc-100 shadow-cyan-950/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <Info className="w-5 h-5 text-cyan-400" />
              )}
            </div>

            <div className="flex-1 text-xs">
              {toast.title && <div className="font-bold text-white mb-0.5">{toast.title}</div>}
              <div className="text-zinc-300 leading-relaxed font-medium">{toast.message}</div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-zinc-500 hover:text-zinc-200 transition rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  const showToast = context?.showToast || ((msg: string) => console.log('Toast:', msg));
  return {
    showToast,
    toast: {
      success: (msg: string, title?: string) => showToast(msg, 'success', title),
      error: (msg: string, title?: string) => showToast(msg, 'error', title),
      info: (msg: string, title?: string) => showToast(msg, 'info', title),
    },
    success: (msg: string, title?: string) => showToast(msg, 'success', title),
    error: (msg: string, title?: string) => showToast(msg, 'error', title),
    info: (msg: string, title?: string) => showToast(msg, 'info', title),
  };
};
