import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, Fill, INTER, expoIn, expoOut, kf, linear, useF } from './lib';

// Shot 10 (global f537–599, local 0–62): black end card, the Sapa logo and wordmark arrive
// with zoom streaks, settle with a slow shrink, then collapse as the film ends.
const LOCKUP_W = 760; // natural width of logo + word at scale 1

export const S10End: React.FC = () => {
  const f = useF();
  const width =
    f <= 52
      ? kf(f, [[0, 1650], [1, 1350], [2, 1110], [3, 1049], [8, 734], [10, 678], [20, 563], [43, 516], [52, 492]], linear)
      : kf(f, [[52, 492], [57, 450], [62, 267]], expoIn);
  const scale = width / LOCKUP_W;
  const smearX = kf(f, [[0, 26], [3, 6], [6, 0]], linear);
  const endBlur = f > 52 ? kf(f, [[52, 0], [62, 3.5]], expoIn) : 0;
  const streaks = kf(f, [[0, 1], [6, 0]], linear);

  const lockup = (extra: React.CSSProperties = {}) => (
    <div style={{ position: 'absolute', left: 960 - LOCKUP_W / 2, top: 540 - 100, width: LOCKUP_W, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 44, ...extra }}>
      <Img src={staticFile('logo.png')} style={{ width: 180, height: 180, filter: 'drop-shadow(0 0 30px rgba(120,200,255,0.35))' }} />
      <span
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 200,
          letterSpacing: -7,
          color: '#F3F3F5',
          textShadow: '0 0 6px rgba(255,255,255,0.55), 0 0 60px rgba(140,200,255,0.35)',
        }}
      >
        Sapa
      </span>
    </div>
  );

  return (
    <Fill style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%, #272729 0%, #0B0B0D 70%, #020204 100%)', overflow: 'hidden' }}>
      <BlurDef id="s10smear" x={smearX + endBlur} y={endBlur} />
      {streaks > 0.01 &&
        Array.from({ length: 24 }, (_, i) => (
          <React.Fragment key={i}>{lockup({ scale: String(scale * (1 + i * 0.045)), opacity: (streaks * (24 - i)) / 120, filter: 'blur(4px)' })}</React.Fragment>
        ))}
      {lockup({ scale: String(scale), filter: smearX + endBlur > 0.05 ? 'url(#s10smear)' : undefined })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, height: 70, overflow: 'hidden', textAlign: 'center', opacity: f > 52 ? 1 - endBlur / 3.5 : 1 }}>
        <div style={{ fontFamily: INTER, fontSize: 46, fontWeight: 500, color: '#A9B4C8', translate: `0px ${kf(f, [[12, 70], [26, 0]], expoOut)}px` }}>Jaga silaturahmi, tanpa lupa</div>
      </div>
    </Fill>
  );
};
