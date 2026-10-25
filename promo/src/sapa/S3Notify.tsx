import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, useF } from './lib';

// Shot 3 (global f101–172, local 0–71): the icon lands in an Android status bar; tapping it
// springs out a frosted morning reminder, then the whole scene whips upward.
const ICON_X = 390; // Sapa icon centre in the status bar (before the pan)

const Wallpaper: React.FC = () => (
  <svg width={2320} height={760} viewBox="-200 0 2320 760" style={{ position: 'absolute', left: -200, top: 460 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.deep} />
        <stop offset="1" stopColor={C.sky} />
      </linearGradient>
      <radialGradient id="teal" cx="0.85" cy="0.1" r="0.45">
        <stop offset="0" stopColor="#7FE3F0" stopOpacity="0.5" />
        <stop offset="1" stopColor="#7FE3F0" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={-200} width={2320} height={760} fill="url(#sky)" />
    <rect x={-200} width={2320} height={760} fill="url(#teal)" />
    <g stroke="rgba(255,255,255,0.35)" strokeWidth={2} fill="none">
      <circle cx={1280} cy={420} r={330} />
      <line x1={-200} y1={250} x2={2120} y2={250} />
      <line x1={-200} y1={520} x2={2120} y2={520} />
      <line x1={1610} y1={0} x2={1610} y2={700} />
    </g>
    <path d="M1610 230 L1618 250 L1638 250 L1618 258 L1610 278 L1602 258 L1582 250 L1602 250 Z" fill="#FFFFFF" opacity={0.85} />
  </svg>
);

export const S3Notify: React.FC = () => {
  const f = useF();

  const enterBlur = kf(f, [[0, 3], [9, 0]], expoOut);
  const pan = kf(f, [[14, 0], [29, 125]], (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2));
  const rise = f > 35 ? kf(f, [[35, 0], [71, -620]], expoIn) : 0;
  const whipBlur = f > 50 ? kf(f, [[50, 0], [71, 8]], expoIn) : 0;
  const tint = kf(f, [[66, 0], [71, 1]]);

  // Frosted reminder springs out from under the icon.
  const open = clamp((f - 15) / 22);
  const spring = 1 - Math.exp(-6 * open) * Math.cos(9 * open);
  const cardW = 1000 * spring;
  const cardH = 260 * clamp(spring * 1.05);
  const cardX = ICON_X - 40 + (335 - (ICON_X - 40)) * spring;
  const textIn = clamp((f - 24) / 8);

  const touchY = kf(f, [[1, 1100], [10, 430]], expoOut);
  const touchX = f < 30 ? ICON_X : kf(f, [[30, ICON_X], [44, 900]], expoOut);
  const touchY2 = f < 30 ? touchY : kf(f, [[30, 430], [44, 690]], expoOut);
  const press = kf(f, [[12, 0], [14, 1], [16, 0]]) + kf(f, [[46, 0], [48, 1], [51, 0]]);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <BlurDef id="s3whip" x={0.4} y={whipBlur} />
      <Fill style={{ translate: `0px ${rise}px`, filter: whipBlur > 0.05 ? 'url(#s3whip)' : enterBlur > 0.05 ? `blur(${enterBlur}px)` : undefined }}>
        <Fill style={{ translate: `${pan}px 0px` }}>
          <Wallpaper />
          {/* Phone bezel band and status bar */}
          <div style={{ position: 'absolute', left: -200, right: -200, top: 330, height: 52, background: '#0B0B0D', borderTop: '2px solid #686866' }} />
          <div
            style={{
              position: 'absolute',
              left: -200,
              right: -200,
              top: 382,
              height: 78,
              background: C.navy,
              display: 'flex',
              alignItems: 'center',
              color: '#FFFFFF',
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            <span style={{ position: 'absolute', left: 110 + 200, top: 18 }}>08:00</span>
            <Img src={staticFile('logo.png')} style={{ position: 'absolute', left: ICON_X + 200 - 28, top: 11, width: 56, height: 56, borderRadius: 14 }} />
            {[C.blue, C.cyan, C.mint].map((c, i) => (
              <span key={c} style={{ position: 'absolute', left: ICON_X + 200 + 70 + i * 48, top: 25, width: 28, height: 28, borderRadius: 14, background: c }} />
            ))}
            {/* Wi-Fi + battery on the right */}
            <svg width={180} height={44} style={{ position: 'absolute', right: 380, top: 17 }} viewBox="0 0 180 44">
              <path d="M10 22 Q30 4 50 22 M18 29 Q30 18 42 29 M26 36 Q30 32 34 36" stroke="#FFF" strokeWidth={4} fill="none" strokeLinecap="round" />
              <rect x={90} y={10} width={70} height={26} rx={7} stroke="#FFF" strokeWidth={3} fill="none" />
              <rect x={95} y={15} width={48} height={16} rx={3} fill="#FFF" />
              <rect x={163} y={18} width={5} height={10} rx={2} fill="#FFF" />
            </svg>
          </div>

          {/* Frosted reminder */}
          {open > 0 && (
            <div
              style={{
                position: 'absolute',
                left: cardX,
                top: 520,
                width: cardW,
                height: cardH,
                borderRadius: 60,
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(226,238,252,0.62))',
                backdropFilter: 'blur(24px) saturate(1.3)',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.95), 0 30px 70px -30px rgba(15,30,70,0.55)',
              }}
            >
              <div style={{ position: 'absolute', left: 48, top: 44, display: 'flex', alignItems: 'center', gap: 16, opacity: textIn, filter: `blur(${(1 - textIn) * 6}px)` }}>
                <Img src={staticFile('logo.png')} style={{ width: 48, height: 48, borderRadius: 12 }} />
                <span style={{ fontSize: 28, fontWeight: 600, color: '#45536F' }}>Sapa · sekarang</span>
              </div>
              <div style={{ position: 'absolute', left: 48, top: 112, fontSize: 50, fontWeight: 700, color: C.ink, letterSpacing: -1, opacity: textIn, filter: `blur(${(1 - textIn) * 6}px)` }}>
                3 orang perlu disapa hari ini
              </div>
              <div style={{ position: 'absolute', left: 48, top: 182, fontSize: 32, color: '#5B6782', opacity: textIn }}>
                Ahmet Hoca, Ibu, Budi Santoso
              </div>
            </div>
          )}
          <Touch x={touchX} y={touchY2} press={clamp(press)} opacity={clamp((f - 1) / 3)} />
        </Fill>
      </Fill>
      <Fill style={{ background: '#E6F4FE', opacity: tint }} />
    </Fill>
  );
};
