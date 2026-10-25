import React from 'react';
import { C, Fill, INTER, clamp, expoIn, expoOut, kf, useF } from './lib';

// Shot 8 (global f435–492, local 0–57): three cards land on the beat, each with a giant
// frosted-glass title cut off by the card's bottom edge: Ingat. Catat. Sapa.
const CARD_W = 500;
const CARD_H = 700;
const BEAT = 14.515;

type Card = { id: string; title: string; pill: string; art: (id: string) => React.ReactNode };

const CARDS: Card[] = [
  {
    id: 'ingat',
    title: 'Ingat',
    pill: 'Pengingat',
    art: () => (
      <>
        <rect width={CARD_W} height={CARD_H} fill="url(#g-ingat)" />
        <circle cx={360} cy={230} r={170} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={26} />
        <circle cx={360} cy={230} r={70} fill="#FFFFFF" opacity={0.9} />
        <circle cx={120} cy={470} r={90} fill={C.cyan} opacity={0.75} />
      </>
    ),
  },
  {
    id: 'catat',
    title: 'Catat',
    pill: 'Suara',
    art: () => (
      <>
        <rect width={CARD_W} height={CARD_H} fill="url(#g-catat)" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={60 + i * 44} y={300 - [60, 120, 200, 140, 240, 160, 90, 180, 70][i] / 2} width={24} height={[60, 120, 200, 140, 240, 160, 90, 180, 70][i]} rx={12} fill="#FFFFFF" opacity={0.85} />
        ))}
        <circle cx={420} cy={560} r={120} fill={C.blue} opacity={0.5} />
      </>
    ),
  },
  {
    id: 'sapa',
    title: 'Sapa',
    pill: 'WhatsApp',
    art: () => (
      <>
        <rect width={CARD_W} height={CARD_H} fill="url(#g-sapa)" />
        <path d="M300 120 Q400 150 420 250" stroke="#FFFFFF" strokeWidth={26} strokeLinecap="round" fill="none" opacity={0.85} />
        <path d="M290 190 Q350 205 360 260" stroke="#FFFFFF" strokeWidth={26} strokeLinecap="round" fill="none" opacity={0.85} />
        <rect x={70} y={300} width={260} height={150} rx={60} fill="#FFFFFF" opacity={0.9} />
        <circle cx={140} cy={300} r={60} fill={C.mint} opacity={0.8} />
      </>
    ),
  },
];

const CardArt: React.FC<{ card: Card }> = ({ card }) => (
  <svg width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={{ display: 'block' }}>
    <defs>
      <linearGradient id="g-ingat" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5C8DFF" />
        <stop offset="1" stopColor={C.deep} />
      </linearGradient>
      <linearGradient id="g-catat" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#67E0C0" />
        <stop offset="1" stopColor="#1C7C9E" />
      </linearGradient>
      <linearGradient id="g-sapa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5FD8F5" />
        <stop offset="1" stopColor="#2F54EB" />
      </linearGradient>
      <clipPath id={`title-${card.id}`}>
        <text x={CARD_W / 2} y={CARD_H + 30} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={175} letterSpacing={-7}>
          {card.title}
        </text>
      </clipPath>
      <filter id={`frost-${card.id}`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={16} />
        <feComponentTransfer>
          <feFuncR type="linear" slope={0.6} intercept={0.45} />
          <feFuncG type="linear" slope={0.6} intercept={0.45} />
          <feFuncB type="linear" slope={0.6} intercept={0.45} />
        </feComponentTransfer>
      </filter>
    </defs>
    <g>{card.art(card.id)}</g>
    {/* Frosted glass letters: a blurred, lightened copy of the art clipped to the title */}
    <g clipPath={`url(#title-${card.id})`}>
      <g filter={`url(#frost-${card.id})`}>{card.art(card.id)}</g>
      <rect width={CARD_W} height={CARD_H} fill="#FFFFFF" opacity={0.22} />
    </g>
  </svg>
);

export const S8Cards: React.FC = () => {
  const f = useF();
  const exit = f > 47 ? kf(f, [[47, 0], [57, 1]], expoIn) : 0;
  const drift = Math.max(0, f - 36) * 3 + exit * 520;

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      {CARDS.map((card, i) => {
        const t0 = i * BEAT;
        const k = clamp((f - t0) / 12);
        const y = kf(f, [[t0, 300], [t0 + 12, 0]], expoOut);
        const blur = kf(f, [[t0, 12], [t0 + 9, 0]], expoOut) + exit * 14;
        const scale = kf(f, [[t0, 1.08], [t0 + 12, 1]], expoOut);
        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: 170 + i * (CARD_W + 40),
              top: 190 + y - drift,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 60,
              overflow: 'hidden',
              opacity: f < t0 ? 0 : clamp(k * 3),
              scale: String(scale),
              filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              boxShadow: '0 30px 70px -30px rgba(30,47,82,0.45)',
            }}
          >
            <CardArt card={card} />
            <div style={{ position: 'absolute', left: 30, top: 30, padding: '12px 24px', borderRadius: 999, fontSize: 26, fontWeight: 600, color: '#FFF', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
              {card.pill}
            </div>
            <div style={{ position: 'absolute', right: 30, top: 30, width: 60, height: 60, borderRadius: 30, color: '#FFF', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)' }}>
              •••
            </div>
          </div>
        );
      })}
    </Fill>
  );
};
