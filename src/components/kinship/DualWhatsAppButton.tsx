import React from 'react';
import { openWhatsApp } from '../../utils/whatsapp';

export interface DualWhatsAppButtonProps {
  phoneNumber: string;
  draftText?: string;
  onChatLogged?: () => void;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'row' | 'col' | 'auto';
  variant?: 'full' | 'compact';
  className?: string;
}

export const DualWhatsAppButton: React.FC<DualWhatsAppButtonProps> = ({
  phoneNumber,
  draftText,
  onChatLogged,
  size = 'md',
  layout = 'auto',
  variant = 'full',
  className = '',
}) => {
  const handleRegularClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openWhatsApp(phoneNumber, draftText, 'regular');
    onChatLogged?.();
  };

  const handleBusinessClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openWhatsApp(phoneNumber, draftText, 'business');
    onChatLogged?.();
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-3.5 py-2 text-xs sm:text-sm gap-2 min-h-[40px]',
    lg: 'px-4 py-2.5 text-sm sm:text-base gap-2.5 min-h-[44px]',
  }[size];

  const layoutClasses = {
    row: 'flex flex-row items-center gap-2',
    col: 'flex flex-col items-stretch gap-2',
    auto: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2',
  }[layout];

  const isDisabled = !phoneNumber || !phoneNumber.trim();

  return (
    <div className={`${layoutClasses} w-full ${className}`}>
      {/* Regular WhatsApp Button */}
      <button
        type="button"
        aria-label="Kirim via WhatsApp"
        onClick={handleRegularClick}
        disabled={isDisabled}
        className={`flex-1 min-w-0 inline-flex items-center justify-center font-medium rounded-full text-white bg-[#25D366] hover:bg-emerald-600 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${sizeClasses}`}
      >
        <span aria-hidden="true" className="text-base leading-none shrink-0">💬</span>
        <span className="truncate">{variant === 'compact' ? 'WA' : 'Kirim via WhatsApp'}</span>
      </button>

      {/* WhatsApp Business Button */}
      <button
        type="button"
        aria-label="Kirim via WhatsApp Business"
        onClick={handleBusinessClick}
        disabled={isDisabled}
        className={`flex-1 min-w-0 inline-flex items-center justify-center font-medium rounded-full text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${sizeClasses}`}
      >
        <span aria-hidden="true" className="text-base leading-none shrink-0">💼</span>
        <span className="truncate">{variant === 'compact' ? 'Bisnis' : 'Kirim via WhatsApp Business'}</span>
      </button>
    </div>
  );
};
