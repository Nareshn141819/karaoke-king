# 🎤 Karaoke King

> Sing any song. Get AI-scored on pitch, timing & emotion. Share. Compete.

---

## Quick Start

### 1. Backend
```powershell
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### 2. Frontend
```powershell
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Pages & Features

| Page | URL | Features |
|------|-----|----------|
| Home | `/` | Search YouTube songs, community song grid |
| Studio | (in-page) | Recording + voice monitoring + lyrics |
| Results | (in-page) | Animated score rings, download, share |
| Feed | `/feed` | Community performances + song library |
| Leaderboard | `/leaderboard` | Top singers podium + rankings |
| Profile | `/profile` | My songs, recordings, stats |
| Upload | `/upload` | Upload instrumental + lyrics |
| Login | `/login` | Firebase Auth (email/password) |

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
YOUTUBE_API_KEY=your_key_here   # optional — demo results work without it
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API=http://localhost:5000
```

---

## Architecture

**The fix for Internal Server Error:**  
Every page uses `dynamic(..., { ssr: false })` which prevents Next.js from  
rendering on the server. All `localStorage`, `window`, `AudioContext` APIs  
are 100% browser-only and safe.

```
frontend/app/page.js
  → dynamic import → components/App.js    (client only)

frontend/app/login/page.js
  → dynamic import → components/LoginPage.js
... (same pattern for all pages)
```

**Audio monitoring chain:**
```
Mic → AnalyserNode (waveform display)
    → RecordDestination (saved to file)
    → GainNode (0–100% volume control)
        → [ConvolverNode if reverb enabled]
        → AudioContext.destination (earphones)
```

---

## Optional AI Scoring

For real AI pitch analysis, install Python deps:
```bash
cd ai
pip install -r requirements.txt
```

Without Python, the backend returns realistic demo scores automatically.

---

## YouTube API Key (optional)

Without a key, search returns 3 demo results.  
With a key, you get real YouTube search results.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create API key → add to `backend/.env`
