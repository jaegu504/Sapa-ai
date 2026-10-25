import React from 'react';
import { AbsoluteFill, Sequence, interpolate, staticFile } from 'remotion';
import { Audio } from '@remotion/media';
import timeline from './timeline.json';
import { TimeMap } from './lib';
import { P0Problem } from './P0Problem';
import { S1Header } from './S1Header';
import { S3Notify } from './S3Notify';
import { S4List } from './S4List';
import { S5Voice } from './S5Voice';
import { S6Profile } from './S6Profile';
import { S7Draft } from './S7Draft';
import { S8Cards } from './S8Cards';
import { S10End } from './S10End';

// About 41 s at 30 fps: the problem (many contacts, drifting apart), Sapa's reveal, then the
// app shot by shot. Shot lengths, time remaps and voiceover times live in timeline.json, which
// scripts/make-music.mjs also reads so the sound effects follow the picture.
const COMPONENTS: Record<string, React.FC> = {
  'P Problem': P0Problem,
  'S1 Header': S1Header,
  'S3 Notify': S3Notify,
  'S4 List': S4List,
  'S5 Voice': S5Voice,
  'S6 Profile': S6Profile,
  'S7 Draft': S7Draft,
  'S8 Cards': S8Cards,
  'S10 End': S10End,
};

let start = 0;
export const SHOTS = timeline.shots.map((s) => {
  const shot = { ...s, from: start, map: s.map as [number, number][], C: COMPONENTS[s.name] };
  start += s.len;
  return shot;
});
export const DURATION = start;
const VO = timeline.vo;

/** Music sits lower whenever someone speaks, with short ramps so the dip is not heard as a jump. */
const musicVolume = (t: number) => {
  const speaking = VO.some((v) => t > v.at - 0.15 && t < v.at + v.dur + 0.15);
  const near = Math.min(...VO.map((v) => Math.min(Math.abs(t - (v.at - 0.15)), Math.abs(t - (v.at + v.dur + 0.15)))));
  const ramp = interpolate(near, [0, 0.15], [0.5, 1], { extrapolateRight: 'clamp' });
  return speaking ? 0.3 + (0.55 - 0.3) * (1 - ramp) : 0.55 - (0.55 - 0.3) * (1 - ramp) * 0.5;
};

export const SapaPromo: React.FC = () => (
  <AbsoluteFill style={{ background: '#FDFDFB' }}>
    <Audio src={staticFile('music.wav')} volume={(frame) => musicVolume(frame / timeline.fps)} />
    {VO.map((v) => (
      <Sequence key={v.file} name={`VO ${v.file}`} from={Math.round(v.at * timeline.fps)} durationInFrames={Math.ceil((v.dur + 0.2) * timeline.fps)}>
        <Audio src={staticFile(`vo/${v.file}.wav`)} volume={0.84} />
      </Sequence>
    ))}
    {SHOTS.map(({ name, from, len, map, C }) => (
      <Sequence key={name} name={name} from={from} durationInFrames={len}>
        <TimeMap.Provider value={map}>
          <C />
        </TimeMap.Provider>
      </Sequence>
    ))}
  </AbsoluteFill>
);
