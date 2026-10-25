import React from 'react';
import { BlurDef, C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, linear, useF } from './lib';

// Shot 4 (global f173–245, local 0–72): the "Perlu disapa" list scrolls in from the whip,
// the touch rides it, picks Ahmet Hoca, then presses the centre mic.
const ROWS = [
  { initials: 'AH', name: 'Ahmet Hoca', due: 'Lewat 10 hari', topic: 'Topik: tanya kabar umrah', tone: ['#EDE6FF', '#6B4FD8'] },
  { initials: 'IB', name: 'Ibu', due: 'Lewat 3 hari', topic: 'Topik: kontrol dokter', tone: ['#FFE6EA', '#C8344E'] },
  { initials: 'BS', name: 'Budi Santoso', due: 'Belum disapa', topic: '', tone: ['#E1F4FF', '#1F78B4'] },
];

const Mic: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x={9} y={2} width={6} height={12} rx={3} />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </svg>
);

export const S4List: React.FC = () => {
  const f = useF();

  const scroll = kf(f, [[0, 420], [1, 315], [2, 210], [3, 170], [4, 140], [5, 116], [6, 96], [7, 81], [16, 14], [21, 0]], linear) - Math.max(0, f - 21) * 0.4;
  const smear = kf(f, [[0, 24], [6, 1.5], [10, 0]], expoOut);
  const flash = kf(f, [[0, 1], [6, 0]]);

  const pick = kf(f, [[24, 0], [28, 1]], expoOut);
  const micIn = kf(f, [[30, 0], [40, 1]], expoOut);
  const pulse = 1 + 0.06 * Math.sin(((f - 30) / 14.5) * Math.PI * 2) * micIn;
  const micPress = kf(f, [[52, 0], [55, 1]]);
  const exit = f > 58 ? kf(f, [[58, 0], [72, 1]], expoIn) : 0;

  const tx = kf(f, [[0, 1400], [21, 1260], [24, 1240], [40, 1240], [50, 980]], expoOut);
  const ty = kf(f, [[0, 430 + 420], [21, 430], [24, 430], [40, 430], [50, 900]], expoOut) + (f < 21 ? scroll * 0.6 : 0);
  const tap = kf(f, [[23, 0], [25, 1], [27, 0]]) + micPress;

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <BlurDef id="s4smear" x={smear * 0.12} y={smear} />
      <Fill
        style={{
          translate: `0px ${scroll}px`,
          filter: smear > 0.05 ? 'url(#s4smear)' : exit > 0.01 ? `blur(${exit * 10}px)` : undefined,
          scale: String(1 + exit * 0.08),
        }}
      >
        <div style={{ position: 'absolute', left: 360, top: 150, fontSize: 84, fontWeight: 800, letterSpacing: -2, color: C.ink }}>Perlu disapa</div>
        <div style={{ position: 'absolute', left: 364, top: 262, fontSize: 34, color: '#7A8190' }}>Hari ini · 3 orang</div>
        <div
          style={{
            position: 'absolute',
            left: 360,
            top: 340,
            width: 1200,
            borderRadius: 48,
            background: '#FFFFFF',
            boxShadow: '0 24px 60px -30px rgba(41,67,118,0.35), inset 0 0 0 1px #EEF1F6',
            overflow: 'hidden',
          }}
        >
          {ROWS.map((r, i) => (
            <div
              key={r.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                height: 168,
                padding: '0 44px',
                borderTop: i ? '1px solid #F0F2F6' : undefined,
                background: i === 0 ? `rgba(47,107,255,${0.07 * pick})` : undefined,
              }}
            >
              <div style={{ width: 96, height: 96, borderRadius: 48, background: r.tone[0], color: r.tone[1], fontSize: 34, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 44, fontWeight: 600, color: C.ink }}>{r.name}</div>
                <div style={{ fontSize: 30, fontWeight: 600, color: '#E0465A' }}>{r.due}</div>
                {r.topic && <div style={{ fontSize: 28, color: '#7A8190' }}>{r.topic}</div>}
              </div>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: '#F1F3F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#4A5164" strokeWidth={2.4} strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div style={{ width: 84, height: 84, borderRadius: 42, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 22px -10px rgba(37,211,102,0.9)' }}>
                <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2}>
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </Fill>

      {/* Centre mic, like the app's bottom bar */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 80,
          top: 900 - 80 + (1 - micIn) * 260,
          width: 160,
          height: 160,
          borderRadius: 80,
          background: 'linear-gradient(135deg, #2F54EB, #4F5BE8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          scale: String(pulse * (1 - 0.12 * micPress) * (1 + exit * 6)),
          boxShadow: `0 0 0 ${10 + 26 * micPress}px rgba(47,107,255,${0.14 + 0.12 * micPress}), 0 24px 50px -16px rgba(47,84,235,0.8)`,
          opacity: micIn,
        }}
      >
        <Mic size={70} />
      </div>
      <Fill style={{ background: '#E2F4FE', opacity: flash }} />
      <Fill style={{ background: '#EAF2FF', opacity: exit * 0.9 }} />
      {f < 58 && <Touch x={tx} y={ty} press={clamp(tap)} opacity={clamp(f / 3)} />}
    </Fill>
  );
};
