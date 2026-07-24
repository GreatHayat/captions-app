import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Pause, Play, ArrowLeft, Download, Loader2, RotateCcw, Upload } from "lucide-react";
import { CaptionedVideo } from "../remotion/CaptionedVideo";
import { TranscriptPanel } from "../editor/TranscriptPanel";
import { Timeline } from "../editor/Timeline";
import { StyleSidebar } from "../editor/StyleSidebar";
import { PositionPicker } from "../editor/PositionPicker";
import { DisplayModePicker } from "../editor/DisplayModePicker";
import {
  videoStreamUrl,
  saveTranscript,
  updateCaptionSettings,
  downloadVideo,
  generateHighlights,
} from "../api/videos";
import { listCaptionStyles } from "../api/captionStyles";
import type { CaptionDisplayMode, CaptionPosition, CaptionStyle, Cue, VideoMeta, Word } from "../types";

const FPS = 30;
const DEFAULT_POSITION: CaptionPosition = "bottom-center";
const DEFAULT_DISPLAY_MODE: CaptionDisplayMode = "line";

interface EditorScreenProps {
  video: VideoMeta;
  initialCues: Cue[];
  initialWords: Word[];
  initialHighlightedWords: string[];
  initialHighlightsGeneratedAt: string | null;
  onBack: () => void;
}

export function EditorScreen({
  video,
  initialCues,
  initialWords,
  initialHighlightedWords,
  initialHighlightsGeneratedAt,
  onBack,
}: EditorScreenProps) {
  const [cues, setCues] = useState(initialCues);
  const [words] = useState(initialWords);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const [styles, setStyles] = useState<CaptionStyle[]>([]);
  const [styleId, setStyleId] = useState<string | null>(video.captionStyleId);
  const [position, setPosition] = useState<CaptionPosition>(video.captionPosition);
  const [displayMode, setDisplayMode] = useState<CaptionDisplayMode>(video.captionDisplayMode);

  const [highlightedWords, setHighlightedWords] = useState<string[]>(initialHighlightedWords);
  const [highlightsGeneratedAt, setHighlightsGeneratedAt] = useState<string | null>(
    initialHighlightsGeneratedAt
  );
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [highlightColor, setHighlightColor] = useState(video.highlightColor);
  const [highlightBackground, setHighlightBackground] = useState(video.highlightBackground);
  const [highlightBold, setHighlightBold] = useState(video.highlightBold);

  useEffect(() => {
    listCaptionStyles().then(setStyles).catch(() => {});
  }, []);

  const selectedStyle = useMemo(
    () => styles.find((s) => s._id === styleId) ?? null,
    [styles, styleId]
  );

  const durationInFrames = Math.max(1, Math.ceil(video.durationSec * FPS));
  const videoUrl = videoStreamUrl(video._id);
  const compositionWidth = video.width || 1280;
  const compositionHeight = video.height || 720;

  // Stable reference: recreating this object on every render (e.g. on every
  // frameupdate-driven re-render during playback) makes the Player think
  // its input changed and re-sync/reseek the underlying <video>, which is
  // what caused the stutter/repeat-word/seek-backward symptom during playback.
  const inputProps = useMemo(
    () => ({
      videoUrl,
      cues,
      words,
      style: selectedStyle,
      position,
      displayMode,
      highlightedWords,
      highlightColor,
      highlightBackground,
      highlightBold,
    }),
    [
      videoUrl,
      cues,
      words,
      selectedStyle,
      position,
      displayMode,
      highlightedWords,
      highlightColor,
      highlightBackground,
      highlightBold,
    ]
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = () => setCurrentTime(player.getCurrentFrame() / FPS);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener("frameupdate", onFrameUpdate);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrameUpdate);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, []);

  const seekTo = (timeSec: number) => {
    playerRef.current?.seekTo(Math.round(timeSec * FPS));
  };

  const togglePlay = () => {
    if (isPlaying) playerRef.current?.pause();
    else playerRef.current?.play();
  };

  const handleChangeCueText = (index: number, text: string) => {
    setCues((prev) => prev.map((c, i) => (i === index ? { ...c, text } : c)));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTranscript(video._id, { cues });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectStyle = (id: string | null) => {
    setStyleId(id);
    updateCaptionSettings(video._id, { captionStyleId: id }).catch(() => {});
  };

  const handleStyleCreated = (style: CaptionStyle) => {
    setStyles((prev) => [...prev, style]);
    handleSelectStyle(style._id);
  };

  const handleStyleUpdated = (style: CaptionStyle) => {
    setStyles((prev) => prev.map((s) => (s._id === style._id ? style : s)));
  };

  const handleStyleDeleted = (id: string) => {
    setStyles((prev) => prev.filter((s) => s._id !== id));
    if (styleId === id) handleSelectStyle(null);
  };

  const handlePositionChange = (pos: CaptionPosition) => {
    setPosition(pos);
    updateCaptionSettings(video._id, { captionPosition: pos }).catch(() => {});
  };

  const handleDisplayModeChange = (mode: CaptionDisplayMode) => {
    setDisplayMode(mode);
    updateCaptionSettings(video._id, { captionDisplayMode: mode }).catch(() => {});
  };

  const handleReset = () => {
    setStyleId(null);
    setPosition(DEFAULT_POSITION);
    setDisplayMode(DEFAULT_DISPLAY_MODE);
    updateCaptionSettings(video._id, {
      captionStyleId: null,
      captionPosition: DEFAULT_POSITION,
      captionDisplayMode: DEFAULT_DISPLAY_MODE,
    }).catch(() => {});
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await downloadVideo(video._id, `${video.originalName.replace(/\.[^.]+$/, "")}-captioned.mp4`);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateHighlights = async () => {
    setIsGeneratingHighlights(true);
    try {
      const { words: generated, generatedAt } = await generateHighlights(video._id);
      setHighlightedWords(generated);
      setHighlightsGeneratedAt(generatedAt);
    } catch (err) {
      console.error("Highlight generation failed:", err);
    } finally {
      setIsGeneratingHighlights(false);
    }
  };

  const handleChangeHighlightSettings = (patch: {
    highlightColor?: string;
    highlightBackground?: string;
    highlightBold?: boolean;
  }) => {
    if (patch.highlightColor !== undefined) setHighlightColor(patch.highlightColor);
    if (patch.highlightBackground !== undefined) setHighlightBackground(patch.highlightBackground);
    if (patch.highlightBold !== undefined) setHighlightBold(patch.highlightBold);
    updateCaptionSettings(video._id, patch).catch(() => {});
  };

  const activeCueIndex = cues.findIndex(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-2.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="flex-1 truncate text-sm font-medium">{video.originalName}</h1>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset settings
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload another video
        </button>
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {isExporting ? "Rendering…" : "Download"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-95 shrink-0 border-r border-neutral-800">
          <TranscriptPanel
            cues={cues}
            activeCueIndex={activeCueIndex}
            onSeek={seekTo}
            onChangeCueText={handleChangeCueText}
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isDirty}
            highlightedWords={highlightedWords}
            highlightsGeneratedAt={highlightsGeneratedAt}
            isGeneratingHighlights={isGeneratingHighlights}
            onGenerateHighlights={handleGenerateHighlights}
            highlightColor={highlightColor}
            highlightBackground={highlightBackground}
            highlightBold={highlightBold}
            onChangeHighlightSettings={handleChangeHighlightSettings}
          />
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-black">
            <Player
              ref={playerRef}
              component={CaptionedVideo}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              fps={FPS}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              style={{ width: "100%" }}
              controls={false}
            />
          </div>

          <div className="flex w-full max-w-4xl items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1">
              <Timeline
                durationSec={video.durationSec}
                currentTime={currentTime}
                cues={cues}
                activeCueIndex={activeCueIndex}
                onSeek={seekTo}
              />
            </div>
          </div>
        </main>

        <aside className="w-65 shrink-0 overflow-y-auto">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <StyleSidebar
                styles={styles}
                selectedStyleId={styleId}
                onSelect={handleSelectStyle}
                onCreated={handleStyleCreated}
                onUpdated={handleStyleUpdated}
                onDeleted={handleStyleDeleted}
              />
            </div>
            <div className="space-y-3 border-t border-l border-neutral-800 p-3">
              <DisplayModePicker value={displayMode} onChange={handleDisplayModeChange} />
              <PositionPicker value={position} onChange={handlePositionChange} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
