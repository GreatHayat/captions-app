const mongoose = require("mongoose");
const { CAPTION_POSITIONS, CAPTION_DISPLAY_MODES } = require("../constants");

const videoSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedExt: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    durationSec: { type: Number, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    language: {
      code: { type: String, default: null },
      autoDetected: { type: Boolean, default: false },
      confidence: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"],
      default: "processing",
    },
    errorMessage: { type: String, default: null },
    captionStyleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaptionStyle",
      default: null,
    },
    captionPosition: {
      type: String,
      enum: CAPTION_POSITIONS,
      default: "bottom-center",
    },
    captionDisplayMode: {
      type: String,
      enum: CAPTION_DISPLAY_MODES,
      default: "line",
    },
    highlightColor: { type: String, default: "#FFD23F" },
    highlightBackground: { type: String, default: "none" },
    highlightBold: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
