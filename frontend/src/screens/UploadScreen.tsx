import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadVideo } from "../api/videos";
import { LANGUAGE_OPTIONS } from "../languages";
import type { VideoWithTranscript } from "../types";

interface UploadScreenProps {
  onUploaded: (result: VideoWithTranscript) => void;
}

export function UploadScreen({ onUploaded }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [fillerWords, setFillerWords] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setError(null);
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadVideo(file, {
        language: language || undefined,
        fillerWords,
      });
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Add captions to your video</h1>
          <p className="text-neutral-400 text-sm">
            Upload a video, we'll transcribe it and let you edit the captions.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-400/10"
              : "border-neutral-700 hover:border-neutral-500"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <UploadCloud className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
          {file ? (
            <p className="text-sm">{file.name}</p>
          ) : (
            <p className="text-sm text-neutral-400">
              Drag & drop a video here, or click to browse
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-neutral-400">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          >
            <option value="">Auto-detect</option>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-400">
          <input
            type="checkbox"
            checked={fillerWords}
            onChange={(e) => setFillerWords(e.target.checked)}
          />
          Include filler words ("um", "uh")
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!file || isUploading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing… this can take a moment
            </>
          ) : (
            "Upload & transcribe"
          )}
        </button>
      </div>
    </div>
  );
}
