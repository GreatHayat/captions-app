const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const videoId = new mongoose.Types.ObjectId();
    const dir = path.join(UPLOADS_ROOT, "videos", videoId.toString());
    fs.mkdirSync(dir, { recursive: true });
    req.videoId = videoId;
    req.videoDir = dir;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    req.storedExt = ext;
    cb(null, `original${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are accepted"));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOADS_ROOT };
