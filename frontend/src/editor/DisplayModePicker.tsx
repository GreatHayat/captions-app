import { CAPTION_DISPLAY_MODES, type CaptionDisplayMode } from "../types";

interface DisplayModePickerProps {
  value: CaptionDisplayMode;
  onChange: (mode: CaptionDisplayMode) => void;
}

export function DisplayModePicker({ value, onChange }: DisplayModePickerProps) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-neutral-400">Display</h3>
      <div className="flex items-center gap-1 rounded-md bg-neutral-900 p-0.5">
        {CAPTION_DISPLAY_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
              value === mode.value
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
