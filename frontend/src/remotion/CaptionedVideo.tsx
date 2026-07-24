import { AbsoluteFill, Video } from "remotion";
import type { CaptionDisplayMode, CaptionPosition, CaptionStyle, Cue, Word } from "../types";
import { Captions } from "./Captions";

export interface CaptionedVideoProps {
  videoUrl: string;
  cues: Cue[];
  words: Word[];
  style: CaptionStyle | null;
  position: CaptionPosition;
  displayMode: CaptionDisplayMode;
  highlightedWords: string[];
  highlightColor: string;
  highlightBackground: string;
  highlightBold: boolean;
}

export function CaptionedVideo({
  videoUrl,
  cues,
  words,
  style,
  position,
  displayMode,
  highlightedWords,
  highlightColor,
  highlightBackground,
  highlightBold,
}: CaptionedVideoProps) {
  const letterboxColor = style?.config.letterboxBars as string | undefined;
  const barHeightPct = (style?.config.barHeightPct as number | undefined) ?? 11;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video src={videoUrl} />
      {letterboxColor && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${barHeightPct}%`,
              background: letterboxColor,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${barHeightPct}%`,
              background: letterboxColor,
            }}
          />
        </>
      )}
      <Captions
        cues={cues}
        words={words}
        style={style}
        position={position}
        displayMode={displayMode}
        highlightedWords={highlightedWords}
        highlightColor={highlightColor}
        highlightBackground={highlightBackground}
        highlightBold={highlightBold}
      />
    </AbsoluteFill>
  );
}
