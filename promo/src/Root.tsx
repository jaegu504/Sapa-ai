import { Composition } from 'remotion';
import { DURATION, SapaPromo } from './sapa/SapaPromo';

export const RemotionRoot: React.FC = () => {
  return <Composition id="SapaPromo" component={SapaPromo} durationInFrames={DURATION} fps={30} width={1920} height={1080} />;
};
