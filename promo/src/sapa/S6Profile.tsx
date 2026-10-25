import React from 'react';
import { BlurDef, C, Fill, INTER, clamp, expoIn, expoOut, kf, linear, useF } from './lib';

// Shot 6 (global f318–375, local 0–57): Ahmet's profile scrolls into place from the whip;
// new facts pop in as bubbles and one phrase stands out in black.
const FACTS = ['Baru pulang umrah', 'Anak kuliah di Istanbul'];

export const S6Profile: React.FC = () => {
  const f = useF();

  const scroll = kf(f, [[0, 420], [1, 315], [2, 210], [3, 170], [4, 140], [5, 116], [6, 96], [7, 81], [16, 14], [21, 0]], linear) - Math.max(0, f - 21) * 0.5;
  const smear = kf(f, [[0, 24], [6, 1.5], [10, 0]], expoOut);
  const flash = kf(f, [[0, 1], [6, 0]]);
  const exit = f > 47 ? kf(f, [[47, 0], [57, 1]], expoIn) : 0;
  const mark = kf(f, [[14, 0], [24, 1]], expoOut);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <BlurDef id="s6smear" x={smear * 0.1} y={smear} />
      <Fill
        style={{
          translate: `0px ${scroll - exit * 60}px`,
          scale: String(1 - exit * 0.04),
          filter: smear > 0.05 ? 'url(#s6smear)' : exit > 0.01 ? `blur(${1 + exit * 6}px)` : undefined,
        }}
      >
        <div style={{ position: 'absolute', left: 260, top: 120, fontSize: 34, color: '#8A909C', fontWeight: 500 }}>Kontak › Hoca</div>
        <div style={{ position: 'absolute', left: 260, top: 175, display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={{ width: 132, height: 132, borderRadius: 40, background: 'linear-gradient(135deg, #2F54EB, #6175F0)', color: '#FFF', fontSize: 50, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            AH
          </div>
          <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -3, color: C.ink }}>Ahmet Hoca</div>
        </div>

        <div style={{ position: 'absolute', left: 260, top: 370, display: 'flex', gap: 18 }}>
          {FACTS.map((fact, i) => {
            const pop = kf(f, [[22 + i * 6, 0], [30 + i * 6, 1]], (x) => 1 - Math.exp(-6 * x) * Math.cos(7 * x));
            return (
              <div
                key={fact}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 30px',
                  borderRadius: 999,
                  fontSize: 38,
                  fontWeight: 600,
                  color: '#1E3B8A',
                  background: 'rgba(47,107,255,0.1)',
                  boxShadow: 'inset 0 0 0 2px rgba(47,107,255,0.28)',
                  scale: String(clamp(pop, 0, 1.2)),
                  opacity: clamp(pop * 1.5),
                }}
              >
                {fact}
                <span style={{ fontSize: 22, fontWeight: 700, color: '#0E8FB6', background: 'rgba(60,200,240,0.2)', padding: '4px 12px', borderRadius: 999 }}>BARU</span>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 260, top: 520, width: 1400, fontSize: 54, lineHeight: '78px', color: C.grey, fontWeight: 400 }}>
          Ahmet baru pulang umrah bersama keluarga, anaknya mulai kuliah di Istanbul. Saat menyapa berikutnya,{' '}
          <span style={{ color: `rgb(${188 - 172 * mark},${188 - 172 * mark},${186 - 170 * mark})`, fontWeight: 400 + 200 * mark }}>tanyakan kabar umrahnya</span>{' '}
          dan doakan kuliah anaknya lancar.
        </div>
      </Fill>
      <Fill style={{ background: '#E2F4FE', opacity: flash }} />
    </Fill>
  );
};
