const MAX_WORDS_PER_CUE = 10;
const MIN_WORDS_BEFORE_SENTENCE_BREAK = 4;
const PAUSE_BREAK_SEC = 0.6;
const SENTENCE_END_RE = /[.?!]$/;

/**
 * Groups Deepgram word-level timestamps into caption-sized cues. This is
 * our own heuristic (not a Deepgram feature) so we keep full control over
 * cue boundaries for future re-timing/editing.
 */
function buildCues(words) {
  if (!words.length) return [];

  const cues = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    cues.push({
      start: current[0].start,
      end: current[current.length - 1].end,
      text: current.map((w) => w.punctuatedWord).join(" "),
    });
    current = [];
  };

  words.forEach((word, i) => {
    current.push(word);

    const next = words[i + 1];
    const isLastWord = !next;
    const pauseToNext = next ? next.start - word.end : 0;
    const endsSentence =
      SENTENCE_END_RE.test(word.punctuatedWord) &&
      current.length >= MIN_WORDS_BEFORE_SENTENCE_BREAK;

    if (
      isLastWord ||
      current.length >= MAX_WORDS_PER_CUE ||
      pauseToNext > PAUSE_BREAK_SEC ||
      endsSentence
    ) {
      flush();
    }
  });

  return cues;
}

module.exports = { buildCues };
