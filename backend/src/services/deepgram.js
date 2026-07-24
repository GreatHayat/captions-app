const fs = require("fs");

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen";

/**
 * Sends the extracted audio to Deepgram's pre-recorded transcription API
 * and normalizes the response into { words, language }.
 *
 * @param {string} audioPath
 * @param {string} mimeType
 * @param {{ language?: string, fillerWords?: boolean }} options
 */
async function transcribe(audioPath, mimeType, options = {}) {
  const { language, fillerWords = true } = options;

  const params = new URLSearchParams({
    model: "nova-3",
    punctuate: "true",
    filler_words: String(fillerWords),
    numerals: "true",
  });

  if (language) {
    params.set("language", language);
  } else {
    params.set("detect_language", "true");
  }

  const audioBuffer = await fs.promises.readFile(audioPath);

  const response = await fetch(`${DEEPGRAM_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": mimeType,
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Deepgram request failed (${response.status}): ${errText}`
    );
  }

  const data = await response.json();
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const rawWords = alternative?.words ?? [];

  const words = rawWords.map((w) => ({
    word: w.word,
    punctuatedWord: w.punctuated_word ?? w.word,
    start: w.start,
    end: w.end,
  }));

  return {
    words,
    language: {
      code: language ?? channel?.detected_language ?? null,
      autoDetected: !language,
      confidence: language ? null : channel?.language_confidence ?? null,
    },
  };
}

module.exports = { transcribe };
