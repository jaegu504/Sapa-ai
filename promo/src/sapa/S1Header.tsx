import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, C, Fill, INTER, Touch, clamp, easeInOut, expoOut, kf, linear, useF } from './lib';

// Shot 1 (f0–71): the Sapa lockup rises out of a blue haze inside a light Radar window,
// a touch glides in and taps the logo while the camera pushes in.
export const S1Header: React.FC = () => {
  const f = useF();

  const haze = clamp(1 - f / 28);
  const lockY = kf(f, [[0, 932], [2, 776], [5, 683], [10, 608], [24, 546], [37, 536]], expoOut) - Math.max(0, f - 37) * 1;
  const nameBlur = kf(f, [[2, 14], [8, 3], [14, 0]], expoOut);
  const pillBlur = kf(f, [[4, 22], [10, 4], [18, 0]], expoOut);
  const pillShift = kf(f, [[4, 15], [18, 0]], expoOut);
  const winOpacity = kf(f, [[0, 0], [14, 0], [15, 0.53], [19, 0.7], [24, 1]]);
  const ring = kf(f, [[53, 0], [60, 1]], expoOut);

  // Touch path: enters gliding left, dives onto the disc, presses at the end.
  const tx = kf(f, [[27, 1400], [44, 1200], [56, 768], [59, 728], [71, 706]], expoOut);
  const ty = kf(f, [[27, 330], [44, 318], [56, 600], [59, 586], [71, 572]], expoOut);
  const hover = kf(f, [[56, 1], [62, 1.4]], expoOut);
  const press = kf(f, [[69, 0], [71, 1]], linear);

  const zoom = f <= 61 ? kf(f, [[46, 1], [60, 1.2]], easeInOut) : kf(f, [[61, 1.2], [71, 1.04]], (x) => x * x);
  const zoomBlur = f > 63 ? kf(f, [[63, 0], [71, 4]], (x) => x * x) : 0;

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: `radial-gradient(ellipse 70% 55% at 50% 100%, #DBEEFD, transparent 70%)` }} />
      <Fill style={{ background: C.haze, opacity: haze }} />
      <BlurDef id="s1zoom" x={zoomBlur} y={zoomBlur} />
      <Fill style={{ scale: String(zoom), transformOrigin: '960px 540px', filter: zoomBlur > 0.05 ? 'url(#s1zoom)' : undefined }}>
        {/* Radar window */}
        <div
          style={{
            position: 'absolute',
            left: 520,
            top: 300,
            width: 1600,
            height: 1000,
            borderRadius: 93,
            background: '#FCFDFF',
            opacity: winOpacity,
            overflow: 'hidden',
            boxShadow: '0 30px 80px -30px rgba(41,67,118,0.25), inset 0 0 0 1px #EEF2F8',
          }}
        >
          <div style={{ height: 120, background: '#F1F6FF', display: 'flex', alignItems: 'center', paddingLeft: 260 }}>
            <div style={{ width: 520, height: 56, borderRadius: 28, background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #E3EAF5' }} />
          </div>
          <Fill style={{ top: 120, background: 'radial-gradient(ellipse 80% 50% at 50% 110%, #E3F0FD, transparent 70%)' }} />
          {/* Left icon column */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 70,
                top: 560 + i * 150,
                width: 72,
                height: 72,
                borderRadius: 22,
                background: i === 0 ? '#E4EEFF' : '#F2F4F8',
                opacity: i === 0 ? 1 : 0.55,
              }}
            />
          ))}
          {/* Pulse ring card */}
          <div
            style={{
              position: 'absolute',
              left: 640,
              top: 420,
              width: 980,
              height: 560,
              borderRadius: 64,
              background: '#FFFFFF',
              boxShadow: '0 20px 60px -30px rgba(41,67,118,0.35)',
            }}
          >
            <svg width={300} height={300} style={{ position: 'absolute', left: 60, top: 60 }} viewBox="0 0 300 300">
              <circle cx={150} cy={150} r={110} stroke="#EEF2F7" strokeWidth={24} fill="none" />
              <circle
                cx={150}
                cy={150}
                r={110}
                stroke={C.mint}
                strokeWidth={24}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={691}
                strokeDashoffset={691 * (1 - 0.63 * clamp((f - 20) / 30))}
                transform="rotate(-90 150 150)"
              />
              <text x={150} y={168} textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize={64} fill={C.ink}>
                63%
              </text>
            </svg>
            {['8 Aktif', '3 Perlu Disapa', '0 Dijeda'].map((label, i) => (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  left: 420,
                  top: 90 + i * 92,
                  width: 420,
                  height: 68,
                  borderRadius: 34,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  paddingLeft: 28,
                  fontSize: 30,
                  fontWeight: 600,
                  color: i === 1 ? '#E0465A' : '#3B4254',
                  background: i === 1 ? '#FDECEF' : '#F4F6FA',
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 7, background: i === 0 ? C.mint : i === 1 ? '#F0566B' : '#B7BECB' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Lockup: disc + name + pill, centred */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lockY - 90,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            <div
              style={{
                position: 'absolute',
                inset: -24,
                borderRadius: '50%',
                opacity: ring,
                background: 'radial-gradient(circle, #F7FEFF 55%, #D5F3FF 72%, transparent 73%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#FBFCFE',
                boxShadow: 'inset 0 0 0 1px #E8E8EA, 0 14px 30px -14px rgba(30,47,82,0.35)',
                overflow: 'hidden',
              }}
            >
              <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', scale: '1.16' }} />
            </div>
          </div>
          <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -5, color: C.ink, filter: `blur(${nameBlur}px)`, opacity: f < 2 ? 0 : 1 }}>
            Sapa
          </div>
          <div
            style={{
              padding: '18px 38px',
              borderRadius: 999,
              background: '#2F2E2F',
              color: '#FFFFFF',
              fontSize: 56,
              fontWeight: 600,
              filter: `blur(${pillBlur}px)`,
              translate: `${pillShift}px 0px`,
              opacity: f < 4 ? 0 : 1,
            }}
          >
            AI
          </div>
        </div>

        {f >= 27 && <Touch x={tx} y={ty} scale={hover} press={press} opacity={clamp((f - 27) / 3)} />}
      </Fill>
    </Fill>
  );
};
