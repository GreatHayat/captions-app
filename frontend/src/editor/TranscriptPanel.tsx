import { useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import type { Cue } from "../types";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

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

interface TranscriptPanelProps {
  cues: Cue[];
  activeCueIndex: number;
  onSeek: (timeSec: number) => void;
  onChangeCueText: (index: number, text: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  highlightedWords: string[];
  highlightsGeneratedAt: string | null;
  isGeneratingHighlights: boolean;
  onGenerateHighlights: () => void;
  highlightColor: string;
  highlightBackground: string;
  highlightBold: boolean;
  onChangeHighlightSettings: (patch: {
    highlightColor?: string;
    highlightBackground?: string;
    highlightBold?: boolean;
  }) => void;
}

type Tab = "captions" | "fullText" | "highlights";

export function TranscriptPanel({
  cues,
  activeCueIndex,
  onSeek,
  onChangeCueText,
  onSave,
  isSaving,
  isDirty,
  highlightedWords,
  highlightsGeneratedAt,
  isGeneratingHighlights,
  onGenerateHighlights,
  highlightColor,
  highlightBackground,
  highlightBold,
  onChangeHighlightSettings,
}: TranscriptPanelProps) {
  const [tab, setTab] = useState<Tab>("captions");
  const hasBackground = highlightBackground !== "none";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-1 rounded-md bg-neutral-900 p-0.5">
          <button
            onClick={() => setTab("captions")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "captions"
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Captions
          </button>
          <button
            onClick={() => setTab("fullText")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "fullText"
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Full text
          </button>
          <button
            onClick={() => setTab("highlights")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === "highlights"
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            AI Highlight
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </button>
      </div>

      {tab === "captions" && (
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {cues.map((cue, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 transition-colors ${
                i === activeCueIndex
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-transparent hover:border-neutral-700"
              }`}
            >
              <button
                onClick={() => onSeek(cue.start)}
                className="mb-1 text-[11px] font-mono text-neutral-500 hover:text-blue-400"
              >
                {formatTime(cue.start)} – {formatTime(cue.end)}
              </button>
              <textarea
                value={cue.text}
                onChange={(e) => onChangeCueText(i, e.target.value)}
                rows={2}
                className="w-full resize-none bg-transparent text-sm text-neutral-100 outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {tab === "fullText" && (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="px-2">
            {cues.map((cue, i) => (
              <textarea
                key={i}
                value={cue.text}
                onChange={(e) => onChangeCueText(i, e.target.value)}
                rows={1}
                style={{ fieldSizing: "content" } as React.CSSProperties}
                className="block w-full resize-none overflow-hidden border-none bg-transparent p-0 text-sm leading-relaxed text-neutral-100 outline-none"
              />
            ))}
          </div>
          <p className="mt-3 px-2 text-[11px] text-neutral-500">
            Flows as one paragraph, but each line is still bound to its own caption's
            timing — switch to "Captions" to see or adjust timestamps.
          </p>
        </div>
      )}

      {tab === "highlights" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!highlightsGeneratedAt ? (
            <div className="flex flex-col items-center gap-3 pt-10 text-center">
              <Sparkles className="h-6 w-6 text-neutral-500" />
              <p className="max-w-55 text-xs text-neutral-400">
                Use AI to find the main words in this transcript — names, numbers, and
                key terms — and make them stand out in the captions.
              </p>
              <button
                onClick={onGenerateHighlights}
                disabled={isGeneratingHighlights}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {isGeneratingHighlights ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingHighlights ? "Finding main words…" : "Generate AI Highlights"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">Text color</label>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => onChangeHighlightSettings({ highlightColor: e.target.value })}
                  className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                  Background
                  <input
                    type="checkbox"
                    checked={hasBackground}
                    onChange={(e) =>
                      onChangeHighlightSettings({
                        highlightBackground: e.target.checked ? "#000000" : "none",
                      })
                    }
                  />
                </label>
                <input
                  type="color"
                  value={hasBackground ? highlightBackground : "#000000"}
                  onChange={(e) => onChangeHighlightSettings({ highlightBackground: e.target.value })}
                  disabled={!hasBackground}
                  className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 disabled:opacity-40"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-neutral-400">
                <input
                  type="checkbox"
                  checked={highlightBold}
                  onChange={(e) => onChangeHighlightSettings({ highlightBold: e.target.checked })}
                />
                Bold
              </label>

              <div className="border-t border-neutral-800 pt-4">
                <h3 className="mb-2 text-xs font-medium text-neutral-400">Preview</h3>
                <HighlightedPreview
                  cues={cues}
                  highlightedWords={highlightedWords}
                  highlightColor={highlightColor}
                  highlightBackground={highlightBackground}
                  highlightBold={highlightBold}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightedPreview({
  cues,
  highlightedWords,
  highlightColor,
  highlightBackground,
  highlightBold,
}: {
  cues: Cue[];
  highlightedWords: string[];
  highlightColor: string;
  highlightBackground: string;
  highlightBold: boolean;
}) {
  const highlightSet = buildHighlightSet(highlightedWords);
  const hasBackground = highlightBackground !== "none";
  const tokens = cues.map((c) => c.text).join(" ").split(" ");

  return (
    <p className="text-sm leading-relaxed text-neutral-100">
      {tokens.map((token, i) => {
        const isHighlighted = highlightSet.has(normalizeWord(token));
        return (
          <span
            key={i}
            style={
              isHighlighted
                ? {
                    color: highlightColor,
                    background: hasBackground ? highlightBackground : "transparent",
                    fontWeight: highlightBold ? 800 : undefined,
                    borderRadius: hasBackground ? 4 : undefined,
                    padding: hasBackground ? "0 4px" : undefined,
                  }
                : undefined
            }
          >
            {token}
            {i < tokens.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}
