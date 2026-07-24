import { CAPTION_POSITIONS, type CaptionPosition } from "../types";

interface PositionPickerProps {
  value: CaptionPosition;
  onChange: (position: CaptionPosition) => void;
}

export function PositionPicker({ value, onChange }: PositionPickerProps) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-neutral-400">Position</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {CAPTION_POSITIONS.map((pos) => (
          <button
            key={pos.value}
            title={pos.label}
            onClick={() => onChange(pos.value)}
            className={`flex h-10 items-center justify-center rounded-md border transition-colors ${
              value === pos.value
                ? "border-blue-500 bg-blue-500/10"
                : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                value === pos.value ? "bg-blue-400" : "bg-neutral-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
