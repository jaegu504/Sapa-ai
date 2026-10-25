import { Composition } from 'remotion';
import { SapaPromo } from './sapa/SapaPromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="SapaPromo" component={SapaPromo} durationInFrames={1200} fps={60} width={1920} height={1080} />
      <Composition id="SapaPromo30" component={SapaPromo} durationInFrames={600} fps={30} width={1920} height={1080} />
    </>
  );
};
