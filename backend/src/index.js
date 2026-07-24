require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const videosRouter = require("./routes/videos");
const captionStylesRouter = require("./routes/captionStyles");
const { syncCaptionStyles } = require("./services/syncCaptionStyles");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/videos", videosRouter);
app.use("/api/caption-styles", captionStylesRouter);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => syncCaptionStyles())
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
