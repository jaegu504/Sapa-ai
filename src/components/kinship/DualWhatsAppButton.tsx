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

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export const WhatsAppBusinessIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zM9 7.5h3.8c1.6 0 2.7.9 2.7 2.2 0 .9-.5 1.6-1.3 1.9 1.1.3 1.8 1.1 1.8 2.2 0 1.5-1.2 2.7-3.1 2.7H9V7.5zm2.1 3.3h1.5c.6 0 1-.3 1-.8s-.4-.8-1-.8h-1.5v1.6zm0 4.1h1.7c.7 0 1.2-.4 1.2-.9s-.5-.9-1.2-.9h-1.7v1.8z" />
  </svg>
);

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

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
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
        <WhatsAppIcon className={`${iconSizes} shrink-0 text-white`} />
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
        <WhatsAppBusinessIcon className={`${iconSizes} shrink-0 text-white`} />
        <span className="truncate">{variant === 'compact' ? 'Bisnis' : 'Kirim via WhatsApp Business'}</span>
      </button>
    </div>
  );
};
