import React from 'react';
import { C, INTER, clamp, expoIn, expoOut, kf } from './lib';

// Android phone: thin dark bezel, punch-hole camera, status bar and gesture pill.
// Children draw in screen coordinates (SCREEN_W x SCREEN_H).
export const PHONE_W = 500;
export const PHONE_H = 1040;
const BEZEL = 12;
export const SCREEN_W = PHONE_W - BEZEL * 2; // 476
export const SCREEN_H = PHONE_H - BEZEL * 2; // 1016
export const STATUS_H = 44;

/** Stage position of the phone's centre when it rests on the right half. */
export const PHONE_CX = 1300;
export const PHONE_CY = 540;

/** Stage coordinates of a point given in screen coordinates (for the touch indicator). */
export const toStage = (sx: number, sy: number, dx = 0, dy = 0, scale = 1) => ({
  x: PHONE_CX + dx + (sx + BEZEL - PHONE_W / 2) * scale,
  y: PHONE_CY + dy + (sy + BEZEL - PHONE_H / 2) * scale,
});

export const Phone: React.FC<{
  dx?: number;
  dy?: number;
  scale?: number;
  rotate?: number;
  dark?: boolean;
  statusColor?: string;
  children: React.ReactNode;
}> = ({ dx = 0, dy = 0, scale = 1, rotate = 0, dark = false, statusColor, children }) => (
  <div
    style={{
      position: 'absolute',
      left: PHONE_CX - PHONE_W / 2 + dx,
      top: PHONE_CY - PHONE_H / 2 + dy,
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 74,
      background: 'linear-gradient(135deg, #2A2C31, #0C0D10 40%, #1B1C20)',
      boxShadow: '0 50px 100px -40px rgba(15,30,70,0.55), 0 0 0 2px #3A3C42, inset 0 0 0 2px #050506',
      scale: String(scale),
      rotate: `${rotate}deg`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: BEZEL,
        top: BEZEL,
        width: SCREEN_W,
        height: SCREEN_H,
        borderRadius: 62,
        overflow: 'hidden',
        background: dark ? '#090A0F' : C.page,
        fontFamily: INTER,
      }}
    >
      {children}
      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: STATUS_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          fontSize: 19,
          fontWeight: 600,
          color: statusColor ?? (dark ? '#FFFFFF' : C.ink),
          pointerEvents: 'none',
        }}
      >
        <span>08:00</span>
        <svg width={70} height={18} viewBox="0 0 70 18">
          <path d="M2 9 Q11 1 20 9 M6 12 Q11 7 16 12" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M28 15 L38 3 L38 15 Z" fill="currentColor" />
          <rect x={46} y={4} width={20} height={10} rx={3} stroke="currentColor" strokeWidth={1.6} fill="none" />
          <rect x={48} y={6} width={13} height={6} rx={1.5} fill="currentColor" />
        </svg>
      </div>
      {/* Punch-hole camera */}
      <div style={{ position: 'absolute', left: SCREEN_W / 2 - 11, top: 11, width: 22, height: 22, borderRadius: 11, background: '#050506', boxShadow: 'inset 0 0 0 3px #15161A' }} />
      {/* Gesture pill */}
      <div style={{ position: 'absolute', left: SCREEN_W / 2 - 64, bottom: 12, width: 128, height: 6, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.6)' : 'rgba(17,18,22,0.35)' }} />
    </div>
  </div>
);

/**
 * Left-side headline: words rise in one after another (already moving, blur follows speed),
 * then leave with a blur ramp at the end of the shot.
 */
export const Headline: React.FC<{ f: number; text: string; start?: number; end: number; sub?: string }> = ({ f, text, start = 4, end, sub }) => {
  const words = text.split(' ');
  const out = f > end - 8 ? kf(f, [[end - 8, 0], [end, 1]], expoIn) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        top: 0,
        bottom: 0,
        width: 760,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: INTER,
        filter: out > 0.01 ? `blur(${out * 10}px)` : undefined,
        opacity: 1 - out * 0.6,
        translate: `0px ${-out * 40}px`,
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 1.04, color: C.ink }}>
        {words.map((w, i) => {
          const t0 = start + i * 2.2;
          const k = clamp((f - t0) / 10);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: 22,
                opacity: clamp(k * 2.5),
                translate: `0px ${kf(f, [[t0, 46], [t0 + 12, 0]], expoOut)}px`,
                filter: `blur(${kf(f, [[t0, 12], [t0 + 9, 0]], expoOut)}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {sub && (
        <div style={{ marginTop: 22, fontSize: 34, color: '#6B7385', opacity: clamp((f - start - words.length * 2.2) / 8) }}>{sub}</div>
      )}
    </div>
  );
};
