import React from 'react';
import { openWhatsApp } from '../../utils/whatsapp';

export interface DualWhatsAppButtonProps {
  phoneNumber: string;
  draftText?: string;
  onChatLogged?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DualWhatsAppButton: React.FC<DualWhatsAppButtonProps> = ({
  phoneNumber,
  draftText,
  onChatLogged,
  size = 'md',
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
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-5 py-3 text-base gap-2.5 min-h-[48px]',
  }[size];

  const isDisabled = !phoneNumber || !phoneNumber.trim();

  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full ${className}`}
    >
      {/* Regular WhatsApp Button */}
      <button
        type="button"
        onClick={handleRegularClick}
        disabled={isDisabled}
        className={`flex-1 inline-flex items-center justify-center font-medium rounded-full text-white bg-[#25D366] hover:bg-emerald-600 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${sizeClasses}`}
      >
        <span aria-hidden="true" className="text-base leading-none">💬</span>
        <span>Kirim via WhatsApp</span>
      </button>

      {/* WhatsApp Business Button */}
      <button
        type="button"
        onClick={handleBusinessClick}
        disabled={isDisabled}
        className={`flex-1 inline-flex items-center justify-center font-medium rounded-full text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${sizeClasses}`}
      >
        <span aria-hidden="true" className="text-base leading-none">💼</span>
        <span>Kirim via WhatsApp Business</span>
      </button>
    </div>
  );
};
