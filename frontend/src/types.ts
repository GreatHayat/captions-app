export interface Word {
  word: string;
  punctuatedWord: string;
  start: number;
  end: number;
}

export interface Cue {
  start: number;
  end: number;
  text: string;
}

export type CaptionPosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export const CAPTION_POSITIONS: { value: CaptionPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "middle-left", label: "Middle left" },
  { value: "middle-center", label: "Middle" },
  { value: "middle-right", label: "Middle right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

// Core, generically-stylable fields. Presets may carry additional one-off
// fields (chromaticAberration, caret, activeColor, letterboxBars, rotate,
// dashPrefix, baseColor/keywordColor, ...) which are rendered by CaptionedVideo
// / Captions on a best-effort basis but aren't part of the custom-style form.
export interface CaptionStyleConfig {
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  fontSize?: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase";
  color?: string;
  background?: string;
  paddingX?: number;
  paddingY?: number;
  borderRadius?: number | string;
  boxShadow?: string;
  rotate?: number;
  [key: string]: unknown;
}

export interface CaptionStyle {
  _id: string;
  name: string;
  isCustom: boolean;
  position: string;
  config: CaptionStyleConfig;
}

export type CaptionDisplayMode = "line" | "word" | "balanced";

export const CAPTION_DISPLAY_MODES: { value: CaptionDisplayMode; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "word", label: "Word" },
  { value: "balanced", label: "Balanced" },
];

export interface VideoMeta {
  _id: string;
  originalName: string;
  storedExt: string;
  mimeType: string;
  sizeBytes: number;
  durationSec: number;
  width: number | null;
  height: number | null;
  language: {
    code: string | null;
    autoDetected: boolean;
    confidence: number | null;
  };
  status: "processing" | "ready" | "error";
  errorMessage: string | null;
  captionStyleId: string | null;
  captionPosition: CaptionPosition;
  captionDisplayMode: CaptionDisplayMode;
  highlightColor: string;
  highlightBackground: string;
  highlightBold: boolean;
}

export interface VideoWithTranscript {
  video: VideoMeta;
  words: Word[];
  cues: Cue[];
  highlightedWords: string[];
  highlightsGeneratedAt: string | null;
}
