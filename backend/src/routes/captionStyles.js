const express = require("express");
const CaptionStyle = require("../models/CaptionStyle");

const router = express.Router();

router.get("/", async (_req, res) => {
  const styles = await CaptionStyle.find().sort({ isCustom: 1, name: 1 });
  res.json(styles);
});

router.post("/", async (req, res) => {
  const { name, position, config } = req.body;
  if (!name || !config) {
    return res.status(400).json({ error: "name and config are required" });
  }
  try {
    const style = await CaptionStyle.create({
      name,
      position: position || "bottom",
      config,
      isCustom: true,
    });
    res.status(201).json(style);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A style with that name already exists" });
    }
    throw err;
  }
});

router.patch("/:id", async (req, res) => {
  const style = await CaptionStyle.findById(req.params.id);
  if (!style) return res.status(404).json({ error: "Style not found" });
  if (!style.isCustom) {
    return res.status(403).json({ error: "Cannot edit a preset style" });
  }

  const { name, position, config } = req.body;
  if (name !== undefined) style.name = name;
  if (position !== undefined) style.position = position;
  if (config !== undefined) style.config = config;

  try {
    await style.save();
    res.json(style);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A style with that name already exists" });
    }
    throw err;
  }
});

router.delete("/:id", async (req, res) => {
  const style = await CaptionStyle.findById(req.params.id);
  if (!style) return res.status(404).json({ error: "Style not found" });
  if (!style.isCustom) {
    return res.status(403).json({ error: "Cannot delete a preset style" });
  }
  await style.deleteOne();
  res.status(204).end();
});

module.exports = router;
