const mongoose = require("mongoose");

const captionStyleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    isCustom: { type: Boolean, default: false },
    // The preset's own suggested default (mostly "bottom") — informational
    // only, does not drive the video's independent position picker.
    position: { type: String, default: "bottom" },
    // Schemaless: presets vary wildly in shape (fontFamily/fontSize/color/
    // background/... plus one-off effect configs like chromaticAberration,
    // caret, activeColor, letterboxBars, rotate, boxShadow).
    config: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaptionStyle", captionStyleSchema);
