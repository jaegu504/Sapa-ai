import React from 'react';

export interface CadenceBadgeProps {
  cadenceDays: number;
  isOverdue: boolean;
  daysLeftOrOverdue: number;
  className?: string;
}

export const CadenceBadge: React.FC<CadenceBadgeProps> = ({
  cadenceDays: _cadenceDays,
  isOverdue,
  daysLeftOrOverdue,
  className = '',
}) => {
  let dotColor: string;
  let text: string;
  let badgeClasses: string;

  if (isOverdue) {
    dotColor = '#F43F5E';
    text = `Perlu Disapa (${daysLeftOrOverdue} hr)`;
    badgeClasses = 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30';
  } else if (daysLeftOrOverdue <= 3) {
    dotColor = '#F59E0B';
    text = `Sisa ${daysLeftOrOverdue} hr`;
    badgeClasses = 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
  } else {
    dotColor = '#10B981';
    text = `Aman (${daysLeftOrOverdue} hr lagi)`;
    badgeClasses = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-xs transition-colors ${badgeClasses} ${className}`}
    >
      <span
        data-testid="cadence-dot"
        data-color={dotColor}
        className="rounded-full shrink-0 shadow-xs"
        style={{ width: '6px', height: '6px', backgroundColor: dotColor }}
      />
      <span>{text}</span>
    </span>
  );
};
