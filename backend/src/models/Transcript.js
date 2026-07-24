const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    punctuatedWord: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
  },
  { _id: false }
);

const cueSchema = new mongoose.Schema(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      unique: true,
    },
    words: { type: [wordSchema], default: [] },
    cues: { type: [cueSchema], default: [] },
    highlightedWords: { type: [String], default: [] },
    highlightsGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transcript", transcriptSchema);
