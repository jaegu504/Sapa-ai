import React from 'react';
import { t } from '../../i18n';
import { motion } from 'motion/react';

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
    <div className="flex flex-row items-center justify-between gap-4 sm:gap-6">
      {/* Left: Apple Activity / Fitness Style Glowing Ring */}
      <div className="relative flex items-center justify-center w-[128px] h-[128px] sm:w-[140px] sm:h-[140px] shrink-0">
        <svg
          className="w-full h-full transform -rotate-90 overflow-visible"
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
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
            stroke={isCoral ? 'url(#kinshipCoralGradient)' : 'url(#kinshipEmeraldGradient)'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className={`${
              isCoral
                ? 'drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)] dark:drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'drop-shadow-[0_2px_8px_rgba(52,199,89,0.4)] dark:drop-shadow-[0_0_12px_rgba(52,199,89,0.55)]'
            }`}
          />
        </svg>

        {/* Center label & percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            {Math.round(clampedScore)}%
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-1">
            {t("Denyut Sapa")}
          </span>
        </div>
      </div>

      {/* Right: Stacked Bento Stat Pills */}
      <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
        {/* Active Pill */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 shadow-xs transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
            <span className="text-xs font-semibold truncate">
              {t('{n} Aktif', { n: activeCount })}
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 hidden sm:inline">
            {t("Aman")}
          </span>
        </div>

        {/* Due Pill */}
        <div
          className={`flex items-center justify-between px-3.5 py-2 rounded-full transition-all ${
            dueCount > 0
              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 dark:border-rose-500/30 shadow-xs font-bold'
              : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/10 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 shadow-xs ${
                dueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
            <span
              className={`text-xs truncate ${
                dueCount > 0 ? 'text-rose-600 dark:text-rose-300 font-bold' : ''
              }`}
            >
              {t('{n} Perlu Disapa', { n: dueCount })}
            </span>
          </div>
        </div>

        {/* Paused Pill */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white/70 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-white/80 dark:border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            <span className="text-xs font-medium truncate">
              {t('{n} Dijeda', { n: pausedCount })}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {t("Nonaktif")}
          </span>
        </div>
      </div>
    </div>
  );

  const containerBaseClass = `w-full rounded-[28px] p-5 bg-white/80 dark:bg-[#1C1C1E]/75 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all`;

  if (onPulseClick) {
    return (
      <button
        type="button"
        onClick={onPulseClick}
        aria-label={`${t('Denyut Sapa')} ${Math.round(clampedScore)}%`}
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
