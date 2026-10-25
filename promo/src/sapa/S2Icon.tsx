import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, Fill, clamp, expoIn, expoOut, kf, useF } from './lib';

// Shot 2 (global f72–100, local 0–28): the Sapa icon lands on the drop, four squares
// orbit in counter-clockwise and lock into a cross, then everything folds into a row.
const SQUARES = [
  { color: '#FFFFFF', edge: true, angle: 180 }, // left
  { color: C.blue, edge: false, angle: 270 }, // top
  { color: C.cyan, edge: false, angle: 0 }, // right
  { color: C.mint, edge: false, angle: 90 }, // bottom
];

export const S2Icon: React.FC = () => {
  const f = useF();
  const g = f + 72; // global frame keeps the storyboard numbers readable

  const icon = g <= 88 ? kf(g, [[72, 330], [86, 214]], expoOut) : kf(g, [[88, 214], [100, 48]], expoIn);
  const halo = kf(g, [[72, 0], [75, 290], [86, 390]], expoOut) * (g > 88 ? kf(g, [[88, 1], [98, 0]], expoIn) : 1);
  const spin = kf(g, [[72, 220], [86, 0]], expoOut); // degrees still to turn, counter-clockwise
  const radius = kf(g, [[72, 420], [86, 260]], expoOut);
  const fold = kf(g, [[88, 0], [100, 1]], expoIn); // 0 = cross, 1 = row to the right of the icon
  const blur = g > 88 ? kf(g, [[88, 0.3], [100, 6]], expoIn) : 0;
  const sq = kf(g, [[72, 80], [86, 110]], expoOut) * (1 - 0.55 * fold);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      <div
        style={{
          position: 'absolute',
          left: 960 - halo / 2,
          top: 540 - halo / 2,
          width: halo,
          height: halo,
          borderRadius: '50%',
          background: '#E9E9E7',
        }}
      />
      {SQUARES.map((s, i) => {
        const a = ((s.angle + spin) * Math.PI) / 180;
        const crossX = 960 + Math.cos(a) * radius;
        const crossY = 540 + Math.sin(a) * radius;
        // Row slot: right of the icon; the white square slips behind it.
        const rowX = 960 + (i === 0 ? 0 : icon / 2 + 30 + (i - 1) * (sq + 14) + sq / 2);
        const x = crossX + (rowX - crossX) * fold;
        const y = crossY + (540 - crossY) * fold;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - sq / 2,
              top: y - sq / 2,
              width: sq,
              height: sq,
              borderRadius: sq * 0.28,
              background: s.color,
              zIndex: i === 0 ? 0 : 2,
              opacity: clamp((g - 72) / 3),
              boxShadow: s.edge ? 'inset 0 0 0 1px #E3E8EF, 0 6px 18px -8px rgba(30,47,82,0.3)' : '0 8px 20px -10px rgba(30,47,82,0.4)',
            }}
          />
        );
      })}
      <Img
        src={staticFile('logo.png')}
        style={{
          position: 'absolute',
          left: 960 - icon / 2,
          top: 540 - icon / 2,
          width: icon,
          height: icon,
          zIndex: 1,
          filter: 'drop-shadow(0 18px 30px rgba(30,47,82,0.28))',
        }}
      />
    </Fill>
  );
};
