import React from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onClose,
}) => {
  if (!visible) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
    error: <XCircle size={16} className="text-rose-400 shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg text-sm flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/50 max-w-[90vw] whitespace-nowrap"
    >
      {icons[type]}
      <span className="font-medium text-slate-100 text-xs md:text-sm">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="ml-1 text-slate-400 hover:text-white transition-colors p-0.5 rounded-full focus:outline-none"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
