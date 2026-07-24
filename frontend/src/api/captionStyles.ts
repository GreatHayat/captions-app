import type { CaptionStyle, CaptionStyleConfig } from "../types";

export async function listCaptionStyles(): Promise<CaptionStyle[]> {
  const res = await fetch("/api/caption-styles");
  if (!res.ok) throw new Error(`Failed to load caption styles (${res.status})`);
  return res.json();
}

export async function createCaptionStyle(data: {
  name: string;
  position?: string;
  config: CaptionStyleConfig;
}): Promise<CaptionStyle> {
  const res = await fetch("/api/caption-styles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create style (${res.status})`);
  }
  return res.json();
}

export async function updateCaptionStyle(
  id: string,
  data: { name?: string; position?: string; config?: CaptionStyleConfig }
): Promise<CaptionStyle> {
  const res = await fetch(`/api/caption-styles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update style (${res.status})`);
  }
  return res.json();
}

export async function deleteCaptionStyle(id: string): Promise<void> {
  const res = await fetch(`/api/caption-styles/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete style (${res.status})`);
  }
}
