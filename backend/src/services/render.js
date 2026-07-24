const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const ENTRY_POINT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "frontend",
  "src",
  "remotion",
  "index.ts"
);

// Bundling takes a few seconds; only needs to happen once per server
// process, then every export reuses the same served bundle.
let bundleLocationPromise = null;
function getBundleLocation() {
  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({ entryPoint: ENTRY_POINT });
  }
  return bundleLocationPromise;
}

async function renderCaptionedVideo({
  videoUrl,
  cues,
  words,
  style,
  position,
  displayMode,
  highlightedWords,
  highlightColor,
  highlightBackground,
  highlightBold,
  durationInFrames,
  fps,
  width,
  height,
  outputPath,
}) {
  const serveUrl = await getBundleLocation();

  const inputProps = {
    videoUrl,
    cues,
    words,
    style: style ? style.toObject?.() ?? style : null,
    position,
    displayMode,
    highlightedWords: highlightedWords ?? [],
    highlightColor,
    highlightBackground,
    highlightBold,
    durationInFrames,
    width,
    height,
  };

  const composition = await selectComposition({
    serveUrl,
    id: "CaptionedVideo",
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    crf: 18,
  });
}

module.exports = { renderCaptionedVideo };
