import React from 'react';
import { BlurDef, C, Fill, INTER, clamp, expoIn, expoOut, hash, kf, useF } from './lib';

// Shot 5 (global f246–317, local 0–71): a frosted voice box springs open over the blue sky,
// the waveform moves and the user's story types in, then the scene whips up.
const STORY = 'Ahmet baru pulang umrah, anaknya mulai kuliah.';

/** Characters shown: about 1 per frame with a 1-frame hold every 2–3 characters. */
function typed(f: number): number {
  const start = 12;
  if (f < start) return 0;
  let n = 0;
  let t = start;
  while (t <= f && n < STORY.length) {
    n += 1;
    t += n % 3 === 0 || n % 7 === 0 ? 2 : 1;
  }
  return Math.min(n * 2, STORY.length);
}

export const S5Voice: React.FC = () => {
  const f = useF();

  const open = clamp(f / 20);
  const spring = 1 - Math.exp(-5.5 * open) * Math.cos(8 * open);
  const boxW = 1160 * spring;
  const boxH = 420 * clamp(0.35 + 0.65 * spring);
  const enterBlur = kf(f, [[0, 10], [8, 0]], expoOut);
  const rise = f > 52 ? kf(f, [[52, 0], [71, -700]], expoIn) : 0;
  const whip = f > 56 ? kf(f, [[56, 0], [71, 8]], expoIn) : 0;
  const tint = kf(f, [[66, 0], [71, 1]]);
  const shown = Math.floor(typed(f));
  const listening = f < 54 ? 1 : 0;

  return (
    <Fill style={{ overflow: 'hidden', fontFamily: INTER, background: `linear-gradient(180deg, ${C.deep}, ${C.sky})` }}>
      <BlurDef id="s5whip" x={0.4} y={whip} />
      <Fill style={{ translate: `0px ${rise}px`, filter: whip > 0.05 ? 'url(#s5whip)' : enterBlur > 0.05 ? `blur(${enterBlur}px)` : undefined }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="s5glow" cx="0.8" cy="0.15" r="0.5">
              <stop offset="0" stopColor="#7FE3F0" stopOpacity="0.45" />
              <stop offset="1" stopColor="#7FE3F0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={1920} height={1080} fill="url(#s5glow)" />
          <g stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none">
            <circle cx={1360} cy={560} r={420} />
            <line x1={0} y1={300} x2={1920} y2={300} />
            <line x1={0} y1={830} x2={1920} y2={830} />
            <line x1={420} y1={0} x2={420} y2={1080} />
          </g>
        </svg>

        <div
          style={{
            position: 'absolute',
            left: 960 - boxW / 2,
            top: 540 - boxH / 2,
            width: boxW,
            height: boxH,
            borderRadius: 64,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(224,238,252,0.55))',
            backdropFilter: 'blur(26px) saturate(1.35)',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.5), 0 40px 90px -30px rgba(10,25,60,0.6)',
          }}
        >
          <div style={{ position: 'absolute', left: 56, top: 44, display: 'flex', alignItems: 'center', gap: 18, opacity: clamp((f - 6) / 6) }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: 'linear-gradient(135deg, #2F54EB, #4F5BE8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.2} strokeLinecap="round">
                <rect x={9} y={2} width={6} height={12} rx={3} />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
              </svg>
            </div>
            <span style={{ fontSize: 34, fontWeight: 700, color: C.navy }}>Catat Suara</span>
            <span style={{ fontSize: 26, fontWeight: 600, color: '#2E7D52', background: 'rgba(78,214,160,0.22)', padding: '6px 18px', borderRadius: 999 }}>Ahmet Hoca</span>
          </div>
          {/* Waveform */}
          <div style={{ position: 'absolute', right: 60, top: 50, display: 'flex', gap: 7, alignItems: 'center', height: 50 }}>
            {Array.from({ length: 16 }, (_, i) => {
              const h = 10 + 38 * Math.abs(Math.sin(f * 0.45 + i * 0.9 + hash(i) * 3)) * listening;
              return <span key={i} style={{ width: 6, height: Math.max(8, h), borderRadius: 3, background: i % 3 === 0 ? C.blue : C.cyan, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ position: 'absolute', left: 56, right: 56, top: 150, fontSize: 52, fontWeight: 500, lineHeight: 1.3, color: C.ink, letterSpacing: -0.5 }}>
            {STORY.slice(0, shown)}
            <span style={{ display: 'inline-block', width: 4, height: 58, marginLeft: 4, verticalAlign: '-10px', background: C.blue, borderRadius: 2 }} />
          </div>
          {/* Bottom tools */}
          <div style={{ position: 'absolute', left: 56, bottom: 40, display: 'flex', gap: 30, opacity: 0.85 }}>
            {[0, 1, 2].map((i) => (
              <svg key={i} width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {i === 0 && <path d="M12 5v14M5 12h14" />}
                {i === 1 && <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z" />}
                {i === 2 && <circle cx={12} cy={12} r={9} />}
              </svg>
            ))}
          </div>
          <div style={{ position: 'absolute', right: 44, bottom: 30, width: 70, height: 70, borderRadius: 35, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </Fill>
      <Fill style={{ background: '#E6F4FE', opacity: tint }} />
    </Fill>
  );
};
