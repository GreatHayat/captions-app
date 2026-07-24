const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

function ffprobeDuration(videoPath) {
  return execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]).then(({ stdout }) => parseFloat(stdout.trim()));
}

function ffprobeDimensions(videoPath) {
  return execFileAsync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=s=x:p=0",
    videoPath,
  ]).then(({ stdout }) => {
    const [width, height] = stdout.trim().split("x").map(Number);
    return { width, height };
  });
}

async function extractCandidate(videoPath, outPath, codecArgs) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    ...codecArgs,
    outPath,
  ]);
  const { size } = await fs.promises.stat(outPath);
  return size;
}

/**
 * Extracts audio from the video as both mp3 and opus/ogg (mono, 16kHz,
 * speech-appropriate bitrates), keeps whichever file is smaller, and
 * deletes the other candidate.
 */
async function extractAudio(videoPath, outDir) {
  const [durationSec, { width, height }] = await Promise.all([
    ffprobeDuration(videoPath),
    ffprobeDimensions(videoPath),
  ]);

  const mp3Path = path.join(outDir, "audio.mp3");
  const oggPath = path.join(outDir, "audio.ogg");

  const [mp3Size, oggSize] = await Promise.all([
    extractCandidate(videoPath, mp3Path, [
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "64k",
    ]),
    extractCandidate(videoPath, oggPath, [
      "-codec:a",
      "libopus",
      "-b:a",
      "32k",
    ]),
  ]);

  const useMp3 = mp3Size <= oggSize;
  const keepPath = useMp3 ? mp3Path : oggPath;
  const dropPath = useMp3 ? oggPath : mp3Path;

  await fs.promises.unlink(dropPath);

  return {
    path: keepPath,
    mimeType: useMp3 ? "audio/mpeg" : "audio/ogg",
    durationSec,
    width,
    height,
  };
}

module.exports = { extractAudio, ffprobeDuration, ffprobeDimensions };
