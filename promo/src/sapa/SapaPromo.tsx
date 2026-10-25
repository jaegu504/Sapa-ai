import React from 'react';
import { AbsoluteFill, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { S1Header } from './S1Header';
import { S2Icon } from './S2Icon';
import { S3Notify } from './S3Notify';
import { S4List } from './S4List';
import { S5Voice } from './S5Voice';
import { S6Profile } from './S6Profile';
import { S7Draft } from './S7Draft';
import { S8Cards } from './S8Cards';
import { S9Logo } from './S9Logo';
import { S10End } from './S10End';

// 20 s at 124 BPM. Shot boundaries are in 30 fps "f" units; hard cuts sit 2 frames before a beat
// (beat k = 1.44 + 14.515·k frames), so the picture leads the music like the reference.
export const SHOTS: { name: string; from: number; to: number; C: React.FC }[] = [
  { name: 'S1 Header', from: 0, to: 72, C: S1Header },
  { name: 'S2 Icon', from: 72, to: 101, C: S2Icon },
  { name: 'S3 Notify', from: 101, to: 173, C: S3Notify },
  { name: 'S4 List', from: 173, to: 246, C: S4List },
  { name: 'S5 Voice', from: 246, to: 318, C: S5Voice },
  { name: 'S6 Profile', from: 318, to: 376, C: S6Profile },
  { name: 'S7 Draft', from: 376, to: 435, C: S7Draft },
  { name: 'S8 Cards', from: 435, to: 493, C: S8Cards },
  { name: 'S9 Logo', from: 493, to: 537, C: S9Logo },
  { name: 'S10 End', from: 537, to: 600, C: S10End },
];

// Voiceover lines (Damayanti, macOS) placed in seconds; "Ingat/Catat/Sapa" land on the card beats.
export const VO: { file: string; at: number; dur: number }[] = [
  { file: 'v1', at: 0.3, dur: 1.41 },
  { file: 'v2', at: 3.25, dur: 3.68 },
  { file: 'v3', at: 7.05, dur: 1.53 },
  { file: 'v4', at: 8.6, dur: 1.78 },
  { file: 'v5', at: 10.5, dur: 1.96 },
  { file: 'v6', at: 12.5, dur: 2.01 },
  { file: 'w1', at: 14.55, dur: 0.42 },
  { file: 'w2', at: 15.03, dur: 0.51 },
  { file: 'w3', at: 15.52, dur: 0.54 },
  { file: 'v8', at: 17.85, dur: 2.13 },
];

/** Music sits lower whenever someone speaks, with short ramps so the dip is not heard as a jump. */
const musicVolume = (t: number) => {
  const speaking = VO.some((v) => t > v.at - 0.15 && t < v.at + v.dur + 0.15);
  const near = Math.min(...VO.map((v) => Math.min(Math.abs(t - (v.at - 0.15)), Math.abs(t - (v.at + v.dur + 0.15)))));
  const ramp = interpolate(near, [0, 0.15], [0.5, 1], { extrapolateRight: 'clamp' });
  return speaking ? 0.3 + (0.55 - 0.3) * (1 - ramp) : 0.55 - (0.55 - 0.3) * (1 - ramp) * 0.5;
};

export const SapaPromo: React.FC = () => {
  const { fps } = useVideoConfig();
  const toFrames = (f: number) => Math.round((f * fps) / 30);
  return (
    <AbsoluteFill style={{ background: '#FDFDFB' }}>
      <Audio src={staticFile('music.wav')} volume={(frame) => musicVolume(frame / fps)} />
      {VO.map((v) => (
        <Sequence key={v.file} name={`VO ${v.file}`} from={Math.round(v.at * fps)} durationInFrames={Math.ceil((v.dur + 0.2) * fps)}>
          <Audio src={staticFile(`vo/${v.file}.wav`)} volume={0.84} />
        </Sequence>
      ))}
      {SHOTS.map(({ name, from, to, C }) => (
        <Sequence key={name} name={name} from={toFrames(from)} durationInFrames={toFrames(to) - toFrames(from)}>
          <C />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
