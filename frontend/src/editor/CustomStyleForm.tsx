import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createCaptionStyle, updateCaptionStyle } from "../api/captionStyles";
import type { CaptionStyle, CaptionStyleConfig } from "../types";

const FONT_OPTIONS = [
  "Plus Jakarta Sans",
  "DM Serif Display",
  "Archivo",
  "Nunito",
  "JetBrains Mono",
  "Poppins",
  "Arial",
  "Georgia",
];

const FONT_WEIGHTS = [400, 500, 600, 700, 800, 900];

interface CustomStyleFormProps {
  initial?: CaptionStyle;
  onClose: () => void;
  onSaved: (style: CaptionStyle) => void;
}

export function CustomStyleForm({ initial, onClose, onSaved }: CustomStyleFormProps) {
  const c = initial?.config;
  const [name, setName] = useState(initial?.name ?? "");
  const [fontFamily, setFontFamily] = useState((c?.fontFamily as string) ?? FONT_OPTIONS[0]);
  const [fontWeight, setFontWeight] = useState((c?.fontWeight as number) ?? 700);
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">((c?.fontStyle as "normal" | "italic") ?? "normal");
  const [fontSize, setFontSize] = useState((c?.fontSize as number) ?? 24);
  const [letterSpacing, setLetterSpacing] = useState((c?.letterSpacing as number) ?? 0);
  const [uppercase, setUppercase] = useState(c?.textTransform === "uppercase");
  const [color, setColor] = useState((c?.color as string) ?? "#ffffff");
  const [hasBackground, setHasBackground] = useState(c ? c.background !== "none" : true);
  const [background, setBackground] = useState(
    c?.background && c.background !== "none" ? (c.background as string) : "#000000"
  );
  const [paddingX, setPaddingX] = useState((c?.paddingX as number) ?? 16);
  const [paddingY, setPaddingY] = useState((c?.paddingY as number) ?? 8);
  const [borderRadius, setBorderRadius] = useState(
    typeof c?.borderRadius === "number" ? c.borderRadius : 8
  );
  const [boxShadow, setBoxShadow] = useState((c?.boxShadow as string) ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsSaving(true);
    setError(null);
    const config: CaptionStyleConfig = {
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      textTransform: uppercase ? "uppercase" : "none",
      color,
      background: hasBackground ? background : "none",
      paddingX,
      paddingY,
      borderRadius,
      ...(boxShadow.trim() && { boxShadow: boxShadow.trim() }),
    };
    try {
      const style = initial
        ? await updateCaptionStyle(initial._id, { name: name.trim(), config })
        : await createCaptionStyle({ name: name.trim(), config });
      onSaved(style);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save style");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-100">
            {isEditing ? "Edit caption style" : "Custom caption style"}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 text-xs">
          <div>
            <label className="mb-1 block text-neutral-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              placeholder="My style"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-neutral-400">Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-neutral-400">Weight</label>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-neutral-400">Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-neutral-400">Style</label>
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value as "normal" | "italic")}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-neutral-400">Spacing</label>
              <input
                type="number"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-neutral-400">
            <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
            Uppercase
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-neutral-400">Text color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center justify-between text-neutral-400">
                Background
                <input
                  type="checkbox"
                  checked={hasBackground}
                  onChange={(e) => setHasBackground(e.target.checked)}
                />
              </label>
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                disabled={!hasBackground}
                className="h-8 w-full rounded-md border border-neutral-700 bg-neutral-900 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-neutral-400">Pad X</label>
              <input
                type="number"
                value={paddingX}
                onChange={(e) => setPaddingX(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-neutral-400">Pad Y</label>
              <input
                type="number"
                value={paddingY}
                onChange={(e) => setPaddingY(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-neutral-400">Radius</label>
              <input
                type="number"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-neutral-400">Box shadow (CSS, optional)</label>
            <input
              value={boxShadow}
              onChange={(e) => setBoxShadow(e.target.value)}
              placeholder="0 6px 16px rgba(0,0,0,0.35)"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-neutral-100 outline-none"
            />
          </div>

          {error && <p className="text-red-400">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500 disabled:bg-neutral-800"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
