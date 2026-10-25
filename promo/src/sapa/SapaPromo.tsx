import React from 'react';
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from 'remotion';
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

export const SapaPromo: React.FC = () => {
  const { fps } = useVideoConfig();
  const toFrames = (f: number) => Math.round((f * fps) / 30);
  return (
    <AbsoluteFill style={{ background: '#FDFDFB' }}>
      <Audio src={staticFile('music.wav')} />
      {SHOTS.map(({ name, from, to, C }) => (
        <Sequence key={name} name={name} from={toFrames(from)} durationInFrames={toFrames(to) - toFrames(from)}>
          <C />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
