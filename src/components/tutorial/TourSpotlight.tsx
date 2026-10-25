import React, { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { createPortal } from 'react-dom';
import type { TourStep } from '../../services/tutorialService';

export interface TourSpotlightProps {
  step: TourStep;
  stepIndex: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}

const PAD = 6;
const DIM = 'rgba(10,15,30,0.62)';
const FALLBACK_MS = 1500;

type Rect = { top: number; left: number; width: number; height: number };

export const TourSpotlight: React.FC<TourSpotlightProps> = ({ step, stepIndex, total, onNext, onSkip }) => {
  const [rect, setRect] = useState<Rect | null>(null);
  const [fallback, setFallback] = useState(false);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const selector = `[data-tour="${step.target}"]`;

  // Track the real element: it can appear late (modals) or move (animations, scroll).
  useEffect(() => {
    setRect(null);
    setFallback(false);
    let scrolled = false;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      if (!scrolled) {
        el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        scrolled = true;
      }
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );
      setFallback(false);
    };
    measure();
    const interval = window.setInterval(measure, 300);
    const timeout = window.setTimeout(() => {
      if (!document.querySelector(selector)) setFallback(true);
    }, FALLBACK_MS);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [selector]);

  // Action steps advance when the user taps the real element (the tap still does its job).
  useEffect(() => {
    if (step.advance !== 'click') return;
    const onClick = (e: MouseEvent) => {
      const el = document.querySelector(selector);
      if (el && e.target instanceof Node && el.contains(e.target)) onNextRef.current();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [selector, step.advance]);

  const handleNext = () => {
    // Text fields save on blur; make sure typed text is stored before moving on.
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur();
    onNext();
  };

  const showHole = rect && !fallback;
  const hole = showHole
    ? {
        top: Math.max(rect.top - PAD, 0),
        left: Math.max(rect.left - PAD, 0),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipBelow = hole ? hole.top + hole.height + 200 < vh : true;
  const tooltipStyle: React.CSSProperties = hole
    ? tooltipBelow
      ? { top: hole.top + hole.height + 12 }
      : { bottom: vh - hole.top + 12 }
    : { top: '50%', transform: 'translateY(-50%)' };

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none" data-testid="tour-spotlight">
      {hole ? (
        <>
          {/* Four panels around the hole block taps everywhere except the real target. */}
          <div className="absolute left-0 right-0 top-0 pointer-events-auto" style={{ height: hole.top, background: DIM }} />
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-auto"
            style={{ top: hole.top + hole.height, background: DIM }}
          />
          <div
            className="absolute left-0 pointer-events-auto"
            style={{ top: hole.top, height: hole.height, width: hole.left, background: DIM }}
          />
          <div
            className="absolute right-0 pointer-events-auto"
            style={{ top: hole.top, height: hole.height, left: hole.left + hole.width, background: DIM }}
          />
          <div
            className="absolute rounded-2xl transition-all duration-200"
            style={{ ...hole, boxShadow: '0 0 0 3px #fff, 0 0 0 9px rgba(47,84,235,0.55)' }}
          />
        </>
      ) : (
        <div className="absolute inset-0 pointer-events-auto" style={{ background: DIM }} />
      )}

      <div
        role="dialog"
        aria-label={t(step.title)}
        data-fallback={fallback ? 'true' : undefined}
        className="absolute left-4 right-4 mx-auto max-w-sm pointer-events-auto bg-white dark:bg-[#1C1C1E] text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-4 space-y-2"
        style={tooltipStyle}
      >
        <p className="text-sm font-bold text-slate-900 dark:text-white">{t(step.title)}</p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t(step.body)}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Langkah {stepIndex + 1} dari {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              {t("Lewati")}
            </button>
            {!step.hideNext && (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900 dark:bg-blue-600"
              >
                {t("Berikutnya")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
