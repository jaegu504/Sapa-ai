import React from 'react';
import { C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, useF } from './lib';
import { Headline, Phone, SCREEN_W, toStage } from './phone';

// Shot 7 (global f376–434, local 0–58): the Draf AI sheet rises inside the phone, the greeting
// writes itself and the touch opens WhatsApp with it.
const MESSAGE = 'Selamün aleyküm hocam, umreden döndüğünüzü duydum, Allah kabul etsin. Oğlunuzun üniversitesi nasıl gidiyor?';
const SHEET_H = 640;

export const S7Draft: React.FC = () => {
  const f = useF();

  const sheet = kf(f, [[0, 0], [4, 0.55], [9, 0.85], [14, 1]], expoOut);
  const cardBlur = kf(f, [[0, 0], [2, 3.8], [12, 0]], expoOut);
  const exit = f > 50 ? kf(f, [[50, 0], [58, 1]], expoIn) : 0;
  const shown = Math.floor(clamp((f - 10) / 26) * MESSAGE.length);
  const press = kf(f, [[41, 0], [43, 1], [46, 0]]);
  const sent = kf(f, [[44, 0], [50, 1]], expoOut);

  const btn = toStage(SCREEN_W / 2 + 60, 1016 - SHEET_H + 520);
  const tx = kf(f, [[24, 1760], [40, btn.x]], expoOut);
  const ty = kf(f, [[24, 980], [40, btn.y]], expoOut);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER, filter: exit > 0.01 ? `blur(${1 + exit * 6}px)` : undefined }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 70% 50%, #E3EFFC, transparent 70%)' }} />
      <Headline f={f} text="Sapaan hangat, siap dikirim" start={4} end={58} sub="Ditulis AI dari catatanmu" />
      <Phone scale={1 - exit * 0.04}>
        {/* Profile behind */}
        <div style={{ position: 'absolute', inset: 0, background: '#EEF1F6', filter: 'blur(2.5px)' }}>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 104, height: 104, borderRadius: 26, background: '#FFF' }} />
          <div style={{ position: 'absolute', left: 20, right: 20, top: 222, height: 58, borderRadius: 18, background: '#25D366' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,18,22,0.3)', opacity: clamp(f / 6) }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: SHEET_H,
            translate: `0px ${(1 - sheet) * SHEET_H}px`,
            borderRadius: '40px 40px 0 0',
            background: '#F2F2F7',
            filter: cardBlur > 0.05 ? `blur(${cardBlur}px)` : undefined,
          }}
        >
          <div style={{ position: 'absolute', left: SCREEN_W / 2 - 22, top: 12, width: 44, height: 5, borderRadius: 3, background: '#CDD2DA' }} />
          <div style={{ position: 'absolute', left: 20, top: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="#FFF"><path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6Z" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Draf Sapaan</div>
              <div style={{ fontSize: 14, color: '#7A8190' }}>Untuk Ahmet Hoca</div>
            </div>
          </div>
          <div style={{ position: 'absolute', right: 20, top: 44, display: 'flex', padding: 3, borderRadius: 999, background: '#E3E6EC', fontSize: 13, fontWeight: 700 }}>
            <span style={{ padding: '4px 9px', color: '#7A8190' }}>ID</span>
            <span style={{ padding: '4px 9px', borderRadius: 999, background: '#FFF', color: C.ink }}>TR</span>
          </div>
          <div style={{ position: 'absolute', left: 20, top: 104, display: 'flex', gap: 8 }}>
            {['Kabar & Doa', 'Bahas Topik', 'Ajak Temu'].map((label, i) => (
              <span key={label} style={{ padding: '8px 13px', borderRadius: 999, fontSize: 14, fontWeight: 600, color: i === 0 ? '#0E7FA6' : '#3B4254', background: i === 0 ? 'rgba(60,200,240,0.14)' : '#FFF', boxShadow: i === 0 ? 'inset 0 0 0 1.5px rgba(60,200,240,0.8)' : undefined }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 158, height: 220, borderRadius: 22, background: '#FFFFFF', padding: '16px 18px', fontSize: 20, lineHeight: 1.45, color: C.ink, boxShadow: 'inset 0 0 0 1px #E6E9EF' }}>
            {MESSAGE.slice(0, shown)}
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: 392, padding: '10px 14px', borderRadius: 14, background: 'rgba(47,107,255,0.08)', fontSize: 14, color: '#3B4254' }}>
            <b style={{ color: C.blue }}>Topik:</b> Tanyakan kabar umrahnya
          </div>
          <div
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 490,
              height: 64,
              borderRadius: 20,
              background: '#25D366',
              color: '#FFF',
              fontSize: 20,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              scale: String(1 - 0.04 * press),
              boxShadow: '0 12px 26px -14px rgba(37,211,102,0.9)',
            }}
          >
            {sent > 0.5 ? (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" style={{ scale: String(sent) }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.4}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
            )}
            {sent > 0.5 ? 'Siap dikirim di WhatsApp' : 'Kirim via WhatsApp'}
          </div>
        </div>
      </Phone>
      {f > 24 && f < 50 && <Touch x={tx} y={ty} press={press} opacity={clamp((f - 24) / 3)} />}
    </Fill>
  );
};
