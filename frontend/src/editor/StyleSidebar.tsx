import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCaptionStyle } from "../api/captionStyles";
import type { CaptionStyle } from "../types";
import { CustomStyleForm } from "./CustomStyleForm";

interface StyleSidebarProps {
  styles: CaptionStyle[];
  selectedStyleId: string | null;
  onSelect: (styleId: string | null) => void;
  onCreated: (style: CaptionStyle) => void;
  onUpdated: (style: CaptionStyle) => void;
  onDeleted: (styleId: string) => void;
}

function swatchStyle(style: CaptionStyle): React.CSSProperties {
  const c = style.config;
  const background = c.background && c.background !== "none" ? String(c.background) : "#262626";
  return {
    fontFamily: (c.fontFamily as string) ?? "inherit",
    fontWeight: (c.fontWeight as number) ?? 500,
    color: (c.color as string) ?? "#fff",
    background,
    borderRadius: typeof c.borderRadius === "number" ? c.borderRadius : 6,
  };
}

export function StyleSidebar({
  styles,
  selectedStyleId,
  onSelect,
  onCreated,
  onUpdated,
  onDeleted,
}: StyleSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingStyle, setEditingStyle] = useState<CaptionStyle | null>(null);

  const handleDelete = async (style: CaptionStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${style.name}"?`)) return;
    await deleteCaptionStyle(style._id);
    onDeleted(style._id);
  };

  return (
    <div className="flex h-full flex-col border-l border-neutral-800 p-3">
      <h3 className="mb-2 px-1 text-xs font-medium text-neutral-400">Caption style</h3>
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className={`w-full rounded-md border px-2 py-2 text-left text-xs transition-colors ${
            selectedStyleId === null
              ? "border-blue-500 bg-blue-500/10 text-neutral-100"
              : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
          }`}
        >
          None (default)
        </button>
        {styles.map((style) => (
          <div
            key={style._id}
            onClick={() => onSelect(style._id)}
            title={style.name}
            className={`group flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
              selectedStyleId === style._id
                ? "border-blue-500 bg-blue-500/10"
                : "border-neutral-800 hover:border-neutral-600"
            }`}
          >
            <span
              style={swatchStyle(style)}
              className="flex h-7 w-9 shrink-0 items-center justify-center text-[11px]"
            >
              Aa
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-200">{style.name}</span>
            {style.isCustom && (
              <span className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingStyle(style);
                  }}
                  className="text-neutral-500 hover:text-neutral-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(style, e)}
                  className="text-neutral-500 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-700 py-2 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
      >
        <Plus className="h-3.5 w-3.5" />
        Custom style
      </button>

      {showForm && (
        <CustomStyleForm
          onClose={() => setShowForm(false)}
          onSaved={(style) => {
            onCreated(style);
            setShowForm(false);
          }}
        />
      )}

      {editingStyle && (
        <CustomStyleForm
          initial={editingStyle}
          onClose={() => setEditingStyle(null)}
          onSaved={(style) => {
            onUpdated(style);
            setEditingStyle(null);
          }}
        />
      )}
    </div>
  );
}
