require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Uploads folder ────────────────────────────────────────────
const UPLOADS = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true })
app.use('/uploads', express.static(UPLOADS))

// ── Songs metadata (JSON file as simple DB) ───────────────────
const DB = path.join(__dirname, 'songs.json')
const loadSongs = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')) } catch { return [] } }
const saveSongs = (s) => fs.writeFileSync(DB, JSON.stringify(s, null, 2))

// ── Multer configs ────────────────────────────────────────────
const voiceMul = multer({ dest: UPLOADS })
const songMul = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOADS),
    filename: (_, f, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.originalname)}`)
  }),
  limits: { fileSize: 100 * 1024 * 1024 }
})

// ── Health ────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ ok: true, msg: 'Karaoke King API 🎤' }))

// ── YouTube search ────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'Missing query' })

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    // Demo results — works without a key
    return res.json({
      items: [
        { id: { videoId: 'dQw4w9WgXcQ' }, snippet: { title: `${q} - Karaoke Version`, channelTitle: 'Karaoke World', thumbnails: { default: { url: `https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg` } } } },
        { id: { videoId: '9bZkp7q19f0' }, snippet: { title: `${q} - Instrumental`, channelTitle: 'Sing Along', thumbnails: { default: { url: `https://img.youtube.com/vi/9bZkp7q19f0/default.jpg` } } } },
        { id: { videoId: 'L_jWHffIx5E' }, snippet: { title: `${q} - Official Karaoke`, channelTitle: 'Karaoke HD', thumbnails: { default: { url: `https://img.youtube.com/vi/L_jWHffIx5E/default.jpg` } } } },
      ]
    })
  }

  try {
    const fetch = require('node-fetch')
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q + ' karaoke')}&maxResults=50&key=${key}`
    const r = await fetch(url)
    const data = await r.json()
    if (data.error) {
      console.log('YouTube API quota exceeded or error. Falling back to demo data.')
      return res.json({
        items: [
          { id: { videoId: 'dQw4w9WgXcQ' }, snippet: { title: `${q} - Karaoke Version`, channelTitle: 'Karaoke World', thumbnails: { default: { url: `https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg` } } } },
          { id: { videoId: '9bZkp7q19f0' }, snippet: { title: `${q} - Instrumental`, channelTitle: 'Sing Along', thumbnails: { default: { url: `https://img.youtube.com/vi/9bZkp7q19f0/default.jpg` } } } },
          { id: { videoId: 'L_jWHffIx5E' }, snippet: { title: `${q} - Official Karaoke`, channelTitle: 'Karaoke HD', thumbnails: { default: { url: `https://img.youtube.com/vi/L_jWHffIx5E/default.jpg` } } } },
        ]
      })
    }
    res.json(data)
  } catch (e) { res.status(500).json({ error: 'YouTube search failed' }) }
})

// ── Analyze voice ─────────────────────────────────────────────
app.post('/analyze', voiceMul.single('voice'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio uploaded' })
  const vp = req.file.path
  const ai = path.join(__dirname, '../ai/pitch_analyses.py')
  const py = process.platform === 'win32' ? 'python' : 'python3'

  if (!fs.existsSync(ai)) { cleanup(vp); return res.json(demo()) }

  const proc = spawn(py, [ai, vp])
  let out = '', err = ''
  proc.stdout.on('data', d => out += d)
  proc.stderr.on('data', d => err += d)
  proc.on('error', () => { cleanup(vp); res.json(demo()) })
  proc.on('close', code => {
    cleanup(vp)
    if (code !== 0) return res.json(demo())
    try { res.json(JSON.parse(out.trim())) } catch { res.json(demo()) }
  })
})

// ── Songs: list ───────────────────────────────────────────────
app.get('/api/songs', (req, res) => {
  let songs = loadSongs()
  if (req.query.uid) songs = songs.filter(s => s.uploaderUid === req.query.uid)
  res.json({ songs })
})

// ── Songs: upload ─────────────────────────────────────────────
app.post('/api/songs', songMul.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  const { title, artist, genre, lyrics, timedLyrics, uploaderName, uploaderUid } = req.body
  if (!title || !req.files?.audio) return res.status(400).json({ error: 'title and audio required' })

  let parsedTimedLyrics = null
  if (timedLyrics) {
    try { parsedTimedLyrics = JSON.parse(timedLyrics) } catch { parsedTimedLyrics = null }
  }

  const song = {
    id: Date.now().toString(),
    title,
    artist: artist || '',
    genre: genre || 'Pop',
    lyrics: lyrics || '',
    timedLyrics: parsedTimedLyrics,
    uploaderName: uploaderName || 'Anonymous',
    uploaderUid: uploaderUid || '',
    audioFile: req.files.audio[0].filename,
    coverUrl: req.files?.cover ? `/uploads/${req.files.cover[0].filename}` : null,
    createdAt: new Date().toISOString(),
  }

  const songs = loadSongs()
  songs.unshift(song)
  saveSongs(songs)
  res.json({ ok: true, song })
})

// ── Songs: delete ─────────────────────────────────────────────
app.delete('/api/songs/:id', (req, res) => {
  const uid = req.headers['x-user-uid']
  let songs = loadSongs()
  const song = songs.find(s => s.id === req.params.id)
  if (!song) return res.status(404).json({ error: 'Not found' })
  if (song.uploaderUid && song.uploaderUid !== uid) return res.status(403).json({ error: 'Not authorized' })

  try { fs.unlinkSync(path.join(UPLOADS, song.audioFile)) } catch { }
  if (song.coverUrl) try { fs.unlinkSync(path.join(UPLOADS, song.coverUrl.replace('/uploads/', ''))) } catch { }

  saveSongs(songs.filter(s => s.id !== req.params.id))
  res.json({ ok: true })
})

// ── Helpers ───────────────────────────────────────────────────
function cleanup(p) { try { fs.unlinkSync(p) } catch { } }
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
function demo() {
  const p = rnd(58, 96), t = rnd(58, 96), e = rnd(58, 96), avg = Math.round((p + t + e) / 3)
  return {
    pitch_score: p, timing_score: t, emotion_score: e,
    rank: avg >= 85 ? 'Platinum' : avg >= 70 ? 'Gold' : avg >= 55 ? 'Silver' : 'Bronze', avg_score: avg
  }
}

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🎤  Karaoke King backend → http://localhost:${PORT}`)
  console.log(`    YouTube search: ${process.env.YOUTUBE_API_KEY ? '✅ API key set' : '⚠️  No YOUTUBE_API_KEY — demo results only'}`)
  console.log(`    Python AI:      ${require('child_process').spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['--version']).status === 0 ? '✅ Available' : '⚠️  Not found — using demo scores'}\n`)
})
