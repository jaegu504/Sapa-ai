import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, C, Fill, INTER, Touch, clamp, easeInOut, expoOut, kf, useF } from './lib';
import { Phone, SCREEN_W, toStage } from './phone';

// Shot 1 (f0–71): the Sapa lockup rises out of a blue haze on the left while an Android
// phone rises on the right; a touch opens Sapa from the home screen.
const APPS = ['#FF5F57', '#34C759', '#0A84FF', '#FFCC00', '#5E5CE6', '#30B0C7', '#FF9F0A', '#8E8E93', '#64D2FF', 'sapa', '#AF52DE', '#32D74B'];
const ICON = 76;
const GAP_X = (SCREEN_W - 4 * ICON) / 5;
const iconPos = (i: number) => ({ x: GAP_X + (i % 4) * (ICON + GAP_X), y: 380 + Math.floor(i / 4) * 128 });
const SAPA = iconPos(9);

export const S1Header: React.FC = () => {
  const f = useF();

  const haze = clamp(1 - f / 28);
  const lockY = kf(f, [[0, 520], [2, 380], [5, 290], [10, 200], [24, 150], [37, 140]], expoOut) - Math.max(0, f - 37);
  const nameBlur = kf(f, [[2, 14], [8, 3], [14, 0]], expoOut);
  const pillBlur = kf(f, [[4, 22], [10, 4], [18, 0]], expoOut);
  const pillShift = kf(f, [[4, 15], [18, 0]], expoOut);
  const phoneY = kf(f, [[6, 700], [14, 180], [24, 30], [36, 0]], expoOut) - Math.max(0, f - 36) * 0.6;
  const phoneIn = clamp((f - 6) / 6);

  const zoom = f <= 61 ? kf(f, [[46, 1], [60, 1.12]], easeInOut) : kf(f, [[61, 1.12], [71, 1.22]], (x) => x * x);
  const open = kf(f, [[62, 0], [71, 1]], (x) => x * x);
  const blur = f > 64 ? kf(f, [[64, 0], [71, 5]], (x) => x * x) : 0;

  const target = toStage(SAPA.x + ICON / 2, SAPA.y + ICON / 2, 0, phoneY);
  const tx = kf(f, [[27, 1720], [44, 1560], [56, target.x + 18], [60, target.x + 6]], expoOut);
  const ty = kf(f, [[27, 260], [44, 300], [56, target.y + 20], [60, target.y + 8]], expoOut);
  const press = kf(f, [[58, 0], [61, 1], [64, 0.4]]);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 100%, #DBEEFD, transparent 70%)' }} />
      <Fill style={{ background: C.haze, opacity: haze }} />
      <BlurDef id="s1blur" x={blur} y={blur} />
      <Fill style={{ scale: String(zoom), transformOrigin: `${target.x}px ${target.y}px`, filter: blur > 0.05 ? 'url(#s1blur)' : undefined }}>
        {/* Lockup on the left */}
        <div style={{ position: 'absolute', left: 150, top: 540 - 90 + lockY - 140, height: 180, display: 'flex', alignItems: 'center', gap: 34 }}>
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: '50%',
              background: '#FBFCFE',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1px #E8E8EA, 0 14px 30px -14px rgba(30,47,82,0.35)',
            }}
          >
            <Img src={staticFile('logo.png')} style={{ width: '100%', height: '100%', scale: '1.16' }} />
          </div>
          <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -5, color: C.ink, filter: `blur(${nameBlur}px)`, opacity: f < 2 ? 0 : 1 }}>Sapa</div>
          <div
            style={{
              padding: '16px 34px',
              borderRadius: 999,
              background: '#2F2E2F',
              color: '#FFFFFF',
              fontSize: 52,
              fontWeight: 600,
              filter: `blur(${pillBlur}px)`,
              translate: `${pillShift}px 0px`,
              opacity: f < 4 ? 0 : 1,
            }}
          >
            AI
          </div>
        </div>
        <div style={{ position: 'absolute', left: 156, top: 540 + 120 + lockY - 140, fontSize: 40, color: '#5B6782', opacity: clamp((f - 14) / 10) }}>
          Jaga silaturahmi, tanpa lupa
        </div>

        <div style={{ opacity: phoneIn }}>
          <Phone dy={phoneY} statusColor="#FFFFFF">
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(170deg, ${C.deep}, ${C.sky} 70%, #A9C6E2)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', color: '#FFFFFF' }}>
              <div style={{ fontSize: 96, fontWeight: 300, letterSpacing: -3 }}>08:00</div>
              <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.85 }}>Minggu, 25 Oktober</div>
            </div>
            {APPS.map((c, i) => {
              const p = iconPos(i);
              return c === 'sapa' ? (
                <Img key={i} src={staticFile('logo.png')} style={{ position: 'absolute', left: p.x, top: p.y, width: ICON, height: ICON, borderRadius: 22, boxShadow: '0 8px 18px -8px rgba(0,0,0,0.5)' }} />
              ) : (
                <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: ICON, height: ICON, borderRadius: 22, background: c, opacity: 0.92 }} />
              );
            })}
            <div style={{ position: 'absolute', left: SAPA.x - 6, top: SAPA.y + ICON + 8, width: ICON + 12, textAlign: 'center', color: '#FFF', fontSize: 16, fontWeight: 600 }}>Sapa</div>
            {/* Dock */}
            <div style={{ position: 'absolute', left: 24, right: 24, bottom: 46, height: 104, borderRadius: 40, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(14px)' }} />
            {/* App opening from its icon */}
            {open > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: SAPA.x * (1 - open),
                  top: SAPA.y * (1 - open),
                  width: ICON + (SCREEN_W - ICON) * open,
                  height: ICON + (1016 - ICON) * open,
                  borderRadius: 22 + 40 * open,
                  background: C.page,
                }}
              />
            )}
          </Phone>
        </div>
        {f >= 27 && f < 66 && <Touch x={tx} y={ty} press={press} opacity={clamp((f - 27) / 3) * clamp((66 - f) / 3)} />}
      </Fill>
    </Fill>
  );
};
