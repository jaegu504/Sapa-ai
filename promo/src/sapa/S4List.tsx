import React from 'react';
import { BlurDef, C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, linear, useF } from './lib';
import { Headline, Phone, SCREEN_W, toStage } from './phone';

// Shot 4 (global f173–245, local 0–72): Radar Sapa's "Perlu disapa" list scrolls in from the whip,
// the touch picks Ahmet Hoca, then presses the centre mic of the bottom bar.
const ROWS = [
  { initials: 'AH', name: 'Ahmet Hoca', due: 'Lewat 10 hari', topic: 'Topik: tanya kabar umrah', tone: ['#EDE6FF', '#6B4FD8'] },
  { initials: 'IB', name: 'Ibu', due: 'Lewat 3 hari', topic: 'Topik: kontrol dokter', tone: ['#FFE6EA', '#C8344E'] },
  { initials: 'BS', name: 'Budi Santoso', due: 'Belum disapa', topic: '', tone: ['#E1F4FF', '#1F78B4'] },
];
const ROW_H = 104;
const LIST_TOP = 470;

export const S4List: React.FC = () => {
  const f = useF();

  const scroll = kf(f, [[0, 420], [1, 315], [2, 210], [3, 170], [4, 140], [5, 116], [6, 96], [7, 81], [16, 14], [21, 0]], linear) - Math.max(0, f - 21) * 0.3;
  const smear = kf(f, [[0, 24], [6, 1.5], [10, 0]], expoOut);
  const flash = kf(f, [[0, 1], [6, 0]]);
  const pick = kf(f, [[25, 0], [29, 1]], expoOut);
  const pulse = 1 + 0.07 * Math.sin(((f - 30) / 14.5) * Math.PI * 2) * clamp((f - 30) / 8);
  const micPress = kf(f, [[52, 0], [55, 1]]);
  const exit = f > 58 ? kf(f, [[58, 0], [72, 1]], expoIn) : 0;

  const row0 = toStage(SCREEN_W - 120, LIST_TOP + ROW_H / 2);
  const mic = toStage(SCREEN_W / 2, 1016 - 92);
  const tx = kf(f, [[8, 1760], [21, row0.x], [24, row0.x - 6], [40, row0.x - 6], [50, mic.x + 8]], expoOut);
  const ty = kf(f, [[8, 900], [21, row0.y], [24, row0.y + 2], [40, row0.y + 2], [50, mic.y + 10]], expoOut);
  const tap = kf(f, [[23, 0], [25, 1], [28, 0]]) + micPress;

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 70% 50%, #E3EFFC, transparent 70%)' }} />
      <BlurDef id="s4smear" x={smear * 0.12} y={smear} />
      <Fill style={{ filter: smear > 0.05 ? 'url(#s4smear)' : exit > 0.01 ? `blur(${exit * 10}px)` : undefined, scale: String(1 + exit * 0.06) }}>
        <Headline f={f} text="Tahu siapa yang perlu disapa" start={8} end={72} />
        <Phone dy={scroll}>
          <div style={{ position: 'absolute', left: 28, top: 70, fontSize: 40, fontWeight: 800, letterSpacing: -1.5, color: C.ink }}>Radar Sapa</div>
          {/* Pulse card */}
          <div style={{ position: 'absolute', left: 20, right: 20, top: 140, height: 190, borderRadius: 30, background: '#FFFFFF', boxShadow: '0 12px 30px -18px rgba(41,67,118,0.4)' }}>
            <svg width={150} height={150} viewBox="0 0 150 150" style={{ position: 'absolute', left: 18, top: 20 }}>
              <circle cx={75} cy={75} r={58} stroke="#EEF2F7" strokeWidth={13} fill="none" />
              <circle cx={75} cy={75} r={58} stroke={C.mint} strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray={364} strokeDashoffset={364 * 0.37} transform="rotate(-90 75 75)" />
              <text x={75} y={84} textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize={30} fill={C.ink}>63%</text>
            </svg>
            {['8 Aktif', '3 Perlu Disapa', '0 Dijeda'].map((label, i) => (
              <div key={label} style={{ position: 'absolute', left: 186, top: 28 + i * 48, height: 38, padding: '0 16px', borderRadius: 19, display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 600, color: i === 1 ? '#E0465A' : '#3B4254', background: i === 1 ? '#FDECEF' : '#F4F6FA' }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: i === 0 ? C.mint : i === 1 ? '#F0566B' : '#B7BECB' }} />
                {label}
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 28, top: 410, fontSize: 24, fontWeight: 700, color: C.ink }}>Perlu disapa</div>
          <div style={{ position: 'absolute', left: 20, right: 20, top: LIST_TOP, borderRadius: 26, background: '#FFFFFF', overflow: 'hidden', boxShadow: '0 12px 30px -18px rgba(41,67,118,0.4)' }}>
            {ROWS.map((r, i) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14, height: ROW_H, padding: '0 16px', borderTop: i ? '1px solid #F0F2F6' : undefined, background: i === 0 ? `rgba(47,107,255,${0.08 * pick})` : undefined }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: r.tone[0], color: r.tone[1], fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 21, fontWeight: 600, color: C.ink }}>{r.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#E0465A' }}>{r.due}</div>
                  {r.topic && <div style={{ fontSize: 14, color: '#7A8190' }}>{r.topic}</div>}
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: '#F1F3F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#4A5164" strokeWidth={2.6} strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                </div>
              </div>
            ))}
          </div>
          {/* Bottom bar with the centre mic */}
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 34, height: 78, borderRadius: 39, background: 'rgba(255,255,255,0.92)', boxShadow: '0 12px 30px -14px rgba(0,0,0,0.25), inset 0 0 0 1px #EEF0F4', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center', fontSize: 12, color: '#7A8190', textAlign: 'center' }}>
            <span style={{ color: C.blue, fontWeight: 700 }}>Radar</span>
            <span>Kontak</span>
            <span />
            <span>Jadwal</span>
            <span>Pengaturan</span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: SCREEN_W / 2 - 38,
              bottom: 54,
              width: 76,
              height: 76,
              borderRadius: 38,
              background: 'linear-gradient(135deg, #2F54EB, #4F5BE8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid #F2F2F7',
              scale: String(pulse * (1 - 0.12 * micPress)),
              boxShadow: `0 0 0 ${6 + 18 * micPress}px rgba(47,107,255,${0.15 + 0.15 * micPress}), 0 12px 24px -10px rgba(47,84,235,0.8)`,
            }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.2} strokeLinecap="round"><rect x={9} y={2} width={6} height={12} rx={3} /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></svg>
          </div>
        </Phone>
      </Fill>
      <Fill style={{ background: '#E2F4FE', opacity: flash }} />
      {f > 8 && f < 58 && <Touch x={tx} y={ty} press={clamp(tap)} opacity={clamp((f - 8) / 3)} />}
    </Fill>
  );
};
