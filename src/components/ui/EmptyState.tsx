import React from 'react';
import { motion } from 'motion/react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'success';
}

/** Friendly empty screen: a soft icon badge, one line of text and an optional action. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, body, actionLabel, onAction, tone = 'neutral' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', damping: 24, stiffness: 260 }}
    className="rounded-[22px] bg-white/85 dark:bg-[#1C1C1E]/80 border border-white/80 dark:border-white/10 px-5 py-7 text-center"
  >
    <span
      className={`mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center ${
        tone === 'success'
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/[0.06]'
          : 'bg-blue-500/15 text-blue-600 dark:text-cyan-400 ring-8 ring-blue-500/[0.06]'
      }`}
    >
      {icon}
    </span>
    <p className="text-[15px] font-bold">{title}</p>
    {body && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{body}</p>}
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="press mt-4 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500"
      >
        {actionLabel}
      </button>
    )}
  </motion.div>
);
