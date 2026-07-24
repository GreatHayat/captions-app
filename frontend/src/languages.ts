// A practical subset of Deepgram's ~35 supported languages for the picker.
// Leaving the value empty means "auto-detect" (backend sends detect_language=true).
export const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "ru", label: "Russian" },
  { code: "ko", label: "Korean" },
];
