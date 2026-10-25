import React from 'react';
import { BlurDef, C, Fill, INTER, clamp, expoIn, expoOut, hash, kf, useF } from './lib';
import { Headline, Phone, SCREEN_W } from './phone';

// Shot 5 (global f246–317, local 0–71): inside the phone the Catat Suara sheet springs up,
// the mic pulses, the waveform moves and the user's story types in; then the scene whips up.
const STORY = 'Ahmet baru pulang umrah, anaknya mulai kuliah.';

/** Characters shown: about 1 per frame with a short hold every few characters. */
function typed(f: number): number {
  const start = 14;
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

  const enterBlur = kf(f, [[0, 10], [8, 0]], expoOut);
  const sheet = kf(f, [[0, 0], [14, 1]], (x) => 1 - Math.exp(-6 * x) * Math.cos(7.5 * x));
  const rise = f > 52 ? kf(f, [[52, 0], [71, -900]], expoIn) : 0;
  const whip = f > 56 ? kf(f, [[56, 0], [71, 9]], expoIn) : 0;
  const tint = kf(f, [[66, 0], [71, 1]]);
  const shown = Math.floor(typed(f));
  const listening = f < 50 ? 1 : 0;
  const ring = (d: number) => 1 + 0.12 * Math.max(0, Math.sin((f / 14.5) * Math.PI * 2 + d)) * listening;

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 70% 50%, #E3EFFC, transparent 70%)' }} />
      <BlurDef id="s5whip" x={0.4} y={whip} />
      <Fill style={{ translate: `0px ${rise}px`, filter: whip > 0.05 ? 'url(#s5whip)' : enterBlur > 0.05 ? `blur(${enterBlur}px)` : undefined }}>
        <Headline f={f} text="Cukup ceritakan kabarnya" start={6} end={72} sub="Sapa merapikan ceritamu" />
        <Phone>
          {/* App behind the sheet, dimmed */}
          <div style={{ position: 'absolute', inset: 0, background: '#EEF1F6', filter: 'blur(3px)' }}>
            <div style={{ position: 'absolute', left: 28, top: 70, fontSize: 40, fontWeight: 800, color: C.ink }}>Radar Sapa</div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 150 + i * 110, height: 90, borderRadius: 24, background: '#FFFFFF' }} />
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,18,22,0.35)', opacity: clamp(f / 6) }} />

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 760,
              translate: `0px ${(1 - sheet) * 760}px`,
              borderRadius: '40px 40px 0 0',
              background: C.page,
              boxShadow: '0 -20px 50px -20px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ position: 'absolute', left: SCREEN_W / 2 - 22, top: 12, width: 44, height: 5, borderRadius: 3, background: '#CDD2DA' }} />
            <div style={{ position: 'absolute', left: 24, right: 24, top: 36, display: 'flex', justifyContent: 'space-between', fontSize: 19 }}>
              <span style={{ color: C.blue }}>Batal</span>
              <b style={{ color: C.ink }}>Catat Suara</b>
              <span style={{ fontSize: 14, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#E6E9EF', color: C.ink }}>ID</span>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 84, textAlign: 'center', fontSize: 16, color: '#7A8190' }}>Kabar tentang Ahmet Hoca</div>
            {/* Pulsing mic */}
            <div style={{ position: 'absolute', left: SCREEN_W / 2 - 100, top: 120, width: 200, height: 200 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', scale: String(ring(0)) }} />
              <div style={{ position: 'absolute', inset: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', scale: String(ring(0.8)) }} />
              <div style={{ position: 'absolute', inset: 56, borderRadius: '50%', background: listening ? 'linear-gradient(135deg, #F43F5E, #FB7185)' : 'linear-gradient(135deg, #2F54EB, #4F5BE8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -10px rgba(99,102,241,0.9)' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.2} strokeLinecap="round"><rect x={9} y={2} width={6} height={12} rx={3} /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></svg>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', gap: 5, alignItems: 'center', height: 34 }}>
              {Array.from({ length: 15 }, (_, i) => (
                <span key={i} style={{ width: 4, height: Math.max(6, 8 + 26 * Math.abs(Math.sin(f * 0.5 + i * 0.9 + hash(i) * 3)) * listening), borderRadius: 2, background: C.cyan }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 372, textAlign: 'center', fontSize: 16, color: '#7A8190' }}>{listening ? 'Mendengarkan...' : 'Selesai'}</div>
            {/* Story card */}
            <div style={{ position: 'absolute', left: 20, right: 20, top: 412, height: 170, borderRadius: 22, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #E6E9EF', padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#5B6782', marginBottom: 6 }}>Cerita Anda</div>
              <div style={{ fontSize: 24, lineHeight: 1.35, fontWeight: 500, color: C.ink }}>
                {STORY.slice(0, shown)}
                <span style={{ display: 'inline-block', width: 3, height: 26, marginLeft: 2, verticalAlign: '-5px', background: C.blue, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 20, right: 20, top: 602, height: 64, borderRadius: 20, background: C.blue, color: '#FFF', fontSize: 21, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shown >= STORY.length ? 1 : 0.4 }}>
              Proses Catatan
            </div>
          </div>
        </Phone>
      </Fill>
      <Fill style={{ background: '#E6F4FE', opacity: tint }} />
    </Fill>
  );
};
