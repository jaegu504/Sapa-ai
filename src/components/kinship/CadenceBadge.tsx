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
  let bgColor: string;
  let textColor: string;
  let text: string;

  if (isOverdue) {
    dotColor = '#F43F5E';
    bgColor = '#FFF1F2';
    textColor = '#9F1239';
    text = `Perlu Disapa (${daysLeftOrOverdue} hr)`;
  } else if (daysLeftOrOverdue <= 3) {
    dotColor = '#F59E0B';
    bgColor = '#FEF3C7';
    textColor = '#92400E';
    text = `Sisa ${daysLeftOrOverdue} hr`;
  } else {
    dotColor = '#10B981';
    bgColor = '#ECFDF5';
    textColor = '#065F46';
    text = `Aman (${daysLeftOrOverdue} hr lagi)`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span
        data-testid="cadence-dot"
        data-color={dotColor}
        className="rounded-full shrink-0"
        style={{ width: '6px', height: '6px', backgroundColor: dotColor }}
      />
      <span>{text}</span>
    </span>
  );
};
