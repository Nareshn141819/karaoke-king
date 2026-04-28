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

  // Search DB first
  const songs = loadSongs()
  const lowerQ = q.toLowerCase()
  
  const dbMatches = songs.filter(s => 
    s.videoId && (
      (s.title && s.title.toLowerCase().includes(lowerQ)) ||
      (s.artist && s.artist.toLowerCase().includes(lowerQ))
    )
  )

  if (dbMatches.length > 0) {
    const items = dbMatches.map(s => ({
      id: { videoId: s.videoId },
      snippet: { 
        title: `${s.title}${s.artist ? ' - ' + s.artist : ''}`, 
        channelTitle: s.uploaderName || 'Karaoke DB', 
        thumbnails: { default: { url: s.coverUrl || `https://img.youtube.com/vi/${s.videoId}/default.jpg` } } 
      }
    }))
    return res.json({ items: items.slice(0, 50) })
  }

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

// ════════════════════════════════════════════════════════════════
// ── Listen Section APIs ────────────────────────────────────────
// ════════════════════════════════════════════════════════════════

// ── Listen: Search (music, not karaoke) ───────────────────────
app.get('/api/listen/search', async (req, res) => {
  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'Missing query' })

  // Search DB first
  const songs = loadSongs()
  const lowerQ = q.toLowerCase()
  
  const dbMatches = songs.filter(s => 
    s.videoId && (
      (s.title && s.title.toLowerCase().includes(lowerQ)) ||
      (s.artist && s.artist.toLowerCase().includes(lowerQ))
    )
  )

  if (dbMatches.length > 0) {
    const items = dbMatches.map(s => ({
      videoId: s.videoId,
      title: s.title,
      artist: s.artist || 'Unknown',
      channelTitle: s.uploaderName || 'Karaoke DB',
      thumbnail: s.coverUrl || `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
    }))
    return res.json({ items: items.slice(0, 50) })
  }

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    // Demo results for listen mode
    return res.json({
      items: [
        { videoId: 'dQw4w9WgXcQ', title: `${q} - Full Song`, artist: 'Various Artists', channelTitle: 'Music Channel', thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg` },
        { videoId: '9bZkp7q19f0', title: `${q} - Official Audio`, artist: 'Various Artists', channelTitle: 'Music World', thumbnail: `https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg` },
        { videoId: 'L_jWHffIx5E', title: `${q} - Lyrics Video`, artist: 'Various Artists', channelTitle: 'Lyrics HD', thumbnail: `https://img.youtube.com/vi/L_jWHffIx5E/hqdefault.jpg` },
      ]
    })
  }

  try {
    const fetch = require('node-fetch')
    // Search for official songs, not karaoke
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(q + ' official audio')}&maxResults=50&key=${key}`
    const r = await fetch(url)
    const data = await r.json()

    if (data.error) {
      console.log('YouTube API error for listen search, using fallback')
      return res.json({
        items: [
          { videoId: 'dQw4w9WgXcQ', title: `${q} - Full Song`, artist: 'Various Artists', channelTitle: 'Music Channel', thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg` },
          { videoId: '9bZkp7q19f0', title: `${q} - Official Audio`, artist: 'Various Artists', channelTitle: 'Music World', thumbnail: `https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg` },
        ]
      })
    }

    // Flatten YT API response into simpler format for listen page
    const items = (data.items || []).map(item => ({
      videoId: item.id?.videoId || '',
      title: item.snippet?.title || q,
      artist: item.snippet?.channelTitle || 'Unknown',
      channelTitle: item.snippet?.channelTitle || '',
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
    }))

    res.json({ items })
  } catch (e) {
    console.error('Listen search error:', e)
    res.status(500).json({ error: 'Search failed' })
  }
})

// ── Listen: Stream audio via yt-dlp (with URL cache for seeking) ──
const YT_DLP = process.platform === 'win32' ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');

// Auto-download yt-dlp binary on Render/Linux if missing
if (!fs.existsSync(YT_DLP)) {
  console.log(`[Setup] Missing yt-dlp binary. Downloading for ${process.platform}...`);
  const YTDlpWrap = require('yt-dlp-wrap').default;
  YTDlpWrap.downloadFromGithub(YT_DLP).then(() => {
    if (process.platform !== 'win32') fs.chmodSync(YT_DLP, '755');
    console.log('[Setup] ✅ yt-dlp downloaded automatically.');
  }).catch(e => console.log('[Setup] ❌ yt-dlp download failed:', e.message));
}

const audioUrlCache = new Map() // videoId → { url, exp }

// In-flight dedup: prevent multiple simultaneous yt-dlp spawns for same videoId
const inFlightResolvers = new Map() // videoId → Promise<url>

// Helper: run yt-dlp for a single videoId/search term and return audio URL
function ytdlpGetUrl(query) {
  return new Promise((resolve, reject) => {
    const args = [
      query,
      '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
      '--get-url', '--no-playlist', '--quiet',
      ...(fs.existsSync(path.join(__dirname, 'cookies.txt')) ? ['--cookies', path.join(__dirname, 'cookies.txt')] : []),
      '--force-ipv4',
      '--no-warnings',
      '--no-check-certificates',
    ]
    console.log(`[yt-dlp] Extracting: ${query}`)
    const proc = spawn(YT_DLP, args)
    let out = '', err = ''
    proc.stdout.on('data', d => out += d)
    proc.stderr.on('data', d => err += d)
    proc.on('close', code => {
      const u = out.trim().split('\n')[0] // take first URL if multiple
      if (code === 0 && u && u.startsWith('http')) {
        console.log(`[yt-dlp] ✅ Got URL for ${query.substring(0, 50)}`)
        resolve(u)
      } else {
        const errMsg = err.trim() || 'yt-dlp failed'
        console.log(`[yt-dlp] ❌ Failed: ${errMsg.substring(0, 120)}`)
        reject(new Error(errMsg))
      }
    })
    proc.on('error', reject)
    // Kill if it takes too long
    setTimeout(() => { try { proc.kill() } catch {} }, 25000)
  })
}

async function getAudioUrl(videoId) {
  const now = Date.now()
  const cached = audioUrlCache.get(videoId)
  if (cached && now < cached.exp) return cached.url

  // Deduplicate in-flight requests
  if (inFlightResolvers.has(videoId)) {
    return inFlightResolvers.get(videoId)
  }

  const resolvePromise = (async () => {
    // 1. Try direct video URL with yt-dlp
    try {
      const ytUrl = `https://www.youtube.com/watch?v=${videoId}`
      const url = await ytdlpGetUrl(ytUrl)
      audioUrlCache.set(videoId, { url, exp: now + 50 * 60 * 1000 })
      return url
    } catch (e) {
      console.log(`[audio] Direct yt-dlp failed for ${videoId}: ${e.message?.substring(0, 100)}`)
    }

    // 2. Fallback: search YouTube via yt-dlp for the same content
    try {
      console.log(`[audio] Trying yt-dlp search fallback for ${videoId}...`)
      const url = await ytdlpGetUrl(`ytsearch1:${videoId}`)
      audioUrlCache.set(videoId, { url, exp: now + 30 * 60 * 1000 })
      return url
    } catch (e2) {
      console.log(`[audio] Search fallback also failed: ${e2.message?.substring(0, 100)}`)
    }

    throw new Error('Could not extract audio URL — video may be unavailable')
  })()

  inFlightResolvers.set(videoId, resolvePromise)
  try {
    const result = await resolvePromise
    return result
  } finally {
    inFlightResolvers.delete(videoId)
  }
}

// HEAD requests — warm the cache without streaming data (used by frontend prefetch)
app.head('/api/listen/audio/:videoId', async (req, res) => {
  const { videoId } = req.params
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).end()
  }
  try {
    await getAudioUrl(videoId) // just resolve & cache the URL
    res.status(200).end()
  } catch (e) {
    console.error('[audio HEAD]', e.message)
    res.status(500).end()
  }
})

app.get('/api/listen/audio/:videoId', async (req, res) => {
  const { videoId } = req.params
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID' })
  }

  // Check if we have this song's audio file locally in the DB
  const songs = loadSongs()
  const localSong = songs.find(s => s.videoId === videoId && s.audioFile)
  if (localSong) {
    const localPath = path.join(UPLOADS, localSong.audioFile)
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath)
    }
  }

  try {
    const fetch = require('node-fetch')
    const directUrl = await getAudioUrl(videoId)
    const rangeHeader = req.headers.range

    const upstream = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
    })

    const ct = upstream.headers.get('content-type') || 'audio/mp4'
    const cl = upstream.headers.get('content-length')
    const cr = upstream.headers.get('content-range')

    res.setHeader('Content-Type', ct)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=300') // Cache for 5 min
    if (cl) res.setHeader('Content-Length', cl)
    if (cr) res.setHeader('Content-Range', cr)
    res.status(upstream.status)
    upstream.body.pipe(res)
    req.on('close', () => { try { upstream.body.destroy() } catch {} })
  } catch (e) {
    console.error('[audio]', e.message)
    if (!res.headersSent) res.status(500).json({ error: e.message })
  }
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
  console.log(`    Listen audio:   ✅ Audio streaming enabled`)
  console.log(`    Python AI:      ${require('child_process').spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['--version']).status === 0 ? '✅ Available' : '⚠️  Not found — using demo scores'}\n`)
})
