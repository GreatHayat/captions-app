# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

An AI-assisted video captioning/editing app: upload a video, transcribe it with Deepgram, edit captions in a video-editor-style UI, preview with Remotion. See `AGENTS.md` for the product roadmap and the architecture-decision log (why things are built the way they are) — keep both this file and `AGENTS.md` up to date as work progresses, but keep the split: this file is "how to build/run," `AGENTS.md` is "what we're building and why."

Two independent, unlinked packages — no root `package.json`/workspace config, and no git repository tying them together. Each has its own `node_modules` and must be worked on from within its own directory.

- `frontend/` — Vite + React 19 + TypeScript + Tailwind v4, Remotion `<Player>` for video/caption preview.
- `backend/` — Express 5 + Mongoose (MongoDB) + Deepgram REST API + system `ffmpeg`/`ffprobe`.

## Commands

### Frontend (`frontend/`)

```
npm run dev       # start Vite dev server (http://localhost:5173), proxies /api -> http://localhost:5001
npm run build     # tsc -b (project references) then vite build
npm run lint      # eslint .
npm run preview   # preview production build
```

No test runner configured.

### Backend (`backend/`)

```
npm run dev       # nodemon src/index.js (http://localhost:PORT, default 5001)
npm run start     # node src/index.js (no watch)
```

No test runner configured (`npm test` is still the default npm stub).

Requires the system `ffmpeg` and `ffprobe` binaries on `PATH` (used via `child_process`, no `fluent-ffmpeg` dependency).

Backend `.env`: `DEEPGRAM_API_KEY`, `GROQ_API_KEY` (used by `src/services/groq.js` for AI Highlight), `MONGO_URI`, `PORT` (default 5001 — **do not use 5000**, macOS ControlCenter/AirPlay Receiver squats on it), `FRONTEND_ORIGIN` (CORS allow-origin, default `http://localhost:5173`).

## Architecture notes

- **Backend layout**: `src/index.js` (express app + mongo connect + caption-style sync) → `src/routes/{videos,captionStyles}.js` mounted at `/api/videos` and `/api/caption-styles` → `src/services/{ffmpeg,deepgram,cues,syncCaptionStyles,render,groq}.js` → `src/models/{Video,Transcript,CaptionStyle}.js` (Mongoose). Uploaded files live under `backend/uploads/videos/<mongoId>/` (gitignored): `original.<ext>` (the video) plus whichever of `audio.mp3`/`audio.ogg` ffmpeg produced smaller.
- **Video processing is synchronous**: `POST /api/videos` does upload → ffmpeg extraction → Deepgram transcription → Mongo save all in one request/response (see `AGENTS.md` for why, and when to revisit). Export (`GET /api/videos/:id/export`) is synchronous too, same rationale.
- **`GET /api/videos/:id/stream`** supports HTTP Range requests (required for the Remotion/video player to seek, and used as the export render's video source too).
- **Caption styles**: `backend/data/caption-styles.json` is the source-of-truth preset list; `syncCaptionStyles()` upserts it into the `CaptionStyle` collection on every server startup (nodemon watches `backend/`, so editing the file auto-restarts and re-syncs — see `AGENTS.md`). `POST /api/caption-styles` adds a custom one (`isCustom: true`); `PATCH`/`DELETE /api/caption-styles/:id` only work on custom ones (presets are read-only). `PATCH /api/videos/:id/caption-settings` sets a video's `captionStyleId`/`captionPosition`/`captionDisplayMode`/`highlightColor`/`highlightBackground`/`highlightBold` (enums in `src/constants.js`).
- **AI Highlight**: `POST /api/videos/:id/highlight` (`src/services/groq.js`, Groq's `openai/gpt-oss-20b`) picks the "main" words out of the video's already-stored transcript and caches them on `Transcript.highlightedWords`/`highlightsGeneratedAt` — calling it again just returns the cached result, never re-calls Groq.
- **Export**: `GET /api/videos/:id/export` renders the video with captions (and highlights) burned in via `src/services/render.js` (`@remotion/bundler` + `@remotion/renderer`, entry point at `frontend/src/remotion/index.ts` — see `AGENTS.md` for the cross-package coupling this implies) and streams back an MP4 at the video's original `width`/`height` (captured at upload time by `ffprobeDimensions()` in `services/ffmpeg.js`). First call on a fresh machine downloads a headless-Chromium binary (~93MB, one-time, cached under `~/.remotion`) — can take several minutes on a slow connection.
- **Frontend layout**: `src/screens/{UploadScreen,EditorScreen}.tsx` (the two top-level views, switched via local state in `App.tsx` — no router), `src/editor/{TranscriptPanel,Timeline,StyleSidebar,CustomStyleForm,PositionPicker,DisplayModePicker}.tsx` (left-pane caption editor with tabbed "Captions"/"Full text"/"AI Highlight" views + scrub bar; right-pane style gallery with per-custom-style edit/delete + custom-style form + display-mode toggle + 9-position grid), `src/remotion/{CaptionedVideo,Captions,Root,index}` (`Root.tsx`/`index.ts` are the server-render-only entry point — the browser preview never imports them, it embeds `CaptionedVideo` directly via `@remotion/player`'s `<Player component={...}>`), `src/api/{videos,captionStyles}.ts` (fetch wrappers, including `downloadVideo()`, `generateHighlights()`, `updateCaptionStyle()`), `src/types.ts` (shared `Word`/`Cue`/`VideoMeta`/`CaptionStyle`/`CaptionDisplayMode` types). `index.html` loads the Google Fonts used by the presets (Plus Jakarta Sans, DM Serif Display, Archivo, Nunito, JetBrains Mono, Poppins).
- **Remotion composition styling uses inline styles, not Tailwind** — not because of iframe isolation (there isn't any; `<Player>` renders straight into the main document), but so the composition stays portable to the server-side render (`@remotion/renderer`), which runs in a separate context without the Vite app's stylesheet.
- **Any prop passed to `<Player>` must be a stable reference** (wrap in `useMemo`). `EditorScreen.tsx` re-renders on every `frameupdate` during playback; an inline object/array literal passed as `inputProps` (carrying `videoUrl, cues, words, style, position, displayMode`) gets recreated every render and makes the Player re-sync/reseek the video, causing stutter. See `AGENTS.md` for the incident.
- **Frontend TS config** is split via project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`), bundler module resolution, strict unused-locals/parameters checks enabled.
