import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, Fill, INTER, clamp, easeInOut, expoIn, expoOut, hash, kf, useF } from './lib';

// Shot P (f0–374): the problem, one continuous take over a cloud of contacts. The camera pulls
// back to show how many there are, labels pop on, "last greeted" tags appear, then the contacts
// grey out and drift apart. Sapa's logo appears and floods the frame with haze, which S1 picks up.
const NAMES = [
  'Ahmet Hoca', 'Ibu', 'Budi Santoso', 'Fatma Abla', 'Rizky', 'Ustadz Hasan', 'Mehmet', 'Siti Aminah', 'Yusuf',
  'Ayşe', 'Dewi', 'Kak Rina', 'Pak Joko', 'Emre', 'Hasan Abi', 'Nadia', 'Fikri', 'Zeynep', 'Om Hendra', 'Tante Lia',
  'Arif', 'Selin', 'Bayu', 'Nur', 'Kemal', 'Laila', 'Dimas', 'Elif', 'Ayah', 'Irfan', 'Burak', 'Sari', 'Ömer', 'Putri', 'Hilal',
];
const LABELS: [string, string, string][] = [
  ['Hoca', 'rgba(139,92,246,0.14)', '#5B3FC4'],
  ['Keluarga', '#FFE6EA', '#C8344E'],
  ['Teman', '#E1F4FF', '#1F78B4'],
  ['Ihvan', '#DDF7EC', '#1F8A5F'],
  ['Profesional', '#FFF1DB', '#B26A00'],
];
const AGES = ['8 bulan', '1 tahun', '5 bulan', '2 tahun', '3 bulan', '10 bulan', '7 bulan', '1,5 tahun'];
const CENTER = { x: 1250, y: 560 };

// 7 x 5 jittered grid, nearest slot first so "Ahmet Hoca" sits in the middle.
const CHIPS = Array.from({ length: 35 }, (_, i) => {
  const c = i % 7;
  const r = Math.floor(i / 7);
  return {
    x: CENTER.x + (c - 3) * 340 + (r % 2) * 120 - 60 + (hash(i) - 0.5) * 90,
    y: CENTER.y + (r - 2) * 180 + (hash(i + 50) - 0.5) * 60,
  };
})
  .map((p) => ({ ...p, d: Math.hypot(p.x - CENTER.x, p.y - CENTER.y) }))
  .sort((a, b) => a.d - b.d)
  .map((p, i) => ({ ...p, name: NAMES[i], label: LABELS[i % 5], age: AGES[i % AGES.length], tone: LABELS[(i + 2) % 5] }));

const spring = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(7 * x));
const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Lines of text rising out of a mask line, word by word; "*word" is drawn in the accent colour. */
const MaskLines: React.FC<{ f: number; lines: string[]; start: number; end: number; accent?: string }> = ({ f, lines, start, end, accent = C.blue }) => {
  const size = 84;
  let n = 0;
  return (
    <div style={{ position: 'absolute', left: 150, top: 540 - (lines.length * size * 1.16) / 2, fontFamily: INTER, fontSize: size, fontWeight: 700, letterSpacing: -3, color: C.ink }}>
      {lines.map((line, li) => (
        <div key={li} style={{ overflow: 'hidden', height: size * 1.16, whiteSpace: 'nowrap' }}>
          {line.split(' ').map((w, wi) => {
            const t0 = start + n++ * 2.5;
            const out = f > end + li * 2 ? kf(f, [[end + li * 2, 0], [end + li * 2 + 10, -size * 1.2]], expoIn) : 0;
            const y = kf(f, [[t0, size * 1.2], [t0 + 14, 0]], expoOut) + out;
            const star = w.startsWith('*');
            return (
              <span key={wi} style={{ display: 'inline-block', marginRight: 22, translate: `0px ${y}px`, color: star ? accent : undefined }}>
                {star ? w.slice(1) : w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const P0Problem: React.FC = () => {
  const f = useF();

  // Camera: pull back from Ahmet, a slow push in, then a sideways drift. Zoom eases in log space.
  const z = Math.exp(f <= 130 ? kf(f, [[0, Math.log(2.3)], [120, 0]], easeInOut) : kf(f, [[135, 0], [235, Math.log(1.16)]], easeInOut));
  const camX = f <= 130 ? kf(f, [[0, CHIPS[0].x - 290 / 2.3], [120, 1000]], easeInOut) : f <= 235 ? kf(f, [[135, 1000], [235, 1080]], easeInOut) : kf(f, [[235, 1080], [375, 1180]], easeInOut);
  const camY = f <= 130 ? kf(f, [[0, CHIPS[0].y], [120, 560]], easeInOut) : kf(f, [[135, 560], [235, 540]], easeInOut);

  const grey = kf(f, [[240, 0], [320, 1]], easeInOut);
  const apart = kf(f, [[250, 0], [345, 1]], easeInOut);

  const logo = spring((f - 328) / 16);
  const flood = kf(f, [[350, 40], [361, 1200]], (x) => 1 - (1 - x) * (1 - x));

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 65% 50%, #E8F1FC, transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${z}) translate(${-camX}px, ${-camY}px)` }}>
        {CHIPS.map((c, i) => {
          const pop = spring((f - 2 - c.d / 42) / 14);
          const label = spring((f - 62 - i * 1.2) / 12);
          const tag = clamp((f - 150 - i * 1.5) / 8);
          const bob = Math.sin((f / 30) * Math.PI * 0.5 + hash(i) * 6) * 4;
          const x = c.x + (c.x - CENTER.x) * 0.35 * apart;
          const y = c.y + (c.y - CENTER.y) * 0.35 * apart + bob;
          return (
            <div
              key={c.name}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${clamp(pop, 0, 1.2) * (1 - 0.1 * grey)})`,
                opacity: clamp(pop * 2) * (1 - 0.55 * grey),
                filter: grey > 0.01 ? `grayscale(${grey})` : undefined,
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 28px 10px 10px', borderRadius: 40, background: '#FFFFFF', whiteSpace: 'nowrap', boxShadow: '0 14px 30px -16px rgba(41,67,118,0.45), inset 0 0 0 1px #EEF0F4' }}>
                <div style={{ width: 54, height: 54, borderRadius: 27, background: c.tone[1], color: c.tone[2], fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(c.name)}</div>
                <span style={{ fontSize: 26, fontWeight: 600, color: C.ink }}>{c.name}</span>
                {label > 0 && (
                  <span style={{ position: 'absolute', right: -12, top: -18, padding: '5px 12px', borderRadius: 999, fontSize: 16, fontWeight: 700, background: c.label[1], color: c.label[2], boxShadow: '0 0 0 3px #FFFFFF', scale: String(clamp(label, 0, 1.2)) }}>
                    {c.label[0]}
                  </span>
                )}
                {tag > 0 && (
                  <span style={{ position: 'absolute', left: 78, top: '100%', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 17, fontWeight: 600, color: '#E0465A', opacity: tag, translate: `0px ${(1 - tag) * 10}px` }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></svg>
                    {c.age} lalu
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Wash on the left so the headline reads over the cloud */}
      <Fill style={{ background: 'linear-gradient(90deg, #FDFDFB 0%, #FDFDFB 36%, rgba(253,253,251,0.8) 48%, rgba(253,253,251,0) 64%)' }} />
      <MaskLines f={f} lines={['Kenalanmu *banyak.']} start={12} end={50} />
      <MaskLines f={f} lines={['Guru, sahabat,', 'keluarga.']} start={57} end={126} />
      <MaskLines f={f} lines={['Tapi kapan terakhir', 'kamu *menyapa', 'mereka?']} start={135} end={226} />
      <MaskLines f={f} lines={['Kesibukan membuat', 'kita lupa.']} start={237} end={278} />
      <MaskLines f={f} lines={['Yang dekat,', 'perlahan *menjauh.']} start={285} end={326} accent="#A3A8B3" />
      {/* Sapa arrives in the middle, then its haze floods the frame */}
      {logo > 0 && (
        <div style={{ position: 'absolute', left: 960 - 80, top: 540 - 80, width: 160, height: 160, scale: String(clamp(logo, 0, 1.25)) }}>
          <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'rgba(47,107,255,0.12)', scale: String(1 + 0.15 * Math.sin(((f - 328) / 15) * Math.PI)) }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#FBFCFE', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #E8E8EA, 0 18px 40px -16px rgba(30,47,82,0.45)' }}>
            <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', scale: '1.16' }} />
          </div>
        </div>
      )}
      {f >= 350 && <div style={{ position: 'absolute', left: 960 - flood, top: 540 - flood, width: flood * 2, height: flood * 2, borderRadius: '50%', background: C.haze }} />}
    </Fill>
  );
};
