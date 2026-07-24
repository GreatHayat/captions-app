import { Composition } from "remotion";
import { CaptionedVideo, type CaptionedVideoProps } from "./CaptionedVideo";

// Only used by the backend's server-side render (@remotion/bundler +
// @remotion/renderer) — the browser preview embeds CaptionedVideo directly
// via @remotion/player's <Player component={...} /> and never imports this.
export interface RenderProps extends CaptionedVideoProps {
  durationInFrames: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

const defaultProps: RenderProps = {
  videoUrl: "",
  cues: [],
  words: [],
  style: null,
  position: "bottom-center",
  displayMode: "line",
  highlightedWords: [],
  highlightColor: "#FFD23F",
  highlightBackground: "none",
  highlightBold: true,
  durationInFrames: 30,
  width: 1280,
  height: 720,
};

// Wrapper so <Composition>'s generic prop type (inferred from `component`)
// includes the render-only durationInFrames/width/height fields that
// calculateMetadata needs to read back out.
const RenderEntry: React.FC<RenderProps> = (props) => <CaptionedVideo {...props} />;

export const RemotionRoot: React.FC = () => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Composition<any, RenderProps>
      id="CaptionedVideo"
      component={RenderEntry}
      durationInFrames={30}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => {
        const { durationInFrames, width, height } = props;
        return { durationInFrames, width, height, fps: 30 };
      }}
    />
  );
};
