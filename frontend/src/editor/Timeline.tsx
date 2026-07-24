import type { Cue } from "../types";

interface TimelineProps {
  durationSec: number;
  currentTime: number;
  cues: Cue[];
  activeCueIndex: number;
  onSeek: (timeSec: number) => void;
}

export function Timeline({
  durationSec,
  currentTime,
  cues,
  activeCueIndex,
  onSeek,
}: TimelineProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
  };

  const playheadPct = durationSec ? (currentTime / durationSec) * 100 : 0;

  return (
    <div
      onClick={handleClick}
      className="relative h-10 w-full cursor-pointer rounded-md bg-neutral-800 overflow-hidden"
    >
      {cues.map((cue, i) => {
        const leftPct = (cue.start / durationSec) * 100;
        const widthPct = ((cue.end - cue.start) / durationSec) * 100;
        return (
          <div
            key={i}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            className={`absolute top-1 bottom-1 rounded-sm ${
              i === activeCueIndex
                ? "bg-blue-500"
                : "bg-neutral-600 hover:bg-neutral-500"
            }`}
          />
        );
      })}
      <div
        style={{ left: `${playheadPct}%` }}
        className="absolute top-0 bottom-0 w-0.5 bg-white"
      />
    </div>
  );
}
