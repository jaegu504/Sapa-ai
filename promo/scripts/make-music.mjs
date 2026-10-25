// Synthesizes the promo soundtrack from src/sapa/timeline.json: a quiet, minor piano-and-pad
// intro under the problem, soft house at 124 BPM from Sapa's reveal, plus whooshes on every cut,
// taps, typing ticks and card hits placed on the remapped shot times. Writes public/music.wav.
// Pure function of time (seeded noise only), so every run gives the same file.
import { readFileSync, writeFileSync } from 'node:fs';

const TL = JSON.parse(readFileSync(new URL('../src/sapa/timeline.json', import.meta.url), 'utf8'));
const SHOT = {};
{
  let from = 0;
  for (const s of TL.shots) {
    SHOT[s.name] = { from, map: s.map };
    from += s.len;
  }
  SHOT.total = from;
}
/** Seconds at which a shot reaches scene frame f (inverse of its time remap). */
const at = (name, f) => {
  const { from, map } = SHOT[name];
  for (let i = 1; i < map.length; i++) {
    const [r0, s0] = map[i - 1];
    const [r1, s1] = map[i];
    if (f <= s1) return (from + r0 + ((f - s0) / (s1 - s0)) * (r1 - r0)) / TL.fps;
  }
  return (from + map[map.length - 1][0]) / TL.fps;
};

const SR = 48000;
const DUR = SHOT.total / TL.fps;
const N = Math.round(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);

const BEAT = 60 / 124; // 0.4839 s
const DROP = at('P Problem', 361); // the haze has filled the frame
const beat = (k) => DROP + BEAT * k;
const END = SHOT['S10 End'].from / TL.fps; // end card, drums stop
const LAST = Math.floor((END - DROP) / BEAT);

// Seeded noise (never Math.random).
let seed = 1234567;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (i, l, r = l) => {
  if (i >= 0 && i < N) {
    L[i] += l;
    R[i] += r;
  }
};

// ---- Harmony: A m7 → F maj7 → C maj7 → G6 under the problem; then F maj7 → A m7 → C maj9 → G6 ----
const SAD = [
  [57, 60, 64, 67],
  [53, 57, 60, 64],
  [48, 55, 59, 64],
  [55, 59, 62, 64],
];
const CHORDS = [
  [53, 57, 60, 64],
  [57, 60, 64, 67],
  [48, 55, 60, 64, 62 + 12],
  [55, 59, 62, 64],
];
const BAR = BEAT * 4;
const chordAt = (t) => {
  const bar = Math.floor((t - DROP) / BAR);
  return (t < DROP ? SAD : CHORDS)[((bar % 4) + 4) % 4];
};

// Sidechain duck after the drop: dips the pad and bass on every kick.
const duck = (t) => {
  if (t < DROP || t > END) return 1;
  const ph = (t - DROP) % BEAT;
  return 0.45 + 0.55 * Math.min(1, ph / 0.22);
};

// ---- Pad: detuned saws through a slowly opening low-pass ----
{
  const voices = [];
  for (let v = 0; v < 5; v++) voices.push({ ph: 0, det: [-0.11, -0.04, 0, 0.05, 0.12][v] });
  let lpL = 0;
  let lpR = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const notes = chordAt(t);
    const cutoff = t < DROP ? 500 + 400 * Math.sin((Math.PI * t) / DROP) + 900 * Math.pow(Math.max(0, t - DROP + 1.5) / 1.5, 2) : t < END ? 2200 : 2200 - 1600 * Math.min(1, (t - END) / 2);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
    let sL = 0;
    let sR = 0;
    notes.forEach((m, n) => {
      voices.forEach((vo, k) => {
        const f = midi(m) * Math.pow(2, vo.det / 12);
        const p = (t * f + n * 0.13 + k * 0.37) % 1;
        const saw = 2 * p - 1;
        const pan = (k - 2) / 4;
        sL += saw * (1 - pan) * 0.5;
        sR += saw * (1 + pan) * 0.5;
      });
    });
    lpL += a * (sL - lpL);
    lpR += a * (sR - lpR);
    const env = Math.min(1, t / 1.5) * (t < DROP ? 0.8 : 1) * (t > DUR - 0.06 ? (DUR - t) / 0.06 : 1);
    const g = 0.018 * env * duck(t);
    add(i, lpL * g, lpR * g);
  }
}

// ---- Drums after the drop ----
const kick = (t0) => {
  let ph = 0;
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.42) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const f = 48 + 110 * Math.exp(-t * 32);
    ph += f / SR;
    const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7.5) * 0.42 + (t < 0.004 ? noise() * 0.15 : 0);
    add(i, v);
  }
};
const clap = (t0) => {
  let hp = 0;
  let prev = 0;
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.25) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const n = noise();
    hp = 0.82 * (hp + n - prev);
    prev = n;
    const bursts = t < 0.03 ? 0.6 + 0.4 * Math.sin(t * 900) : 1;
    const v = hp * Math.exp(-t * 18) * bursts * 0.16 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * 0.08;
    add(i, v * 0.63, v * 0.7);
  }
};
const hat = (t0, open = false) => {
  let hp = 0;
  let prev = 0;
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + (open ? 0.18 : 0.06)) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const n = noise();
    hp = 0.6 * (hp + n - prev);
    prev = n;
    add(i, hp * Math.exp(-t * (open ? 22 : 70)) * 0.07, hp * Math.exp(-t * (open ? 22 : 70)) * 0.085);
  }
};
for (let k = 0; k < LAST; k++) {
  kick(beat(k));
  if (k % 2 === 1) clap(beat(k));
  hat(beat(k) + BEAT / 2, k % 4 === 3);
  if (k >= 8) hat(beat(k) + BEAT / 4);
}

// ---- Felt piano under the problem: one chord tone every two beats ----
for (let k = -Math.floor(DROP / BEAT / 2) * 2; k < 0; k += 2) {
  const t0 = beat(k) + 0.02;
  if (t0 < 0.3) continue;
  const notes = chordAt(t0);
  const f = midi(notes[[3, 1, 2, 0][(k / 2 + 64) % 4]] + 12);
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 2.2) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) + 0.08 * Math.sin(6 * Math.PI * f * t)) * Math.exp(-t * 2.2) * Math.min(1, t / 0.004) * 0.055;
    add(i, v * 0.9, v);
  }
}

// ---- Bass: off-beat house bass on the chord root ----
for (let k = 0; k < LAST; k++) {
  const t0 = beat(k) + BEAT / 2;
  const root = chordAt(t0)[0] - 24;
  const f = midi(root);
  let lp = 0;
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + BEAT * 0.45) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const saw = 2 * ((t * f) % 1) - 1;
    lp += 0.06 * (saw - lp);
    const v = (Math.sin(2 * Math.PI * f * t) * 0.6 + lp * 0.5) * Math.exp(-t * 4) * Math.min(1, t / 0.005) * 0.32;
    add(i, v);
  }
}

// ---- Pluck arpeggio (16ths) once the second section starts ----
for (let s = 0; s < LAST * 4; s++) {
  const t0 = beat(8) + (s * BEAT) / 4;
  if (t0 >= END) break;
  const notes = chordAt(t0);
  const m = notes[[0, 2, 1, 3, 2, 1, 3, 0][s % 8] % notes.length] + 12;
  const f = midi(m);
  const pan = Math.sin(s * 0.7) * 0.5;
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.3) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 14) * 0.05;
    add(i, v * (1 - pan), v * (1 + pan));
  }
}

// ---- SFX ----
const whoosh = (peak, width = 0.2, gain = 0.22) => {
  let bp1 = 0;
  let bp2 = 0;
  for (let i = Math.round((peak - width * 1.6) * SR); i < Math.round((peak + width * 0.8) * SR); i++) {
    if (i < 0 || i >= N) continue;
    const t = i / SR;
    const x = (t - peak) / width;
    const env = Math.exp(-x * x * (x < 0 ? 1.2 : 4));
    const fc = 500 + 3500 * env;
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    const n = noise();
    bp1 += a * (n - bp1);
    bp2 += a * (bp1 - bp2);
    const v = (bp1 - bp2) * env * gain * 3;
    add(i, v * (1 + x * 0.4), v * (1 - x * 0.4));
  }
};
const click = (t0, gain = 0.12) => {
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.03) * SR); i++) {
    const t = i / SR - t0;
    add(i, (Math.sin(2 * Math.PI * 2300 * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260) * gain);
  }
};
const tick = (t0) => {
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.012) * SR); i++) {
    const t = i / SR - t0;
    add(i, Math.sin(2 * Math.PI * 1700 * t) * Math.exp(-t * 500) * 0.035);
  }
};
const hit = (t0, gain = 0.3) => {
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.5) * SR) && i < N; i++) {
    const t = i / SR - t0;
    const v = Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 20)) * t) * Math.exp(-t * 9) * gain + noise() * Math.exp(-t * 40) * gain * 0.25;
    add(i, v);
  }
};
const shimmer = (t0) => {
  [76, 81, 84, 88, 93].forEach((m, k) => {
    const f = midi(m);
    for (let i = Math.round(t0 * SR); i < N; i++) {
      const t = i / SR - t0;
      const env = Math.min(1, t / 0.08) * Math.exp(-t * 1.1) * (i / SR > DUR - 0.06 ? (DUR - i / SR) / 0.06 : 1);
      const v = Math.sin(2 * Math.PI * f * t + k) * env * 0.022 * (1 + 0.3 * Math.sin(2 * Math.PI * 6 * t));
      add(i, v * (k % 2 ? 0.7 : 1), v * (k % 2 ? 1 : 0.7));
    }
  });
};

const blip = (t0) => {
  for (let i = Math.round(t0 * SR); i < Math.round((t0 + 0.08) * SR); i++) {
    const t = i / SR - t0;
    add(i, Math.sin(2 * Math.PI * (900 + 500 * Math.exp(-t * 60)) * t) * Math.exp(-t * 55) * 0.05);
  }
};
const { taps, typing, cardHits, blips, flood } = TL.sfx;
blips.forEach(([s, f]) => blip(at(s, f)));
// Riser and swell as the haze floods the frame, soft impact on the reveal
whoosh(at(...flood), 0.5, 0.04);
hit(DROP, 0.12);
// Whooshes peaking on every cut after the reveal
TL.shots.slice(2).forEach((s) => whoosh(SHOT[s.name].from / TL.fps - 0.02, 0.16, 0.09));
taps.forEach(([s, f]) => click(at(s, f)));
for (let t = at(typing[0], typing[1]); t < at(typing[0], typing[2]); t += 0.045) tick(t + (noise() + 1) * 0.006);
cardHits.forEach(([s, f]) => hit(at(s, f), 0.16));
hit(END, 0.22);
shimmer(END + 0.05);

// ---- Master: gain to about -14 LUFS, soft limit to -1 dBTP, 60 ms tail fade ----
let sum = 0;
for (let i = 0; i < N; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
const rms = Math.sqrt(sum / N);
const gain = Math.pow(10, Number(process.env.TARGET_DB ?? -14.8) / 20) / rms;
const CEIL = Math.pow(10, -1.2 / 20);
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write('WAVEfmt ', 8);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write('data', 36);
out.writeUInt32LE(N * 4, 40);
const limit = (x) => CEIL * Math.tanh(x / CEIL);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = t > DUR - 0.06 ? (DUR - t) / 0.06 : 1;
  out.writeInt16LE(Math.round(limit(L[i] * gain) * fade * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(limit(R[i] * gain) * fade * 32767), 46 + i * 4);
}
writeFileSync(new URL('../public/music.wav', import.meta.url), out);
console.log('wrote public/music.wav', { rmsBefore: rms.toFixed(4), gain: gain.toFixed(2) });
