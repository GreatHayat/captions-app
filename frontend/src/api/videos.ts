import type { CaptionDisplayMode, CaptionPosition, Cue, VideoMeta, VideoWithTranscript, Word } from "../types";

export interface UploadOptions {
  language?: string;
  fillerWords?: boolean;
}

export async function uploadVideo(
  file: File,
  options: UploadOptions = {}
): Promise<VideoWithTranscript> {
  const form = new FormData();
  form.append("video", file);
  if (options.language) form.append("language", options.language);
  if (options.fillerWords !== undefined) {
    form.append("fillerWords", String(options.fillerWords));
  }

  const res = await fetch("/api/videos", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function getVideo(id: string): Promise<VideoWithTranscript> {
  const res = await fetch(`/api/videos/${id}`);
  if (!res.ok) throw new Error(`Failed to load video (${res.status})`);
  return res.json();
}

export function videoStreamUrl(id: string): string {
  return `/api/videos/${id}/stream`;
}

export async function saveTranscript(
  id: string,
  data: { words?: Word[]; cues?: Cue[] }
): Promise<{ words: Word[]; cues: Cue[] }> {
  const res = await fetch(`/api/videos/${id}/transcript`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save transcript (${res.status})`);
  return res.json();
}

export async function updateCaptionSettings(
  id: string,
  data: {
    captionStyleId?: string | null;
    captionPosition?: CaptionPosition;
    captionDisplayMode?: CaptionDisplayMode;
    highlightColor?: string;
    highlightBackground?: string;
    highlightBold?: boolean;
  }
): Promise<VideoMeta> {
  const res = await fetch(`/api/videos/${id}/caption-settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update caption settings (${res.status})`);
  return res.json();
}

export async function generateHighlights(
  id: string
): Promise<{ words: string[]; generatedAt: string }> {
  const res = await fetch(`/api/videos/${id}/highlight`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to generate highlights (${res.status})`);
  }
  return res.json();
}

export async function downloadVideo(id: string, filename: string): Promise<void> {
  const res = await fetch(`/api/videos/${id}/export`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
