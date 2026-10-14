import React from 'react';

export interface CircularQuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const CircularQuickAction: React.FC<CircularQuickActionProps> = ({
  label,
  icon,
  onClick,
  badge,
  disabled = false,
  variant = 'primary',
}) => {
  const variantClasses = {
    primary: 'bg-[#2F54EB] text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    accent: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  }[variant];

  return (
    <div className="flex flex-col items-center gap-1.5 inline-flex">
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={`rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center transition-all ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95 cursor-pointer'
          } ${variantClasses}`}
        >
          {icon}
        </button>
        {badge !== undefined && badge !== null && badge !== '' && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm pointer-events-none">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-slate-700 text-center max-w-[72px] truncate">
        {label}
      </span>
    </div>
  );
};
