import React from 'react';

export interface KinshipPulseArcProps {
  score: number;
  activeCount: number;
  dueCount: number;
  pausedCount: number;
  onPulseClick?: () => void;
  className?: string;
}

export const KinshipPulseArc: React.FC<KinshipPulseArcProps> = ({
  score,
  activeCount,
  dueCount,
  pausedCount,
  onPulseClick,
  className = '',
}) => {
  // Clamped score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Circular arc geometry
  const radius = 58;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const isCoral = clampedScore < 60;

  const content = (
    <div className="flex flex-col items-center">
      {/* SVG Arc Container */}
      <div className="relative flex items-center justify-center w-[144px] h-[144px]">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 144 144"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="kinshipEmeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="kinshipCoralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Foreground progress arc */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={isCoral ? 'url(#kinshipCoralGradient)' : 'url(#kinshipEmeraldGradient)'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label & percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
            {Math.round(clampedScore)}%
          </span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Denyut Sapa
          </span>
        </div>
      </div>

      {/* Bottom stat pills */}
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {activeCount} Aktif
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            dueCount > 0
              ? 'bg-rose-50 text-rose-600 border border-rose-200 font-semibold'
              : 'bg-slate-100 text-slate-700 font-medium'
          }`}
        >
          {dueCount} Perlu Disapa
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {pausedCount} Dijeda
        </span>
      </div>
    </div>
  );

  if (onPulseClick) {
    return (
      <button
        type="button"
        onClick={onPulseClick}
        aria-label={`Denyut Sapa ${Math.round(clampedScore)}%`}
        className={`w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[0.99] ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm ${className}`}
    >
      {content}
    </div>
  );
};
