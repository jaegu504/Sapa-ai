import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, C, Fill, expoIn, expoOut, kf, useF } from './lib';

// Shot 9 (global f493–536, local 0–43): the logo disc rises into the centre, holds still
// (the only frozen stretch of the film), then shrinks away accelerating.
export const S9Logo: React.FC = () => {
  const f = useF();
  const top = kf(f, [[0, 760], [5, 500], [10, 436], [18, 420]], expoOut);
  const size = f <= 33 ? 240 : kf(f, [[33, 240], [43, 170]], expoIn);
  const smear = kf(f, [[0, 18], [4, 0]], expoOut);
  return (
    <Fill style={{ background: C.page }}>
      <BlurDef id="s9smear" x={0} y={smear} />
      <div
        style={{
          position: 'absolute',
          left: 960 - size / 2,
          top: top + (240 - size) / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#F6F6F6',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px #E8E8EA, 0 20px 40px -22px rgba(30,47,82,0.4)',
          filter: smear > 0.05 ? 'url(#s9smear)' : undefined,
        }}
      >
        <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', scale: '1.16' }} />
      </div>
    </Fill>
  );
};
