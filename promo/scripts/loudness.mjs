// Integrated loudness (ITU-R BS.1770, K-weighted, gated) and 4x-oversampled peak of a 48 kHz 16-bit WAV.
import { readFileSync } from 'node:fs';
const buf = readFileSync(process.argv[2]);
const n = (buf.length - 44) / 4;
const ch = [new Float64Array(n), new Float64Array(n)];
for (let i = 0; i < n; i++) {
  ch[0][i] = buf.readInt16LE(44 + i * 4) / 32768;
  ch[1][i] = buf.readInt16LE(46 + i * 4) / 32768;
}
const biquad = (x, [b0, b1, b2, a1, a2]) => {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};
const shelf = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585];
const hp = [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621];
const k = ch.map((x) => biquad(biquad(x, shelf), hp));
const block = 0.4 * 48000, hop = 0.1 * 48000;
const powers = [];
for (let s = 0; s + block <= n; s += hop) {
  let z = 0;
  for (const c of k) for (let i = s; i < s + block; i++) z += c[i] * c[i];
  powers.push(z / block);
}
const lufs = (p) => -0.691 + 10 * Math.log10(p);
const abs = powers.filter((p) => lufs(p) > -70);
const rel = lufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
const gated = abs.filter((p) => lufs(p) > rel);
const I = lufs(gated.reduce((a, b) => a + b, 0) / gated.length);
let peak = 0;
for (const c of ch) for (let i = 1; i < n - 2; i++) for (let s = 0; s < 4; s++) {
  const t = s / 4, p0 = c[i - 1], p1 = c[i], p2 = c[i + 1], p3 = c[i + 2];
  const v = p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  peak = Math.max(peak, Math.abs(v));
}
console.log(`Integrated: ${I.toFixed(1)} LUFS, true peak ≈ ${(20 * Math.log10(peak)).toFixed(1)} dBTP`);
