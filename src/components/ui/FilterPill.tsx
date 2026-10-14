import React from 'react';

export interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  active,
  onClick,
  count,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-1.5 shrink-0 focus:outline-none ${
        active
          ? 'bg-[#2F54EB] text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
