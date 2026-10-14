import React from 'react';

export interface DualMetricsCardProps {
  overdueCount: number;
  healthScorePercent: number;
  activeCount: number;
  onOverdueClick?: () => void;
  onHealthClick?: () => void;
}

export const DualMetricsCard: React.FC<DualMetricsCardProps> = ({
  overdueCount,
  healthScorePercent,
  activeCount,
  onOverdueClick,
  onHealthClick,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Left Card: Solid Royal Blue */}
      <button
        type="button"
        onClick={onOverdueClick}
        aria-label="Perlu Disapa"
        className="w-full text-left bg-[#2F54EB] text-white rounded-2xl p-4 shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F54EB]"
      >
        <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
          Perlu Disapa
        </span>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {overdueCount}
          </span>
          <span className="ml-1.5 text-xs text-blue-200 font-medium">kontak</span>
        </div>
      </button>

      {/* Right Card: Pure White with Hairline Border */}
      <button
        type="button"
        onClick={onHealthClick}
        aria-label="Health Score"
        className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-all hover:border-slate-300 active:scale-[0.98] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
      >
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Health Score
        </span>
        <div className="mt-3">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            {healthScorePercent}%
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            dari {activeCount} kontak
          </p>
        </div>
      </button>
    </div>
  );
};
