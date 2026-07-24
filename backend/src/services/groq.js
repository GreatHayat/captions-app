const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You analyze video transcripts to pick out the words or short phrases worth visually emphasizing as captions (like a highlight color on the "main" words) — names, numbers, product/brand terms, and emotionally or informationally important words. Aim for roughly 1 out of every 6-10 words, never more than a fifth of the transcript. Each entry must be an exact substring copied verbatim from the transcript (same casing/punctuation as it appears). Respond with ONLY a JSON object of the form {"words": ["word1", "word2", ...]} and nothing else.`;

/**
 * Asks Groq's OpenAI open-weight model to pick the "main" words/phrases out
 * of a transcript. Returns a plain string[] (verbatim substrings from the
 * transcript) — falls back to [] on any malformed/missing response rather
 * than throwing, since this is a nice-to-have enhancement, not core.
 */
async function extractHighlightWords(transcriptText) {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcriptText },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  return Array.isArray(parsed.words)
    ? parsed.words.filter((w) => typeof w === "string" && w.trim().length > 0)
    : [];
}

module.exports = { extractHighlightWords };
