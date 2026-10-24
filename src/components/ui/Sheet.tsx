import React, { useRef } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  ariaLabel?: string;
  /** 'full' fills most of the screen (profile, draft); 'auto' hugs its content. */
  size?: 'auto' | 'full';
  className?: string;
  zIndex?: string;
}

/** Keeps the last non-null value so a sheet still shows its content while sliding away. */
export function useSticky<T>(value: T | null): T | null {
  const last = useRef<T | null>(value);
  if (value) last.current = value;
  return value ?? last.current;
}

export const SHEET_SPRING = { type: 'spring', damping: 34, stiffness: 340, mass: 0.9 } as const;

/**
 * iOS-style bottom sheet: dimmed backdrop, slides up with a spring, and can be
 * pulled down by its grab handle to close.
 */
export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  size = 'auto',
  className = '',
  zIndex = 'z-50',
}) => {
  const dragControls = useDragControls();

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} flex items-end justify-center`}>
          <motion.div
            data-testid="sheet-backdrop"
            className="absolute inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={ariaLabel}
            className={`relative w-full max-w-lg flex flex-col rounded-t-[28px] bg-[#F2F2F7] dark:bg-[#1C1C1E] border-t border-white/80 dark:border-white/12 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.35)] text-slate-900 dark:text-white pb-[env(safe-area-inset-bottom,0px)] ${
              size === 'full' ? 'h-[94vh]' : 'max-h-[92vh]'
            } ${className}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
            transition={SHEET_SPRING}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className="shrink-0 pt-2.5 pb-1.5 flex justify-center cursor-grab touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <span className="w-10 h-[5px] rounded-full bg-slate-300 dark:bg-white/25" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
