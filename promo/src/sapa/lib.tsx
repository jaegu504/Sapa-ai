import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

export const { fontFamily: INTER } = loadFont('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });

// Storyboard timing is written in 30 fps "f" units; renders at any fps stay continuous (half frames at 60 fps).
export const useF = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame * 30) / fps;
};

export const W = 1920;
export const H = 1080;

export const C = {
  page: '#FDFDFB',
  haze: '#B7CFEB',
  ice: '#E6F0FA',
  deep: '#294376',
  sky: '#769CC2',
  navy: '#1E2F52',
  blue: '#2F6BFF',
  cyan: '#3CC8F0',
  mint: '#4ED6A0',
  ink: '#111216',
  grey: '#BCBCBA',
};

export type Ease = (x: number) => number;
export const linear: Ease = (x) => x;
export const easeOut: Ease = (x) => 1 - Math.pow(1 - x, 3);
export const easeIn: Ease = (x) => x * x * x;
export const easeInOut: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// Exponential settle: covers most of the distance at once, like 12–19 % of the rest per frame.
export const expoOut: Ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const expoIn: Ease = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Keyframe table lookup: [[frame, value], ...], eased between neighbours, held outside. */
export function kf(f: number, table: [number, number][], ease: Ease = linear): number {
  if (f <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [f1, v1] = table[i];
    const [f0, v0] = table[i - 1];
    if (f <= f1) return v0 + (v1 - v0) * ease((f - f0) / (f1 - f0));
  }
  return table[table.length - 1][1];
}

/** Seeded hash in [0,1): deterministic "randomness" (never Math.random). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Directional blur as an SVG filter; reference it with filter: url(#id). */
export const BlurDef: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
      </filter>
    </defs>
  </svg>
);

/** Soft touch indicator (Android): white dot with a blue ring, grows on hover, shrinks on press. */
export const Touch: React.FC<{ x: number; y: number; scale?: number; opacity?: number; press?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 1,
  press = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 34,
      top: y - 34,
      width: 68,
      height: 68,
      borderRadius: '50%',
      opacity,
      scale: String(scale * (1 - 0.18 * press)),
      background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0 38%, rgba(255,255,255,0.55) 39% 100%)',
      boxShadow: `0 0 0 ${2 + 10 * press}px rgba(47,107,255,${0.35 + 0.3 * press}), 0 10px 26px rgba(30,47,82,0.28)`,
    }}
  />
);

export const Fill: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>
);
