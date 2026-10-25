import React from 'react';
import { Img, staticFile } from 'remotion';
import { BlurDef, C, Fill, INTER, Touch, clamp, expoIn, expoOut, kf, useF } from './lib';
import { Headline, Phone, SCREEN_W, toStage } from './phone';

// Shot 3 (global f101–172, local 0–71): the phone's lock screen; Sapa's morning reminder drops
// in as an Android heads-up notification, gets tapped, then the scene whips upward.
export const S3Notify: React.FC = () => {
  const f = useF();

  const enter = kf(f, [[0, 160], [10, 0]], expoOut);
  const enterBlur = kf(f, [[0, 6], [8, 0]], expoOut);
  const rise = f > 52 ? kf(f, [[52, 0], [71, -900]], expoIn) : 0;
  const whip = f > 56 ? kf(f, [[56, 0], [71, 9]], expoIn) : 0;
  const tint = kf(f, [[66, 0], [71, 1]]);

  const drop = kf(f, [[12, 0], [24, 1]], (x) => 1 - Math.exp(-6 * x) * Math.cos(7 * x));
  const cardY = 56 - 200 * (1 - drop);
  const textIn = clamp((f - 18) / 8);
  const target = toStage(SCREEN_W / 2, 56 + 70, 0, enter);
  const tx = kf(f, [[30, 1720], [44, target.x + 40]], expoOut);
  const ty = kf(f, [[30, 900], [44, target.y + 16]], expoOut);
  const press = kf(f, [[45, 0], [47, 1], [50, 0]]);

  return (
    <Fill style={{ background: C.page, overflow: 'hidden', fontFamily: INTER }}>
      <Fill style={{ background: 'radial-gradient(ellipse 60% 60% at 70% 50%, #E3EFFC, transparent 70%)' }} />
      <BlurDef id="s3whip" x={0.4} y={whip} />
      <Fill style={{ translate: `0px ${rise}px`, filter: whip > 0.05 ? 'url(#s3whip)' : enterBlur > 0.05 ? `blur(${enterBlur}px)` : undefined }}>
        <Headline f={f} text="Diingatkan tiap pagi" end={72} sub="Siapa yang sudah waktunya disapa" />
        <Phone dy={enter} statusColor="#FFFFFF">
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(170deg, ${C.deep}, ${C.sky} 75%, #A9C6E2)` }} />
          <svg width={SCREEN_W} height={1016} style={{ position: 'absolute', inset: 0 }}>
            <g stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} fill="none">
              <circle cx={330} cy={640} r={230} />
              <line x1={0} y1={520} x2={SCREEN_W} y2={520} />
              <line x1={360} y1={0} x2={360} y2={1016} />
            </g>
            <path d="M360 505 L366 520 L381 520 L366 526 L360 541 L354 526 L339 520 L354 520 Z" fill="#FFFFFF" opacity={0.85} />
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center', color: '#FFFFFF' }}>
            <div style={{ fontSize: 110, fontWeight: 300, letterSpacing: -4 }}>08:00</div>
            <div style={{ fontSize: 24, fontWeight: 500, opacity: 0.85 }}>Minggu, 25 Oktober</div>
          </div>
          {drop > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                top: cardY,
                height: 150,
                borderRadius: 34,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(232,241,252,0.78))',
                backdropFilter: 'blur(20px) saturate(1.3)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 20px 40px -20px rgba(10,25,60,0.6)',
                scale: String(1 - 0.03 * press),
              }}
            >
              <div style={{ position: 'absolute', left: 22, top: 20, display: 'flex', alignItems: 'center', gap: 10, opacity: textIn }}>
                <Img src={staticFile('logo.png')} style={{ width: 30, height: 30, borderRadius: 8 }} />
                <span style={{ fontSize: 17, fontWeight: 600, color: '#45536F' }}>Sapa · sekarang</span>
              </div>
              <div style={{ position: 'absolute', left: 22, top: 62, fontSize: 26, fontWeight: 700, color: C.ink, opacity: textIn, filter: `blur(${(1 - textIn) * 5}px)` }}>
                3 orang perlu disapa hari ini
              </div>
              <div style={{ position: 'absolute', left: 22, top: 102, fontSize: 19, color: '#5B6782', opacity: textIn }}>Ahmet Hoca, Ibu, Budi Santoso</div>
            </div>
          )}
        </Phone>
        {f > 30 && f < 54 && <Touch x={tx} y={ty} press={press} opacity={clamp((f - 30) / 3)} />}
      </Fill>
      <Fill style={{ background: '#E6F4FE', opacity: tint }} />
    </Fill>
  );
};
