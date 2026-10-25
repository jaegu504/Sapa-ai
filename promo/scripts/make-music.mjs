// Synthesizes the 20 s promo soundtrack: soft house at 124 BPM with the drop at 2.467 s,
// plus whooshes on every cut, taps, typing ticks and card hits. Writes public/music.wav.
// Pure function of time (seeded noise only), so every run gives the same file.
import { writeFileSync } from 'node:fs';

const SR = 48000;
const DUR = 20.0;
const N = Math.round(SR * DUR);
const L = new Float32Array(N);
const R = new Float32Array(N);

const BEAT = 60 / 124; // 0.4839 s
const beat = (k) => 0.048 + BEAT * k;
const DROP = beat(5); // 2.467 s
const END = beat(37); // 17.95 s: end card, drums stop
const sec = (f30) => f30 / 30; // storyboard frames (30 fps) to seconds

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

// ---- Harmony: F maj7 → A m7 → C maj9 → G6, one bar each, looping ----
const CHORDS = [
  [53, 57, 60, 64],
  [57, 60, 64, 67],
  [48, 55, 60, 64, 62 + 12],
  [55, 59, 62, 64],
];
const BAR = BEAT * 4;
const chordAt = (t) => CHORDS[Math.floor(Math.max(0, t - 0.048) / BAR) % CHORDS.length];

// Sidechain duck after the drop: dips the pad and bass on every kick.
const duck = (t) => {
  if (t < DROP || t > END) return 1;
  const ph = (t - 0.048) % BEAT;
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
    const cutoff = t < DROP ? 300 + 1500 * Math.pow(t / DROP, 2) : t < END ? 2200 : 2200 - 1600 * Math.min(1, (t - END) / 2);
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
    const env = Math.min(1, t / 1.2) * (t > DUR - 0.06 ? (DUR - t) / 0.06 : 1);
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
    const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7.5) * 0.55 + (t < 0.004 ? noise() * 0.15 : 0);
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
    add(i, v * 0.9, v);
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
for (let k = 5; k < 37; k++) {
  kick(beat(k));
  if (k % 2 === 0) clap(beat(k));
  hat(beat(k) + BEAT / 2, k % 4 === 3);
  if (k >= 13) hat(beat(k) + BEAT / 4);
}

// ---- Bass: off-beat house bass on the chord root ----
for (let k = 5; k < 37; k++) {
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
for (let s = 0; s < 32 * 4; s++) {
  const t0 = beat(9) + (s * BEAT) / 4;
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

hit(0.1, 0.12); // soft opening impact
// Riser into the drop
whoosh(DROP - 0.05, 0.9, 0.12);
// Whooshes peaking on every cut
[72, 101, 173, 246, 318, 376, 435, 493, 537].forEach((f) => whoosh(sec(f) - 0.02, 0.18, f === 72 ? 0.12 : 0.18));
// Taps
[69, 113, 147, 197, 225, 418].forEach((f) => click(sec(f)));
// Typing ticks in the voice box (S5 local 12–40)
for (let t = sec(258); t < sec(288); t += 0.032) tick(t + (noise() + 1) * 0.004);
// Card hits on the beat in S8, and on the end card
[435, 449.5, 464].forEach((f) => hit(sec(f), 0.16));
hit(sec(537), 0.22);
shimmer(sec(537) + 0.05);

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
