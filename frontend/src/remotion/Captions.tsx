import { useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionDisplayMode, CaptionPosition, CaptionStyle, CaptionStyleConfig, Cue, Word } from "../types";

interface CaptionsProps {
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

const DEFAULT_CONFIG: CaptionStyleConfig = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 32,
  color: "#ffffff",
  background: "rgba(0, 0, 0, 0.75)",
  paddingX: 20,
  paddingY: 10,
  borderRadius: 8,
};

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

// Phrases (e.g. "time stamps") contribute each of their individual words —
// captions render word-by-word, so matching is done at the word level.
function buildHighlightSet(highlightedWords: string[]): Set<string> {
  const set = new Set<string>();
  for (const phrase of highlightedWords) {
    for (const word of phrase.split(/\s+/)) {
      const normalized = normalizeWord(word);
      if (normalized) set.add(normalized);
    }
  }
  return set;
}

function getPositionStyle(position: CaptionPosition): React.CSSProperties {
  const [vertical, horizontal] = position.split("-");
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    padding: "0 3%",
  };
  if (vertical === "top") base.top = "6%";
  else if (vertical === "middle") {
    base.top = "50%";
    base.transform = "translateY(-50%)";
  } else base.bottom = "6%";

  if (horizontal === "left") base.justifyContent = "flex-start";
  else if (horizontal === "right") base.justifyContent = "flex-end";
  else base.justifyContent = "center";

  return base;
}

interface ChromaticAberration {
  redLayer: string;
  cyanLayer: string;
  offset: number;
  opacity: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBoxStyle(config: CaptionStyleConfig): React.CSSProperties {
  const background = config.background && config.background !== "none" ? config.background : "transparent";

  // Rendered as text-shadow rather than duplicate absolutely-positioned
  // layers: absolute-positioned duplicates wrap independently from the base
  // text and can overflow the box on multi-line captions.
  const chroma = config.chromaticAberration as ChromaticAberration | undefined;
  const textShadow = chroma
    ? `${-chroma.offset}px 0 ${hexToRgba(chroma.redLayer, chroma.opacity)}, ${chroma.offset}px 0 ${hexToRgba(chroma.cyanLayer, chroma.opacity)}`
    : undefined;

  return {
    fontFamily: config.fontFamily ?? DEFAULT_CONFIG.fontFamily,
    fontWeight: (config.baseWeight as number | undefined) ?? config.fontWeight ?? DEFAULT_CONFIG.fontWeight,
    fontStyle: config.fontStyle ?? "normal",
    fontSize: config.fontSize ?? DEFAULT_CONFIG.fontSize,
    letterSpacing: config.letterSpacing ?? 0,
    textTransform: config.textTransform ?? "none",
    color: (config.baseColor as string | undefined) ?? config.color ?? DEFAULT_CONFIG.color,
    background,
    padding: `${config.paddingY ?? 10}px ${config.paddingX ?? 20}px`,
    borderRadius: config.borderRadius ?? 8,
    boxShadow: config.boxShadow,
    textShadow,
    transform: config.rotate ? `rotate(${config.rotate}deg)` : undefined,
    textAlign: "center",
    maxWidth: "100%",
    whiteSpace: "pre-wrap",
  };
}

interface HighlightLook {
  color: string;
  background: string;
  bold: boolean;
}

function highlightSpanStyle(look: HighlightLook): React.CSSProperties {
  const hasBackground = look.background && look.background !== "none";
  return {
    color: look.color,
    background: hasBackground ? look.background : "transparent",
    fontWeight: look.bold ? 800 : undefined,
    borderRadius: hasBackground ? 4 : undefined,
    padding: hasBackground ? "0 4px" : undefined,
  };
}

// Tokenizes text (which may contain a "\n" from balanced-mode line
// breaking) into words, rendering each highlighted word in the given look
// and leaving the rest to inherit the surrounding box's base style.
function renderTokensWithHighlights(
  text: string,
  highlightSet: Set<string>,
  look: HighlightLook
): React.ReactNode {
  return text.split("\n").map((line, li) => (
    <span key={li}>
      {li > 0 && <br />}
      {line.split(" ").map((token, i, arr) => {
        if (!token) return null;
        const isHighlighted = highlightSet.has(normalizeWord(token));
        return (
          <span key={i} style={isHighlighted ? highlightSpanStyle(look) : undefined}>
            {token}
            {i < arr.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  ));
}

function renderContent(
  cue: Cue,
  config: CaptionStyleConfig,
  words: Word[],
  timeSec: number,
  highlightSet: Set<string>,
  highlightLook: HighlightLook
): React.ReactNode {
  const text = config.dashPrefix ? `- ${cue.text}` : cue.text;

  if (config.reveal === "per-character") {
    const duration = Math.max(cue.end - cue.start, 0.001);
    const elapsed = Math.min(Math.max(timeSec - cue.start, 0), duration);
    const revealCount = Math.floor((elapsed / duration) * text.length);
    const revealed = text.slice(0, revealCount);
    const caretBlinkMs = (config.caretBlinkMs as number | undefined) ?? 500;
    const showCaret = Math.floor((timeSec * 1000) / caretBlinkMs) % 2 === 0;
    return (
      <span>
        {renderTokensWithHighlights(revealed, highlightSet, highlightLook)}
        {showCaret && <span style={{ color: (config.caret as string) ?? "#fff" }}>|</span>}
      </span>
    );
  }

  if (config.activeColor || config.activeBackground) {
    const cueWords = words.filter((w) => w.start >= cue.start - 0.05 && w.end <= cue.end + 0.05);
    if (cueWords.length === 0) return text;
    return (
      <span>
        {cueWords.map((w, i) => {
          const isActive = timeSec >= w.start && timeSec < w.end;
          const isHighlighted = highlightSet.has(normalizeWord(w.punctuatedWord));
          const color = isActive
            ? (config.activeColor as string) ?? config.color
            : isHighlighted
              ? highlightLook.color
              : config.color;
          const background = isActive
            ? (config.activeBackground as string)
            : isHighlighted && highlightLook.background !== "none"
              ? highlightLook.background
              : "transparent";
          return (
            <span
              key={i}
              style={{
                color,
                background,
                fontWeight: !isActive && isHighlighted && highlightLook.bold ? 800 : undefined,
                borderRadius: isActive ? (config.activeRadius as number) ?? 0 : isHighlighted ? 4 : 0,
                padding: isActive || (isHighlighted && background !== "transparent") ? "2px 6px" : undefined,
                marginRight: 6,
                display: "inline-block",
              }}
            >
              {w.punctuatedWord}
            </span>
          );
        })}
      </span>
    );
  }

  return renderTokensWithHighlights(text, highlightSet, highlightLook);
}

// Splits cue text into two lines at whichever word boundary minimizes the
// character-length difference between the two lines.
function balanceLines(text: string): string {
  const words = text.split(" ");
  if (words.length <= 3) return text;

  let bestSplit = 1;
  let bestDiff = Infinity;
  let runningLen = 0;
  for (let i = 0; i < words.length - 1; i++) {
    runningLen += words[i].length + 1;
    const line1Len = runningLen - 1;
    const line2Len = text.length - runningLen;
    const diff = Math.abs(line1Len - line2Len);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = i + 1;
    }
  }
  return words.slice(0, bestSplit).join(" ") + "\n" + words.slice(bestSplit).join(" ");
}

// Computes the cue/text actually handed to renderContent for the current
// display mode. 'word' and 'balanced' both produce a normal Cue-shaped
// object so the existing per-style effects (karaoke, typewriter reveal,
// chromatic aberration) all keep working unmodified on whatever text/range
// they're given.
function getEffectiveCue(cue: Cue, words: Word[], displayMode: CaptionDisplayMode, timeSec: number): Cue {
  if (displayMode === "balanced") {
    return { ...cue, text: balanceLines(cue.text) };
  }

  if (displayMode === "word") {
    const cueWords = words.filter((w) => w.start >= cue.start - 0.05 && w.end <= cue.end + 0.05);
    if (cueWords.length === 0) return cue;
    let current = cueWords.find((w) => timeSec >= w.start && timeSec < w.end);
    if (!current) {
      current = [...cueWords].reverse().find((w) => w.end <= timeSec) ?? cueWords[0];
    }
    return { start: current.start, end: current.end, text: current.punctuatedWord };
  }

  return cue;
}

export function Captions({
  cues,
  words,
  style,
  position,
  displayMode,
  highlightedWords,
  highlightColor,
  highlightBackground,
  highlightBold,
}: CaptionsProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const activeCue = cues.find((c) => timeSec >= c.start && timeSec < c.end);
  if (!activeCue) return null;

  const config = style?.config ?? DEFAULT_CONFIG;
  const effectiveCue = getEffectiveCue(activeCue, words, displayMode, timeSec);
  const highlightSet = buildHighlightSet(highlightedWords);

  // "Split Emphasis" already has its own keywordColor/keywordWeight fields
  // meant for exactly this — prefer them over the generic user settings.
  const highlightLook: HighlightLook = {
    color: (config.keywordColor as string | undefined) ?? highlightColor,
    background: highlightBackground,
    bold: config.keywordWeight !== undefined ? (config.keywordWeight as number) >= 700 : highlightBold,
  };

  return (
    <div style={getPositionStyle(position)}>
      <div style={getBoxStyle(config)}>
        {renderContent(effectiveCue, config, words, timeSec, highlightSet, highlightLook)}
      </div>
    </div>
  );
}
