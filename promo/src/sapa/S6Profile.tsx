import React from 'react';
import { BlurDef, C, Fill, INTER, clamp, expoIn, expoOut, kf, linear, useF } from './lib';
import { Headline, Phone } from './phone';

// Shot 6 (global f318–375, local 0–57): Ahmet's profile scrolls into place inside the phone;
// new facts pop in as bubbles and the follow-up topic lights up in its green card.
const FACTS = ['Baru pulang umrah', 'Anak kuliah di Istanbul'];

export const S6Profile: React.FC = () => {
  const f = useF();

  const scroll = kf(f, [[0, 420], [1, 315], [2, 210], [3, 170], [4, 140], [5, 116], [6, 96], [7, 81], [16, 14], [21, 0]], linear) - Math.max(0, f - 21) * 0.5;
  const smear = kf(f, [[0, 24], [6, 1.5], [10, 0]], expoOut);
  const flash = kf(f, [[0, 1], [6, 0]]);
  const exit = f > 47 ? kf(f, [[47, 0], [57, 1]], expoIn) : 0;
  const mark = kf(f, [[30, 0], [40, 1]], expoOut);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 70% 50%, #E3EFFC, transparent 70%)' }} />
      <BlurDef id="s6smear" x={smear * 0.1} y={smear} />
      <Fill style={{ filter: smear > 0.05 ? 'url(#s6smear)' : exit > 0.01 ? `blur(${1 + exit * 6}px)` : undefined, translate: `0px ${-exit * 50}px` }}>
        <Headline f={f} text="Sapa yang mencatat" start={6} end={58} sub="Kabar, fakta penting, dan bahan obrolan" />
        <Phone dy={scroll}>
          <div style={{ position: 'absolute', left: 24, top: 62, fontSize: 19, color: C.blue }}>‹ Kembali</div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 104, borderRadius: 26, background: '#FFFFFF', padding: 20, boxShadow: '0 12px 30px -18px rgba(41,67,118,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #2F54EB, #6175F0)', color: '#FFF', fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AH</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>Ahmet Hoca</div>
                <span style={{ fontSize: 14, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(139,92,246,0.12)', color: '#5B3FC4' }}>Hoca</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 222, height: 58, borderRadius: 18, background: '#25D366', color: '#FFF', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sapa Ahmet</div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 298, borderRadius: 26, background: '#FFFFFF', padding: 20, boxShadow: '0 12px 30px -18px rgba(41,67,118,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5B6782', marginBottom: 10 }}>Fakta Penting</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 84 }}>
              {FACTS.map((fact, i) => {
                const pop = kf(f, [[16 + i * 6, 0], [24 + i * 6, 1]], (x) => 1 - Math.exp(-6 * x) * Math.cos(7 * x));
                return (
                  <span key={fact} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, fontSize: 16, fontWeight: 600, color: '#1E3B8A', background: 'rgba(47,107,255,0.1)', boxShadow: 'inset 0 0 0 1.5px rgba(47,107,255,0.3)', scale: String(clamp(pop, 0, 1.2)), opacity: clamp(pop * 1.5) }}>
                    {fact}
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0E8FB6', background: 'rgba(60,200,240,0.2)', padding: '2px 6px', borderRadius: 999 }}>BARU</span>
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5B6782', margin: '14px 0 6px' }}>Pembaruan Kabar Terakhir</div>
            <div style={{ fontSize: 18, lineHeight: 1.4, color: '#3B4254' }}>Ahmet baru pulang umrah bersama keluarga, anaknya mulai kuliah.</div>
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 18,
                background: `rgba(78,214,160,${0.08 + 0.1 * mark})`,
                boxShadow: `inset 0 0 0 ${1 + mark}px rgba(78,214,160,${0.3 + 0.4 * mark})`,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1F8A5F', marginBottom: 4 }}>Bahan Obrolan Follow Up</div>
              <div style={{ fontSize: 19, fontWeight: 400 + 300 * mark, color: C.ink }}>Tanyakan kabar umrahnya</div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 690, borderRadius: 26, background: '#FFFFFF', padding: 20, boxShadow: '0 12px 30px -18px rgba(41,67,118,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5B6782', marginBottom: 12 }}>Riwayat Interaksi</div>
            {[
              ['Catatan suara', 'Hari ini', '#8B5CF6'],
              ['Chat WA', '12 Okt', '#25D366'],
              ['Ketemu', '2 Okt', '#F59E0B'],
            ].map(([label, date, dot]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: dot }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{label}</span>
                <span style={{ fontSize: 14, color: '#8A909C' }}>{date}</span>
              </div>
            ))}
          </div>
        </Phone>
      </Fill>
      <Fill style={{ background: '#E2F4FE', opacity: flash }} />
    </Fill>
  );
};
