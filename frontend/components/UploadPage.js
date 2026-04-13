"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { getUser } from '../lib/store'
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'
const GENRES = ['Pop', 'Rock', 'Melody', 'Classic', 'Folk', 'Jazz', 'Hip-hop', 'Bollywood', 'Other']

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function parseTime(str) {
  const [m, s] = str.split(':').map(Number)
  return (m || 0) * 60 + (s || 0)
}

// ── Mini vocal custom player ───────────────────────────────────────
function VocalPlayer({ src, audioRef }) {
  const seekRef = useRef(null)
  const rafRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [curTime, setCurTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)

  const tick = useCallback(() => {
    const a = audioRef.current
    if (!a || a.paused) return
    if (!dragging) {
      const t = a.currentTime, d = a.duration || 1
      setProgress((t / d) * 100)
      setCurTime(t)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [dragging, audioRef])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onMeta = () => setDuration(a.duration || 0)
    const onPlay = () => { setPlaying(true); rafRef.current = requestAnimationFrame(tick) }
    const onPause = () => { setPlaying(false); cancelAnimationFrame(rafRef.current) }
    const onEnded = () => { setPlaying(false); setProgress(0); setCurTime(0) }
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      cancelAnimationFrame(rafRef.current)
    }
  }, [tick, audioRef])

  const toggle = () => {
    const a = audioRef.current; if (!a) return
    if (a.paused) a.play().catch(() => { }); else a.pause()
  }

  const calcPct = (e) => {
    const bar = seekRef.current; if (!bar) return null
    const rect = bar.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }
  const applySeek = (pct) => {
    const a = audioRef.current; if (!a || !a.duration) return
    a.currentTime = pct * a.duration
    setProgress(pct * 100); setCurTime(a.currentTime)
  }

  const onPointerDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); const p = calcPct(e); if (p !== null) applySeek(p) }
  const onPointerMove = (e) => { if (!dragging) return; const p = calcPct(e); if (p !== null) { setProgress(p * 100); setCurTime((audioRef.current?.duration || 0) * p) } }
  const onPointerUp = (e) => { const p = calcPct(e); if (p !== null) applySeek(p); setDragging(false) }

  return (
    <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,78,138,0.05)', border: '1px solid rgba(255,78,138,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button
          onClick={toggle}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg,var(--pink),#A855F7)',
            color: 'white', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255,78,138,0.35)', flexShrink: 0,
          }}
        >{playing ? '⏸' : '▶'}</button>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTime(curTime)} / {fmtTime(duration)}
        </div>
        <div style={{ fontSize: 11, color: '#BE185D', fontWeight: 700 }}>🎤 Vocal</div>
      </div>
      <div
        ref={seekRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ height: 6, borderRadius: 99, background: 'rgba(255,78,138,0.15)', cursor: 'pointer', position: 'relative', userSelect: 'none', touchAction: 'none' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, borderRadius: 99, background: 'linear-gradient(90deg,var(--pink),#A855F7)', transition: dragging ? 'none' : 'width 0.1s linear', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--pink)', border: '2px solid white', boxShadow: '0 1px 6px rgba(255,78,138,0.5)', pointerEvents: 'none', transition: dragging ? 'none' : 'left 0.1s linear', zIndex: 2 }} />
      </div>
    </div>
  )
}

// ── Instructions popup ─────────────────────────────────────────────
function InstructionsPopup({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: '0 20px 88px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 20, padding: '22px 22px 18px',
          maxWidth: 340, width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>
            📖 How to Upload
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--surface)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['1️⃣', 'Upload Instrumental', 'Choose an MP3/WAV without vocals. This is what others will sing along to.'],
            ['2️⃣', 'Add Vocal Reference (optional)', 'Upload the original song with vocals. Use it to stamp lyric timings accurately — never uploaded to server.'],
            ['3️⃣', 'Type or paste Lyrics', 'Add each lyric line. Hit ⏱ or press Space / ↓ while audio plays to stamp the exact time for each line.'],
            ['4️⃣', 'Fill Song Details', 'Add title, artist name, genre and cover art.'],
            ['5️⃣', 'Upload!', 'Hit the upload button. Your song will appear in the community for everyone to sing.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{num}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 10, background: 'rgba(155,92,246,0.07)', border: '1px solid rgba(155,92,246,0.18)', fontSize: 12, color: '#5B21B6' }}>
          💡 <strong>Tip:</strong> While stamping, press <kbd style={{ background: '#EDE9FE', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>Space</kbd> or <kbd style={{ background: '#EDE9FE', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>↓</kbd> to stamp the next line instantly!
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

// ── Main UploadPage ────────────────────────────────────────────────
export default function UploadPage() {
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('Pop')
  const [audio, setAudio] = useState(null)
  const [cover, setCover] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  // Lyrics state
  const [lines, setLines] = useState([{ text: '', time: 0 }])
  const [rawText, setRawText] = useState(false)
  const [plainLyrics, setPlainLyrics] = useState('')
  const [stamp, setStamp] = useState(null)  // index being stamped
  const [activeLine, setActiveLine] = useState(-1)    // currently highlighted line while audio plays
  const [stampIdx, setStampIdx] = useState(0)     // next line index to stamp with spacebar/down

  // Audio refs
  const instrRef = useRef(null)   // instrumental
  const vocalRef = useRef(null)   // vocal reference

  const [audioUrl, setAudioUrl] = useState(null)
  const [refUrl, setRefUrl] = useState(null)

  // The player used for stamping: prefer vocal reference
  const stampSrc = refUrl || audioUrl
  // The active audioRef for stamping
  const activeRef = refUrl ? vocalRef : instrRef

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
  }, [])

  // Hydrate form from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('kk_upload_autosave')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.title) setTitle(parsed.title)
          if (parsed.artist) setArtist(parsed.artist)
          if (parsed.genre) setGenre(parsed.genre)
          if (parsed.lines) setLines(parsed.lines)
          if (parsed.rawText !== undefined) setRawText(parsed.rawText)
          if (parsed.plainLyrics) setPlainLyrics(parsed.plainLyrics)
        }
      } catch (e) { }
    }
  }, [])

  // Save form to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kk_upload_autosave', JSON.stringify({
          title, artist, genre, lines, rawText, plainLyrics
        }))
      } catch (e) { }
    }
  }, [title, artist, genre, lines, rawText, plainLyrics])

  // ── Sync active lyric line while audio plays ──────────────
  useEffect(() => {
    const a = activeRef.current
    if (!a || !lines.length) return
    let raf
    const tick = () => {
      const t = a.currentTime
      let idx = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= t) idx = i
      }
      setActiveLine(idx)
      raf = requestAnimationFrame(tick)
    }
    const onPlay = () => { raf = requestAnimationFrame(tick) }
    const onPause = () => cancelAnimationFrame(raf)
    const onEnded = () => { cancelAnimationFrame(raf); setActiveLine(-1) }

    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)

    // If audio is already playing when lines update, continue tick
    if (!a.paused) onPlay()
    // Initial sync
    else {
      const t = a.currentTime
      let idx = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= t) idx = i
      }
      setActiveLine(idx)
    }

    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      cancelAnimationFrame(raf)
    }
  }, [lines, audioUrl, refUrl])

  // ── Keyboard handler: Space / Down stamps current line ───────────
  useEffect(() => {
    const onKey = (e) => {
      // Only when an audio source is loaded
      if (!stampSrc) return
      // Don't intercept if user is typing in an input/textarea
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault()
        setStampIdx(prev => {
          const idx = prev
          if (idx >= lines.length) return prev
          const a = activeRef.current
          if (!a) return prev
          const t = Math.floor(a.currentTime)
          setLines(l => l.map((x, i) => i === idx ? { ...x, time: t } : x))
          setStamp(idx)
          setTimeout(() => setStamp(null), 600)
          return Math.min(idx + 1, lines.length - 1)
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stampSrc, lines, activeRef])

  // Reset stampIdx when lines change (new import etc.)
  useEffect(() => { setStampIdx(0) }, [lines.length])

  const onCover = e => {
    const f = e.target.files[0]; if (!f) return
    setCover(f)
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f)
  }

  const onAudio = e => {
    const f = e.target.files[0]; if (!f) return
    setAudio(f)
    const url = URL.createObjectURL(f)
    setAudioUrl(url)
  }

  const onRefAudio = e => {
    const f = e.target.files[0]; if (!f) return
    setRefUrl(URL.createObjectURL(f))
    setStampIdx(0)
  }

  const addLine = () => setLines(l => [...l, { text: '', time: l[l.length - 1]?.time || 0 }])
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateText = (i, v) => setLines(l => l.map((x, idx) => idx === i ? { ...x, text: v } : x))
  const updateTime = (i, v) => {
    const sec = parseTime(v)
    setLines(l => l.map((x, idx) => idx === i ? { ...x, time: isNaN(sec) ? x.time : sec } : x))
  }
  const stampCurrent = (i) => {
    const a = activeRef.current; if (!a) return
    const t = Math.floor(a.currentTime)
    setLines(l => l.map((x, idx) => idx === i ? { ...x, time: t } : x))
    setStamp(i)
    setStampIdx(Math.min(i + 1, lines.length - 1))
    setTimeout(() => setStamp(null), 600)
  }
  const importPlain = () => {
    if (!plainLyrics.trim()) return
    const imported = plainLyrics.split('\n').filter(Boolean).map((text, i) => ({ text, time: i * 4 }))
    setLines(imported); setRawText(false)
  }

  const buildLyricsPlain = () => lines.map(l => l.text).filter(Boolean).join('\n')
  const buildTimedLyrics = () => lines.filter(l => l.text.trim())

  const submit = async () => {
    if (!title.trim()) return setErr('Song title is required')
    if (!audio) return setErr('Please select an audio file')
    setLoading(true); setErr('')
    try {
      const form = new FormData()
      form.append('title', title); form.append('artist', artist); form.append('genre', genre)
      form.append('lyrics', buildLyricsPlain())
      form.append('timedLyrics', JSON.stringify(buildTimedLyrics()))
      form.append('uploaderName', user.name); form.append('uploaderUid', user.uid)
      form.append('audio', audio)
      if (cover) form.append('cover', cover)
      const r = await fetch(`${API}/api/songs`, { method: 'POST', body: form })
      if (!r.ok) throw new Error('Upload failed — is the backend running?')
      localStorage.removeItem('kk_upload_autosave')
      setDone(true)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 26, marginBottom: 8 }}>Song Uploaded!</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 15 }}>Your song is now live for everyone to sing</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/" className="btn btn-grad" style={{ padding: '12px 28px', fontSize: 14, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/profile" className="btn btn-out" style={{ padding: '11px 28px', fontSize: 14, textDecoration: 'none' }}>👤 Profile</a>
        </div>
      </div>
    </div>
  )

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spin" /></div>

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar title="Upload Song" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 24, color: 'var(--text)' }}>Upload a Song</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Share an instrumental track for the community to sing</p>
        </div>

        {/* Cover art */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', marginBottom: 12 }}>Cover Art <span style={{ fontWeight: 600, color: 'var(--text3)' }}>(optional)</span></div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', flexShrink: 0 }}>
              <input type="file" accept="image/*" onChange={onCover} style={{ display: 'none' }} />
              <div style={{ width: 88, height: 88, borderRadius: 14, overflow: 'hidden', background: preview ? 'transparent' : 'var(--surface)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>🖼️</span>}
              </div>
            </label>
            <div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={onCover} style={{ display: 'none' }} />
                <span className="btn btn-soft" style={{ padding: '8px 18px', fontSize: 13, display: 'inline-block' }}>Choose Image</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>JPG or PNG · max 5MB</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Song Title *</label>
              <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tum Hi Ho" style={{ padding: '12px 14px' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Artist</label>
              <input className="inp" value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g. Arijit Singh" style={{ padding: '12px 14px' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Genre</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GENRES.map(g => (
                  <button key={g} onClick={() => setGenre(g)} className="btn" style={{
                    padding: '7px 16px', fontSize: 12,
                    background: genre === g ? 'var(--grad)' : 'var(--surface)',
                    color: genre === g ? 'white' : 'var(--text2)',
                    border: genre === g ? 'none' : '1px solid var(--border)', borderRadius: 50,
                  }}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instrumental Audio */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', marginBottom: 10 }}>Instrumental Audio *</div>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input type="file" accept="audio/*" onChange={onAudio} style={{ display: 'none' }} />
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 14, padding: '24px 20px', textAlign: 'center',
              background: audio ? 'rgba(155,92,246,0.05)' : 'var(--surface)',
              borderColor: audio ? 'var(--purple)' : 'var(--border)', transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{audio ? '🎵' : '📁'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: audio ? 'var(--purple)' : 'var(--text2)' }}>
                {audio ? audio.name : 'Click to select instrumental audio'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>MP3, WAV, AAC, OGG · max 100MB</div>
            </div>
          </label>
          {/* Instrumental native player — kept as-is */}
          {audioUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                🎼 Instrumental preview — use ⏱ to stamp lyric start times
              </div>
              <audio ref={instrRef} src={audioUrl} controls style={{ width: '100%', borderRadius: 8 }} />
            </div>
          )}
        </div>

        {/* Vocal Reference — client-only */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>🎤 Reference Audio (with vocals) <span style={{ fontWeight: 600, color: 'var(--text3)' }}>(optional)</span></div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Play the original vocal version here to stamp lyric timings accurately. <strong>This file is never uploaded.</strong></div>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input type="file" accept="audio/*" onChange={onRefAudio} style={{ display: 'none' }} />
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 12, padding: '16px 16px', textAlign: 'center',
              background: refUrl ? 'rgba(255,78,138,0.05)' : 'var(--surface)',
              borderColor: refUrl ? 'var(--pink)' : 'var(--border)', transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{refUrl ? '🎤' : '🎙️'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: refUrl ? 'var(--pink)' : 'var(--text2)' }}>
                {refUrl ? 'Vocal reference loaded ✓' : 'Click to choose vocal / original audio'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>MP3, WAV, AAC · client-only, never stored</div>
            </div>
          </label>
          {/* Separate vocal custom player */}
          {refUrl && (
            <>
              <audio ref={vocalRef} src={refUrl} preload="metadata" style={{ display: 'none' }} />
              <VocalPlayer src={refUrl} audioRef={vocalRef} />
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,78,138,0.06)', border: '1px solid rgba(255,78,138,0.2)', fontSize: 12, color: '#BE185D' }}>
                ✅ Vocal reference is active — the ⏱ stamps will use this audio. Only the instrumental will be uploaded to the server.
              </div>
            </>
          )}
        </div>

        {/* Timed Lyrics Editor */}
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)' }}>📝 Lyrics + Timing</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Set when each line appears while singing</div>
            </div>
            <button className="btn btn-soft" onClick={() => setRawText(v => !v)} style={{ padding: '6px 14px', fontSize: 12 }}>
              {rawText ? '← Back to editor' : '⬇ Import text'}
            </button>
          </div>

          {rawText ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Paste all lyrics — each line will be auto-spaced by 4 seconds</div>
              <textarea value={plainLyrics} onChange={e => setPlainLyrics(e.target.value)}
                placeholder="Paste lyrics here (one line per row)…"
                style={{ width: '100%', height: 160, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 12, padding: 14, fontSize: 13, resize: 'vertical', fontFamily: "'Nunito',sans-serif", outline: 'none', lineHeight: 1.9 }} />
              <button onClick={importPlain} className="btn btn-grad" style={{ marginTop: 10, padding: '8px 18px', fontSize: 13 }}>✓ Use these lyrics</button>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px', gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Lyric Line</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Start (MM:SS)</div>
                <div />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {lines.map((ln, i) => {
                  const isActiveStampLine = i === stampIdx
                  const isHighlighted = i === activeLine
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 90px 36px', gap: 8, alignItems: 'center',
                      borderRadius: 10,
                      background: isHighlighted ? 'rgba(155,92,246,0.07)' : 'transparent',
                      border: isHighlighted ? '1.5px solid rgba(155,92,246,0.3)' : '1.5px solid transparent',
                      padding: isHighlighted ? '2px 6px' : '2px 6px',
                      transition: 'all 0.25s',
                    }}>
                      <input
                        className="inp"
                        value={ln.text}
                        onChange={e => updateText(i, e.target.value)}
                        placeholder={`Line ${i + 1}…`}
                        style={{ padding: '9px 12px', fontSize: 13, fontWeight: isHighlighted ? 700 : 400 }}
                      />
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          className="inp"
                          value={fmtTime(ln.time)}
                          onChange={e => updateTime(i, e.target.value)}
                          style={{ padding: '9px 8px', fontSize: 13, textAlign: 'center', width: '100%' }}
                        />
                        {stampSrc && (
                          <button
                            title={isActiveStampLine ? 'Next to stamp (Space/↓)' : 'Stamp current audio time'}
                            onClick={() => stampCurrent(i)}
                            style={{
                              flexShrink: 0, width: 30, height: 36, borderRadius: 8, border: 'none',
                              background: stamp === i ? 'var(--grad)' : isActiveStampLine ? 'rgba(155,92,246,0.15)' : 'var(--surface)',
                              color: stamp === i ? 'white' : isActiveStampLine ? 'var(--purple)' : 'var(--text2)',
                              cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
                              outline: isActiveStampLine ? '2px solid rgba(155,92,246,0.5)' : 'none',
                            }}>⏱</button>
                        )}
                      </div>
                      <button
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        style={{
                          width: 36, height: 36, borderRadius: 8, border: 'none',
                          background: 'var(--surface)', color: '#E0284A',
                          cursor: lines.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16,
                          opacity: lines.length === 1 ? 0.3 : 1
                        }}>✕</button>
                    </div>
                  )
                })}
              </div>

              <button onClick={addLine} className="btn btn-soft" style={{ marginTop: 12, padding: '8px 18px', fontSize: 13 }}>+ Add Line</button>

              {stampSrc && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(155,92,246,0.07)', border: '1px solid rgba(155,92,246,0.18)', fontSize: 12, color: '#5B21B6' }}>
                  ⌨️ Play the audio then press <strong>Space</strong> or <strong>↓</strong> to stamp the highlighted line. Current: <strong>Line {stampIdx + 1}</strong>
                  {refUrl ? ' · Using vocal reference.' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {err && (
          <div style={{ background: '#FFF0F2', border: '1px solid #FBBFD0', borderRadius: 12, padding: '12px 16px', color: '#E0284A', fontSize: 13, marginBottom: 14 }}>
            ⚠️ {err}
          </div>
        )}

        <button onClick={submit} disabled={loading} className="btn btn-grad"
          style={{ width: '100%', padding: '15px', fontSize: 16, borderRadius: 50, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Uploading…' : '🎵 Upload Song'}
        </button>
      </div>

      <BottomNav />

      {/* Instructions popup */}
      {showHelp && <InstructionsPopup onClose={() => setShowHelp(false)} />}

      {/* Floating help button */}
      <button
        onClick={() => setShowHelp(true)}
        title="How to upload"
        style={{
          position: 'fixed', bottom: 90, right: 20, zIndex: 999,
          width: 50, height: 50, borderRadius: '50%', border: 'none',
          background: 'var(--grad)', color: 'white',
          fontSize: 20, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(155,92,246,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(155,92,246,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(155,92,246,0.45)' }}
      >?</button>
    </div>
  )
}
