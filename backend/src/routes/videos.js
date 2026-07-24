const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const { upload } = require("../middleware/upload");
const Video = require("../models/Video");
const Transcript = require("../models/Transcript");
const CaptionStyle = require("../models/CaptionStyle");
const { extractAudio } = require("../services/ffmpeg");
const { transcribe } = require("../services/deepgram");
const { buildCues } = require("../services/cues");
const { renderCaptionedVideo } = require("../services/render");
const { extractHighlightWords } = require("../services/groq");
const { CAPTION_POSITIONS, CAPTION_DISPLAY_MODES } = require("../constants");

const router = express.Router();

router.post("/", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded" });
  }

  const videoId = req.videoId;
  const videoPath = req.file.path;
  const language = req.body.language || null;
  const fillerWords = req.body.fillerWords !== "false";

  try {
    const audio = await extractAudio(videoPath, req.videoDir);

    const video = await Video.create({
      _id: videoId,
      originalName: req.file.originalname,
      storedExt: req.storedExt,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      durationSec: audio.durationSec,
      width: audio.width,
      height: audio.height,
      status: "processing",
    });

    const { words, language: detectedLanguage } = await transcribe(
      audio.path,
      audio.mimeType,
      { language, fillerWords }
    );
    const cues = buildCues(words);

    video.language = detectedLanguage;
    video.status = "ready";
    await video.save();

    const transcript = await Transcript.create({
      videoId: video._id,
      words,
      cues,
    });

    res.status(201).json({
      video,
      words: transcript.words,
      cues: transcript.cues,
      highlightedWords: transcript.highlightedWords,
      highlightsGeneratedAt: transcript.highlightsGeneratedAt,
    });
  } catch (err) {
    await Video.findByIdAndUpdate(videoId, {
      status: "error",
      errorMessage: err.message,
    }).catch(() => {});
    console.error("Video processing failed:", err);
    res.status(500).json({ error: "Video processing failed", detail: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  const transcript = await Transcript.findOne({ videoId: video._id });
  res.json({
    video,
    words: transcript?.words ?? [],
    cues: transcript?.cues ?? [],
    highlightedWords: transcript?.highlightedWords ?? [],
    highlightsGeneratedAt: transcript?.highlightsGeneratedAt ?? null,
  });
});

router.get("/:id/stream", async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "videos",
    video._id.toString(),
    `original${video.storedExt}`
  );

  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat) return res.status(404).json({ error: "Video file not found" });

  const range = req.headers.range;
  if (!range) {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": video.mimeType,
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": video.mimeType,
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
});

router.patch("/:id/transcript", async (req, res) => {
  const { words, cues } = req.body;
  const transcript = await Transcript.findOneAndUpdate(
    { videoId: req.params.id },
    { ...(words && { words }), ...(cues && { cues }) },
    { returnDocument: "after" }
  );
  if (!transcript) return res.status(404).json({ error: "Transcript not found" });
  res.json({ words: transcript.words, cues: transcript.cues });
});

router.patch("/:id/caption-settings", async (req, res) => {
  const {
    captionStyleId,
    captionPosition,
    captionDisplayMode,
    highlightColor,
    highlightBackground,
    highlightBold,
  } = req.body;

  if (captionPosition && !CAPTION_POSITIONS.includes(captionPosition)) {
    return res.status(400).json({ error: "Invalid captionPosition" });
  }
  if (captionDisplayMode && !CAPTION_DISPLAY_MODES.includes(captionDisplayMode)) {
    return res.status(400).json({ error: "Invalid captionDisplayMode" });
  }

  const update = {};
  if (captionStyleId !== undefined) update.captionStyleId = captionStyleId || null;
  if (captionPosition !== undefined) update.captionPosition = captionPosition;
  if (captionDisplayMode !== undefined) update.captionDisplayMode = captionDisplayMode;
  if (highlightColor !== undefined) update.highlightColor = highlightColor;
  if (highlightBackground !== undefined) update.highlightBackground = highlightBackground;
  if (highlightBold !== undefined) update.highlightBold = highlightBold;

  const video = await Video.findByIdAndUpdate(req.params.id, update, { returnDocument: "after" });
  if (!video) return res.status(404).json({ error: "Video not found" });
  res.json(video);
});

router.post("/:id/highlight", async (req, res) => {
  const transcript = await Transcript.findOne({ videoId: req.params.id });
  if (!transcript) return res.status(404).json({ error: "Transcript not found" });

  if (transcript.highlightsGeneratedAt) {
    return res.json({
      words: transcript.highlightedWords,
      generatedAt: transcript.highlightsGeneratedAt,
    });
  }

  try {
    const fullText = transcript.cues.map((c) => c.text).join(" ");
    const words = await extractHighlightWords(fullText);

    transcript.highlightedWords = words;
    transcript.highlightsGeneratedAt = new Date();
    await transcript.save();

    res.json({ words, generatedAt: transcript.highlightsGeneratedAt });
  } catch (err) {
    console.error("Highlight generation failed:", err);
    res.status(500).json({ error: "Highlight generation failed", detail: err.message });
  }
});

router.get("/:id/export", async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  const transcript = await Transcript.findOne({ videoId: video._id });
  const style = video.captionStyleId ? await CaptionStyle.findById(video.captionStyleId) : null;

  const fps = 30;
  const durationInFrames = Math.max(1, Math.ceil(video.durationSec * fps));
  const videoUrl = `http://localhost:${process.env.PORT || 5001}/api/videos/${video._id}/stream`;
  const outputPath = path.join(os.tmpdir(), `export-${video._id}-${Date.now()}.mp4`);

  try {
    await renderCaptionedVideo({
      videoUrl,
      cues: transcript?.cues ?? [],
      words: transcript?.words ?? [],
      style,
      position: video.captionPosition,
      displayMode: video.captionDisplayMode,
      highlightedWords: transcript?.highlightedWords ?? [],
      highlightColor: video.highlightColor,
      highlightBackground: video.highlightBackground,
      highlightBold: video.highlightBold,
      durationInFrames,
      fps,
      width: video.width || 1280,
      height: video.height || 720,
      outputPath,
    });

    const downloadName = `${path.parse(video.originalName).name}-captioned.mp4`;
    res.download(outputPath, downloadName, async (err) => {
      if (err) console.error("Error sending export:", err);
      await fs.promises.unlink(outputPath).catch(() => {});
    });
  } catch (err) {
    console.error("Export failed:", err);
    await fs.promises.unlink(outputPath).catch(() => {});
    res.status(500).json({ error: "Export failed", detail: err.message });
  }
});

module.exports = router;
