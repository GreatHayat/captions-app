const fs = require("fs");
const path = require("path");
const CaptionStyle = require("../models/CaptionStyle");

const STYLES_FILE = path.join(__dirname, "..", "..", "data", "caption-styles.json");

/**
 * Upserts every preset in data/caption-styles.json into Mongo, keyed by
 * name. Called on server startup; since nodemon watches the whole backend/
 * tree, editing/appending to this file triggers a restart, which re-runs
 * this and picks up the change automatically — no manual import step.
 */
async function syncCaptionStyles() {
  const raw = await fs.promises.readFile(STYLES_FILE, "utf-8");
  const presets = JSON.parse(raw);

  const seen = new Set();
  let synced = 0;

  for (const preset of presets) {
    if (seen.has(preset.name)) continue; // de-dupe same-name entries in the file
    seen.add(preset.name);

    const { name, position, ...config } = preset;
    await CaptionStyle.findOneAndUpdate(
      { name, isCustom: false },
      { name, isCustom: false, position: position ?? "bottom", config },
      { upsert: true, returnDocument: "after" }
    );
    synced++;
  }

  console.log(`Synced ${synced} caption style preset(s) from ${path.relative(process.cwd(), STYLES_FILE)}`);
}

module.exports = { syncCaptionStyles };
