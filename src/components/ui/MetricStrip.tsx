import React from 'react';

export interface MetricItem {
  label: string;
  value: string | number;
  badgeColor?: 'blue' | 'green' | 'amber' | 'rose' | 'slate';
}

export interface MetricStripProps {
  metrics: MetricItem[];
}

export const MetricStrip: React.FC<MetricStripProps> = ({ metrics }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-700',
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {metrics.map((metric, idx) => {
        const colorClass = metric.badgeColor
          ? colorMap[metric.badgeColor] ?? 'text-slate-900'
          : 'text-slate-900';

        return (
          <div
            key={idx}
            className="rounded-xl p-2.5 text-center bg-slate-50 border border-slate-200 flex flex-col justify-center items-center shadow-xs"
          >
            <span className={`text-base md:text-lg font-bold tracking-tight ${colorClass}`}>
              {metric.value}
            </span>
            <span className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              {metric.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
