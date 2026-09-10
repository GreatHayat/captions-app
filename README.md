# content-app

An AI-assisted video captioning/editing app: upload a video, transcribe it with Deepgram, edit captions in a video-editor-style UI, and preview/export with Remotion.

Features include AI-generated keyword highlights, AI B-roll moments, AI auto-clip suggestions, Urdu→English caption translation, lower thirds, emoji reactions, aspect-ratio cropping, color grading, and auto-zoom on highlighted words.

## Project layout

This repo holds two independent, unlinked packages — no root `package.json`/workspace config. Each has its own `node_modules` and must be worked on from within its own directory.

- `frontend/` — Vite + React 19 + TypeScript + Tailwind v4, Remotion `<Player>` for video/caption preview.
- `backend/` — Express 5 + Mongoose (MongoDB) + Deepgram REST API + system `ffmpeg`/`ffprobe`.

## Prerequisites

- Node.js
- MongoDB (local or remote, via `MONGO_URI`)
- System `ffmpeg` and `ffprobe` binaries on `PATH`
- A [Deepgram](https://deepgram.com/) API key (transcription)
- A [Groq](https://groq.com/) API key (AI Highlight, AI B-Roll, Auto-Clips, translation, emoji reactions)

## Setup

### Backend

```
cd backend
npm install
cp .env-sample .env   # fill in DEEPGRAM_API_KEY, GROQ_API_KEY, MONGO_URI, PORT, FRONTEND_ORIGIN
npm run dev           # http://localhost:5001 (nodemon)
```

`.env` variables:

- `DEEPGRAM_API_KEY` — transcription
- `GROQ_API_KEY` — used by `src/services/groq.js` for AI Highlight, B-Roll, Auto-Clips, translation, emoji reactions
- `MONGO_URI` — MongoDB connection string
- `PORT` — default `5001` (**do not use `5000`** — macOS ControlCenter/AirPlay Receiver squats on it)
- `FRONTEND_ORIGIN` — CORS allow-origin, default `http://localhost:5173`

### Frontend

```
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api -> http://localhost:5001
```

## Commands

### Frontend (`frontend/`)

```
npm run dev       # start Vite dev server
npm run build     # tsc -b (project references) then vite build
npm run lint      # eslint .
npm run preview   # preview production build
```

### Backend (`backend/`)

```
npm run dev       # nodemon src/index.js
npm run start     # node src/index.js (no watch)
```

Neither package has a test runner configured.

## Documentation

- `CLAUDE.md` — how to build/run this project, plus detailed architecture notes for each feature.
- `AGENTS.md` — product roadmap and the architecture-decision log (why things are built the way they are).
