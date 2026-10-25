import React from 'react';
import { C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, useF } from './lib';

// Shot 7 (global f376–434, local 0–58): the Draf AI sheet rises over the blurred profile,
// the greeting writes itself and the touch sends it on WhatsApp.
const MESSAGE = 'Selamün aleyküm hocam, umreden döndüğünüzü duydum, Allah kabul etsin. Oğlunuzun üniversitesi nasıl gidiyor?';

export const S7Draft: React.FC = () => {
  const f = useF();

  const top = kf(f, [[0, 900], [4, 520], [9, 400], [13, 350], [18, 318]], expoOut) - Math.max(0, f - 18) * 3;
  const cardBlur = kf(f, [[0, 0], [2, 3.8], [14, 0]], expoOut);
  const exit = f > 50 ? kf(f, [[50, 0], [58, 1]], expoIn) : 0;
  const shown = Math.floor(clamp((f - 10) / 26) * MESSAGE.length);
  const press = kf(f, [[41, 0], [43, 1], [46, 0]]);
  const sent = kf(f, [[44, 0], [50, 1]], expoOut);

  const tx = kf(f, [[24, 1500], [40, 1040]], expoOut);
  const ty = kf(f, [[24, 1000], [40, top + 560]], expoOut);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER, filter: exit > 0.01 ? `blur(${1 + exit * 6}px)` : undefined }}>
      {/* Profile behind, softly blurred */}
      <Fill style={{ filter: 'blur(2.5px)', opacity: 0.9 }}>
        <div style={{ position: 'absolute', left: 260, top: 150, fontSize: 104, fontWeight: 700, color: C.ink, letterSpacing: -3 }}>Ahmet Hoca</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 260, top: 330 + i * 78, width: 1300 - i * 160, height: 26, borderRadius: 13, background: '#E6E7EA' }} />
        ))}
      </Fill>
      <Fill style={{ background: 'rgba(17,18,22,0.18)', opacity: clamp(f / 8) }} />

      <div
        style={{
          position: 'absolute',
          left: 410,
          top,
          width: 1100,
          height: 900,
          borderRadius: 64,
          background: '#FFFFFF',
          boxShadow: '0 -20px 80px -30px rgba(17,18,22,0.45)',
          filter: cardBlur > 0.05 ? `blur(${cardBlur}px)` : undefined,
          scale: String(1 - exit * 0.05),
          translate: `0px ${-exit * 40}px`,
        }}
      >
        <div style={{ position: 'absolute', left: 520, top: 18, width: 60, height: 8, borderRadius: 4, background: '#D6D9DF' }} />
        <div style={{ position: 'absolute', left: 56, top: 60, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="#FFF">
              <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6Z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 700, color: C.ink }}>Draf Sapaan</div>
            <div style={{ fontSize: 26, color: '#7A8190' }}>Untuk Ahmet Hoca</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 56, top: 180, display: 'flex', gap: 14 }}>
          {['Kabar & Doa', 'Bahas Topik', 'Ajak Temu'].map((label, i) => (
            <span
              key={label}
              style={{
                padding: '12px 26px',
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 600,
                color: i === 0 ? '#0E7FA6' : '#3B4254',
                background: i === 0 ? 'rgba(60,200,240,0.14)' : '#F3F5F8',
                boxShadow: i === 0 ? 'inset 0 0 0 2px rgba(60,200,240,0.8)' : undefined,
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 56, right: 56, top: 270, height: 230, borderRadius: 32, background: '#F6F8FB', padding: '28px 34px', fontSize: 38, lineHeight: 1.45, color: C.ink }}>
          {MESSAGE.slice(0, shown)}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            top: 530,
            height: 100,
            borderRadius: 30,
            background: '#25D366',
            color: '#FFF',
            fontSize: 38,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            scale: String(1 - 0.04 * press),
            boxShadow: '0 16px 34px -16px rgba(37,211,102,0.9)',
          }}
        >
          {sent > 0.5 ? (
            <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ scale: String(sent) }}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.2}>
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          )}
          {sent > 0.5 ? 'Siap dikirim di WhatsApp' : 'Kirim via WhatsApp'}
        </div>
      </div>
      {f > 24 && f < 50 && <Touch x={tx} y={ty} press={press} opacity={clamp((f - 24) / 3)} />}
    </Fill>
  );
};
