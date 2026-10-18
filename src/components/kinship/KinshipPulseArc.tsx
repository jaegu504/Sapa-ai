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
      {/* Apple Activity / Fitness Style Glowing Ring */}
      <div className="relative flex items-center justify-center w-[148px] h-[148px]">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 144 144"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="kinshipEmeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34C759" />
              <stop offset="100%" stopColor="#30D158" />
            </linearGradient>
            <linearGradient id="kinshipCoralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3B30" />
              <stop offset="100%" stopColor="#F43F5E" />
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
            className="dark:stroke-white/10 transition-colors"
          />

          {/* Foreground glowing progress arc */}
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
            className={`transition-all duration-700 ease-out ${
              isCoral
                ? 'drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)] dark:drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'drop-shadow-[0_2px_8px_rgba(52,199,89,0.4)] dark:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]'
            }`}
          />
        </svg>

        {/* Center label & percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            {Math.round(clampedScore)}%
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">
            Denyut Sapa
          </span>
        </div>
      </div>

      {/* Bento Stat Pills */}
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 shadow-xs">
          {activeCount} Aktif
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            dueCount > 0
              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 dark:border-rose-500/30 font-bold shadow-xs'
              : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 font-semibold'
          }`}
        >
          {dueCount} Perlu Disapa
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-white/80 dark:border-white/10">
          {pausedCount} Dijeda
        </span>
      </div>
    </div>
  );

  const containerBaseClass = `w-full rounded-[28px] p-5 bg-white/80 dark:bg-[#1C1C1E]/75 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all`;

  if (onPulseClick) {
    return (
      <button
        type="button"
        onClick={onPulseClick}
        aria-label={`Denyut Sapa ${Math.round(clampedScore)}%`}
        className={`${containerBaseClass} text-left hover:border-white dark:hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[0.99] ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${containerBaseClass} ${className}`}>
      {content}
    </div>
  );
};
