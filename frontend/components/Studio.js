"use client"
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { getUser, addFeed } from '../lib/store'
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

// Decode HTML entities like &amp; &quot; &#39;
function decodeHtml(str) {
  if (typeof document === 'undefined') return str
  const t = document.createElement('textarea')
  t.innerHTML = str
  return t.value
}

export default function Studio({ song, onDone, onBack }) {
  const [phase, setPhase] = useState('ready')  // ready|rec|processing
  const [dur, setDur] = useState(0)
  const [bars, setBars] = useState(Array(36).fill(4))
  const [lyrics, setLyrics] = useState(null)
  const [timedLyricsState, setTimedLyricsState] = useState(null)  // [{text, time}] from lrclib
  const [lErr, setLErr] = useState(false)
  const [lLoad, setLLoad] = useState(false)
  const [manual, setManual] = useState('')
  const [paste, setPaste] = useState(false)
  const [line, setLine] = useState(0)
  const [err, setErr] = useState(null)
  // monitoring
  const [mon, setMon] = useState(true) // Turn on monitoring by default for immersive experience
  const [monVol, setMonVol] = useState(0.75)
  const [reverb, setReverb] = useState(true) // Default to reverb
  const [instrVol, setInstrVol] = useState(0.8) // Live instrumental volume slider
  const [showMix, setShowMix] = useState(false) // Toggle live mixer UI

  // earphone reminder popup
  const [showTip, setShowTip] = useState(true)

  const recRef = useRef(null)
  const chunks = useRef([])
  const stream = useRef(null)
  const ctx = useRef(null)
  const analyser = useRef(null)
  const raf = useRef(null)
  const timer = useRef(null)
  const lyricT = useRef(null)
  const gainRef = useRef(null)
  const instrGainRef = useRef(null) // Added ref for live instrumental changes
  const instrRef = useRef(null)
  const startedAt = useRef(0)  // for timed lyrics

  // resolve lyrics: prefer timedLyrics from song, then plain lyrics, then fetch
  useEffect(() => {
    if (song.timedLyrics && song.timedLyrics.length > 0) {
      setTimedLyricsState(song.timedLyrics)
      setLyrics(song.timedLyrics.map(l => l.text || l))
      return
    }
    if (song.lyrics) { setLyrics(song.lyrics.split('\n').filter(Boolean)); return }
    getLyrics()
  }, [])

  // Parse LRC format: [mm:ss.xx] line text
  const parseLrc = (lrcText) => {
    const lines = []
    for (const raw of lrcText.split('\n')) {
      const m = raw.match(/^\[(\d+):(\d+\.?\d*)\](.*)$/)
      if (m) {
        const time = parseInt(m[1]) * 60 + parseFloat(m[2])
        const text = m[3].trim()
        if (text) lines.push({ time, text })
      }
    }
    return lines.sort((a, b) => a.time - b.time)
  }

  const getLyrics = async () => {
    setLLoad(true)
    try {
      // 1. Decode HTML entities (e.g. &amp; → &)
      const decoded = decodeHtml(song.title)
      // 2. Strip common karaoke/lang junk from title
      const clean = decoded
        .replace(/with scrolling lyrics?[^-]*/gi, '')
        .replace(/\(?(karaoke|instrumental|lyrics?|official|hd|audio|video|full song|eng\.?|hindi|हिंदी|\d{4})\)?/gi, '')
        .replace(/[|[\](){}]/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      // 3. Try to extract "Artist - Title" pattern
      const m = clean.match(/^(.+?)\s*[-–]\s*(.+)$/)
      const artist = m ? m[1].trim() : ''
      const trackTitle = m ? m[2].replace(/\(?(karaoke|instrumental|lyrics?|official|hd)\)?/gi, '').trim() : clean

      // 4. Try lrclib.net for TIMED lyrics (best sync)
      let timedFound = null
      if (artist && trackTitle) {
        try {
          const r = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(trackTitle)}`)
          if (r.ok) {
            const d = await r.json()
            if (d.syncedLyrics) timedFound = parseLrc(d.syncedLyrics)
            else if (d.plainLyrics) {
              setLyrics(d.plainLyrics.split('\n').map(l => l.trim()).filter(Boolean))
              setLLoad(false); return
            }
          }
        } catch { }
      }
      if (!timedFound && (artist || trackTitle)) {
        // lrclib search fallback
        try {
          const q = `${artist} ${trackTitle}`.trim()
          const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`)
          if (r.ok) {
            const results = await r.json()
            const best = results.find(x => x.syncedLyrics) || results.find(x => x.plainLyrics)
            if (best?.syncedLyrics) timedFound = parseLrc(best.syncedLyrics)
            else if (best?.plainLyrics) {
              setLyrics(best.plainLyrics.split('\n').map(l => l.trim()).filter(Boolean))
              setLLoad(false); return
            }
          }
        } catch { }
      }
      if (timedFound && timedFound.length > 0) {
        setTimedLyricsState(timedFound)
        setLyrics(timedFound.map(l => l.text))
        setLLoad(false); return
      }

      // 5. Fallback: lyrics.ovh plain text
      let found = null
      if (artist && trackTitle) {
        try {
          const r = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(trackTitle)}`)
          if (r.ok) { const d = await r.json(); if (d.lyrics) found = d.lyrics }
        } catch { }
      }
      if (!found) {
        try {
          const r = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(clean)}`)
          if (r.ok) {
            const d = await r.json()
            if (d.data?.[0]) {
              const r2 = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(d.data[0].artist.name)}/${encodeURIComponent(d.data[0].title)}`)
              if (r2.ok) { const d2 = await r2.json(); if (d2.lyrics) found = d2.lyrics }
            }
          }
        } catch { }
      }
      if (found) setLyrics(found.split('\n').map(l => l.trim()).filter(Boolean))
      else setLErr(true)
    } catch { setLErr(true) }
    finally { setLLoad(false) }
  }

  const makeReverb = (c) => {
    const conv = c.createConvolver()
    const sr = c.sampleRate, len = sr * 2
    const buf = c.createBuffer(2, len, sr)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5)
    }
    conv.buffer = buf
    return conv
  }

  useEffect(() => {
    if (gainRef.current && ctx.current)
      gainRef.current.gain.setTargetAtTime(mon ? monVol : 0, ctx.current.currentTime, 0.05)
  }, [mon, monVol])

  // Live map instrumental volume
  useEffect(() => {
    if (instrGainRef.current && ctx.current) {
      instrGainRef.current.gain.setTargetAtTime(instrVol, ctx.current.currentTime, 0.05)
    }
  }, [instrVol])

  const startRec = async () => {
    setErr(null); chunks.current = []
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        }
      })
      stream.current = mic

      // Use latencyHint:'interactive' for minimal monitoring delay
      const c = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 })
      ctx.current = c
      const micSrc = c.createMediaStreamSource(mic)

      // analyser for waveform
      const an = c.createAnalyser(); an.fftSize = 128
      analyser.current = an
      micSrc.connect(an)

      // ─── Studio Audio Routing Graph ───
      // mixedDest is what the MediaRecorder captures (vocals + instrumental)
      const mixedDest = c.createMediaStreamDestination()

      const comp = c.createDynamicsCompressor()
      comp.threshold.value = -24
      comp.knee.value = 10
      comp.ratio.value = 4
      comp.attack.value = 0.003
      comp.release.value = 0.15

      micSrc.connect(comp)

      // Voice recording gain — always 1.0 so voice ALWAYS gets recorded
      const voiceRecGain = c.createGain()
      voiceRecGain.gain.value = 1.0
      comp.connect(voiceRecGain)
      voiceRecGain.connect(mixedDest)  // ← voice goes into recording

      // Monitor Gain — controls what the singer hears in headphones (can be 0)
      const monitorGain = c.createGain()
      monitorGain.gain.value = mon ? monVol : 0
      gainRef.current = monitorGain
      comp.connect(monitorGain)

      if (reverb) {
        const rv = makeReverb(c)
        monitorGain.connect(rv); rv.connect(c.destination)
      } else {
        monitorGain.connect(c.destination)
      }

      // instrumental
      if (song.instrumentalUrl) {
        try {
          const aud = new Audio(); aud.crossOrigin = 'anonymous'; aud.src = song.instrumentalUrl
          instrRef.current = aud
          const iSrc = c.createMediaElementSource(aud)

          const instrGain = c.createGain()
          instrGain.gain.value = instrVol
          instrGainRef.current = instrGain

          iSrc.connect(instrGain)
          instrGain.connect(mixedDest)    // instrumental mixed into recording
          instrGain.connect(c.destination) // instrumental heard in headphones
          aud.play().catch(() => { })
        } catch { }
      }

      // waveform animation
      const data = new Uint8Array(an.frequencyBinCount)
      const draw = () => {
        an.getByteFrequencyData(data)
        setBars(Array.from(data).slice(0, 36).map(v => Math.max(4, (v / 255) * 76)))
        raf.current = requestAnimationFrame(draw)
      }
      draw()

      // recorder captures the mixed stream (voice + instrumental)
      const rec = new MediaRecorder(mixedDest.stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' })
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
      rec.start(100)
      recRef.current = rec

      startedAt.current = performance.now()
      setPhase('rec'); setDur(0); setLine(0)
      timer.current = setInterval(() => setDur(d => d + 1), 1000)

      // ── Lyric advancement ──
      // Use timedLyricsState (from lrclib fetch) OR song.timedLyrics OR plain fallback
      const activeTimed = timedLyricsState || (song.timedLyrics?.length > 0 ? song.timedLyrics : null)
      const plainLines = lyrics || (manual ? manual.split('\n').filter(Boolean) : null)

      if (activeTimed && activeTimed.length > 0) {
        // Sync by real elapsed time
        let idx = 0
        lyricT.current = setInterval(() => {
          const elapsed = (performance.now() - startedAt.current) / 1000
          let newIdx = 0
          for (let i = 0; i < activeTimed.length; i++) {
            if (activeTimed[i].time <= elapsed) newIdx = i
          }
          if (newIdx !== idx) { idx = newIdx; setLine(newIdx) }
        }, 100)
      } else if (plainLines?.length) {
        // Fallback: 3-second intervals
        let i = 0
        lyricT.current = setInterval(() => { i++; if (i < plainLines.length) setLine(i); else clearInterval(lyricT.current) }, 3000)
      }

    } catch { setErr('Microphone access denied. Please allow microphone in your browser.') }
  }

  const stopRec = async () => {
    clearInterval(timer.current); clearInterval(lyricT.current); cancelAnimationFrame(raf.current)
    instrRef.current?.pause(); setPhase('processing')
    const blob = await new Promise(res => {
      const r = recRef.current; if (!r) return res(null)
      r.onstop = () => res(new Blob(chunks.current, { type: 'audio/webm' }))
      r.stop()
    })
    stream.current?.getTracks().forEach(t => t.stop())
    ctx.current?.close().catch(() => { })
    const url = URL.createObjectURL(blob)
    const user = getUser()
    addFeed({ id: Date.now(), user: user?.name || 'Anonymous', uid: user?.uid || '', song: song.title, thumbnail: song.thumbnail || '', date: new Date().toLocaleString() })
    try {
      const form = new FormData(); form.append('voice', blob, 'rec.webm')
      const r = await axios.post(`${API}/analyze`, form, { timeout: 60000 })
      onDone({ ...r.data, songTitle: song.title, timedLyrics: song.timedLyrics || null, url })
    } catch {
      onDone({
        pitch_score: p, timing_score: t, emotion_score: e,
        rank: avg >= 85 ? 'Platinum' : avg >= 70 ? 'Gold' : avg >= 55 ? 'Silver' : 'Bronze',
        songTitle: song.title, timedLyrics: song.timedLyrics || null, url,
        videoId: song.videoId || null,
        instrumentalUrl: song.instrumentalUrl || null
      })
    }
  }

  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Build display lyrics array
  const activeTimed = timedLyricsState || (song.timedLyrics?.length > 0 ? song.timedLyrics : null)
  const al = activeTimed?.length
    ? activeTimed.map(l => l.text || l)
    : (lyrics || (manual ? manual.split('\n').filter(Boolean) : null))
  const win = al ? al.slice(Math.max(0, line - 1), line + 5) : []
  const ai = Math.min(line, 1)

  return (
    <div style={{ minHeight: '100vh', background: 'url(/studio_bg.png) center/cover fixed', position: 'relative' }}>
      {/* Light overlay to make cards pop brighter */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Earphone/Mic Tip Popup ── */}
        {showTip && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10,0,30,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: '32px 28px', maxWidth: 380, width: '100%',
              textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
              animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎧</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 12 }}>Before You Sing!</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 8 }}>🎤 <strong>Keep your mic close</strong> to your mouth</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 24 }}>🎧 <strong>Use wired earphones / headphones</strong> for the best experience and to avoid feedback</div>
              <button onClick={() => setShowTip(false)} style={{ width: '100%', padding: '14px', borderRadius: 50, border: 'none', background: 'var(--grad)', color: 'white', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,78,138,0.4)' }}>Got it, Let's Sing! 🎤</button>
            </div>
            <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', padding: '13px 18px',
          display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 50, border: 'none', background: 'var(--surface)', cursor: 'pointer', fontSize: 16 }}>←</button>
          {song.thumbnail && <img src={song.thumbnail} alt="" style={{ width: 42, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: 2 }}>NOW SINGING</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeHtml(song.title)}</div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

          {/* ── MONITOR CARD ── */}
          <div className={`card ${!showTip ? 'slide-up' : ''}`} style={{ padding: '16px 20px', marginBottom: 14, background: mon ? 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,1))' : 'white', border: mon ? '2px solid rgba(155,92,246,0.5)' : '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 26 }}>🎧</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Voice Monitoring & Mixing</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{mon ? 'Hear yourself clearly in earphones' : 'Toggle to enable monitoring and mixing'}</div>
              </div>
              <div className="toggle" style={{ background: mon ? 'var(--grad)' : '#D1D5DB' }} onClick={() => setMon(v => !v)}>
                <div className="toggle-knob" style={{ left: mon ? 23 : 3 }} />
              </div>
            </div>
            {mon && (
              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 30 }}>
                {/* Mon Volume */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Voice Vol</span><span>{Math.round(monVol * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={monVol} onChange={e => setMonVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--pink)', cursor: 'pointer' }} />
                </div>
                {/* Instr Volume */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Music Vol</span><span>{Math.round(instrVol * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={instrVol} onChange={e => setInstrVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)', cursor: 'pointer' }} />
                </div>
                {/* Reverb */}
                <button disabled={phase !== 'ready'} onClick={() => phase === 'ready' && setReverb(v => !v)} className="btn btn-soft" style={{ padding: '8px 20px', fontSize: 13, background: reverb ? 'var(--grad)' : 'var(--surface)', color: reverb ? 'white' : 'var(--text2)', border: reverb ? 'none' : '1px solid var(--border)', opacity: phase !== 'ready' ? 0.5 : 1 }}>✨ Reverb {reverb ? 'On' : 'Off'}</button>
              </div>
            )}
          </div>

          {/* ── VIDEO + LYRICS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
            <div className={`card ${!showTip ? 'slide-right' : ''}`} style={{ padding: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>🎵 Music</div>
              {song.videoId ? (
                <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <EmbedPlayer videoId={song.videoId} />
                </div>
              ) : song.instrumentalUrl ? (
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🎼</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Instrumental loaded</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Auto-plays when you record</div>
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🔇</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Search a YouTube song for music</div>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>💡 {song.instrumentalUrl ? 'Instrumental auto-mixes with your voice' : 'Music plays on record'}</div>
            </div>

            <div className={`card ${!showTip ? 'slide-left' : ''}`} style={{ padding: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>🎤 Lyrics</div>
                  {activeTimed?.length > 0 && <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, marginTop: 1 }}>⏱ Timed · {activeTimed.length} lines</div>}
                </div>
                <button onClick={() => setPaste(v => !v)} className="btn btn-soft" style={{ padding: '4px 10px', fontSize: 11 }}>{paste ? 'Hide' : '✏️ Paste'}</button>
              </div>
              {paste ? (
                <div>
                  <textarea value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste lyrics (one line per row)…" style={{ width: '100%', height: 145, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: 10, fontSize: 12, resize: 'none', fontFamily: "'Nunito',sans-serif", outline: 'none', lineHeight: 1.9 }} />
                  {manual && <button onClick={() => setPaste(false)} className="btn btn-grad" style={{ marginTop: 8, padding: '6px 14px', fontSize: 12 }}>✓ Use lyrics</button>}
                </div>
              ) : (
                <div style={{ minHeight: 120 }}>
                  {lLoad && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Fetching lyrics…</div>}
                  {lErr && !manual && <div style={{ textAlign: 'center', padding: '20px 0' }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><div style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.9 }}>Lyrics not found<br /><span style={{ fontSize: 11 }}>Try "Artist - Title" or ✏️ Paste manually</span></div></div>}
                  {al && !lLoad && win.map((l, i) => (
                    <div key={i} style={{ padding: '5px 10px 5px 12px', fontSize: i === ai ? 16 : 13, fontWeight: i === ai ? 900 : 700, color: i === ai ? 'var(--pink)' : 'var(--text3)', borderLeft: `3px solid ${i === ai ? 'var(--pink)' : 'transparent'}`, background: i === ai ? 'rgba(255,78,138,0.08)' : 'transparent', borderRadius: 6, transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)', lineHeight: 1.5, marginBottom: 2, transform: i === ai ? 'scale(1.03)' : 'scale(1)' }}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RECORDING CONTROLS ── */}
          <div className={`card ${!showTip ? 'slide-up' : ''}`} style={{ padding: '40px 20px 36px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.98)' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: 28, minHeight: 150 }}>
              {/* Left: 24-Segment LED Peak Meter (Vertical Alignment) */}
              <div style={{ gridColumn: '1', justifySelf: 'end', marginRight: 42, display: 'flex', flexDirection: 'column-reverse', gap: 2, height: 130 }}>
                {(() => {
                  const maxVol = bars.length > 0 ? Math.max(...bars) / 60 : 0;
                  return Array.from({ length: 24 }).map((_, i) => {
                    const t = i / 24;
                    const active = maxVol > t && phase === 'rec';
                    const color = i < 14 ? '#22C55E' : i < 20 ? '#EAB308' : '#EF4444'; // Green -> Yellow -> Red
                    return (
                      <div key={i} style={{
                        width: 14, height: 4, borderRadius: 1,
                        background: active ? color : 'var(--text3)',
                        opacity: active ? 1 : 0.25,
                        transition: 'background 0.05s, opacity 0.05s',
                        boxShadow: active ? `0 0 8px ${color}` : 'none'
                      }} />
                    )
                  })
                })()}
              </div>

              {/* Center: Record Button & Timer */}
              {phase !== 'processing' ? (
                <div style={{ gridColumn: '2', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Waveform overlapping top of button */}
                  <div style={{ position: 'absolute', top: -38, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 30 }}>
                    {bars.slice(0, 8).map((h, i) => (
                      <div key={i} style={{ height: Math.max(4, h / 2), width: 5, borderRadius: 3, background: phase === 'rec' ? `hsl(${300 + i * 2},75%,56%)` : 'transparent', transition: 'height 0.05s' }} />
                    ))}
                  </div>

                  <div className={!showTip ? 'pop-in-mic' : ''} style={{ position: 'relative', display: 'inline-block', marginBottom: 16, marginTop: 10 }}>
                    {phase === 'rec' && <div className="pulse-ring" style={{ inset: -20, opacity: 0.5 }} />}
                    <button onClick={phase === 'ready' ? startRec : stopRec} style={{ position: 'relative', zIndex: 1, width: 90, height: 90, borderRadius: '50%', border: 'none', background: phase === 'ready' ? 'var(--grad)' : 'linear-gradient(135deg,#FF4444,#CC0000)', cursor: 'pointer', fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: phase === 'ready' ? '0 10px 40px rgba(255,78,138,0.5)' : '0 10px 40px rgba(255,0,0,0.6)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform: phase === 'rec' ? 'scale(1.1)' : 'scale(1)' }}>
                      {phase === 'ready' ? '🎤' : '⏹'}
                    </button>
                  </div>

                  {phase === 'rec' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'absolute', bottom: -26 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)', animation: 'pulse 1s ease-out infinite' }} />
                      <span className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 18 }}>{fmt(dur)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ gridColumn: '2' }}>
                  <div className="spin" style={{ margin: '0 auto', width: 60, height: 60, borderWidth: 5 }} />
                </div>
              )}
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text2)' }}>
              {phase === 'ready' && 'Tap mic to start · Sing along!'}
              {phase === 'rec' && 'Recording · Tap ⏹ to finish'}
              {phase === 'processing' && 'Analysing your performance…'}
            </div>

            {err && <div style={{ marginTop: 14, background: '#FFF0F2', border: '1px solid #FBBFD0', borderRadius: 10, padding: '12px 16px', color: '#E0284A', fontSize: 13, fontWeight: 700 }}>⚠️ {err}</div>}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.2);opacity:0}}
        .wbar { transform-origin: bottom; }
      `}</style>
    </div>
  )
}

function EmbedPlayer({ videoId }) {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
      <iframe src={`https://www.youtube.com/embed/${videoId}?controls=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen />
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: 'white', textDecoration: 'none', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF0000', marginRight: 2 }} /> If blocked, open in YouTube
      </a>
    </div>
  )
}
