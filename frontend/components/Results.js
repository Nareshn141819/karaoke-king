"use client"
import { useState, useEffect } from 'react'
import { addCommunityFeed, addDraft, getUser } from '../lib/store'
import PerformanceCard from './PerformanceCard'

const RANKS = {
  Platinum: { color: '#7C3AED', bg: '#F5F0FF', border: '#C4B5FD', emoji: '💎', label: 'PLATINUM' },
  Gold: { color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', emoji: '🥇', label: 'GOLD' },
  Silver: { color: '#4B5563', bg: '#F9FAFB', border: '#9CA3AF', emoji: '🥈', label: 'SILVER' },
  Bronze: { color: '#92400E', bg: '#FEF3C7', border: '#D97706', emoji: '🥉', label: 'BRONZE' },
}

function Ring({ val, label, color, delay = 0 }) {
  const [v, setV] = useState(0)
  const r = 38, c = 2 * Math.PI * r
  useEffect(() => {
    const t = setTimeout(() => { let x = 0; const go = () => { x += 2; if (x < val) { setV(Math.round(x)); requestAnimationFrame(go) } else setV(val) }; requestAnimationFrame(go) }, delay)
    return () => clearTimeout(t)
  }, [val, delay])
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 6px' }}>
        <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
            style={{ transition: 'stroke-dashoffset 0.02s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, color }}>{v}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
    </div>
  )
}

// Convert blob URL → base64 data URL (returns null gracefully on failure)
async function toDataUrl(blobUrl) {
  try {
    const blob = await fetch(blobUrl).then(r => {
      if (!r.ok) throw new Error('fetch failed')
      return r.blob()
    })
    return new Promise((res) => {
      const rd = new FileReader()
      rd.onload = () => res(rd.result)
      rd.onerror = () => res(null)   // don't reject, just return null
      rd.readAsDataURL(blob)
    })
  } catch {
    return null   // audio unavailable — save metadata-only draft
  }
}

export default function Results({ score, song, onAgain, onNew }) {
  const rk = RANKS[score.rank] || RANKS.Bronze
  const avg = Math.round((score.pitch_score + score.timing_score + score.emotion_score) / 3)
  const [copied, setCopied] = useState(false)
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [drafted, setDrafted] = useState(false)
  const [actionErr, setActionErr] = useState('')

  const share = async () => {
    const txt = `🎤 I sang "${score.songTitle || song?.title}" on Karaoke King!\n${rk.emoji} ${score.rank} · ${avg}/100\nPitch ${score.pitch_score} · Timing ${score.timing_score} · Emotion ${score.emotion_score}`
    try {
      if (navigator.share) await navigator.share({ title: 'Karaoke King', text: txt })
      else { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    } catch { }
  }

  const buildItem = async () => {
    const user = getUser()
    const audioDataUrl = score.url ? await toDataUrl(score.url) : null
    return {
      id: Date.now(),
      user: user?.name || 'Anonymous',
      uid: user?.uid || '',
      song: score.songTitle || song?.title || 'Unknown',
      rank: score.rank,
      avgScore: avg,
      pitchScore: score.pitch_score,
      timingScore: score.timing_score,
      emotionScore: score.emotion_score,
      timedLyrics: score.timedLyrics || null,
      audioDataUrl,
      videoId: score.videoId || null,
      instrumentalUrl: score.instrumentalUrl || null,
      date: new Date().toLocaleString(),
    }
  }

  const postToCommunity = async () => {
    if (posted || posting) return
    if (!score.url) { setActionErr('No recording available.'); return }
    setPosting(true); setActionErr('')
    try {
      await addCommunityFeed(await buildItem())
      setPosted(true)
    } catch { setActionErr('Could not post — please try again.') }
    setPosting(false)
  }

  const saveDraft = async () => {
    if (drafted || drafting) return
    setDrafting(true); setActionErr('')
    try {
      const item = await buildItem()
      await addDraft(item)
      setDrafted(true)
    } catch (e) {
      setActionErr('Could not save draft — storage may be full.')
    }
    setDrafting(false)
  }

  // Build a preview item for PerformanceCard
  const previewItem = score.url ? {
    id: 'preview',
    user: getUser()?.name || 'Me',
    uid: getUser()?.uid || '',
    song: score.songTitle || song?.title || '',
    rank: score.rank,
    avgScore: avg,
    pitchScore: score.pitch_score,
    timingScore: score.timing_score,
    emotionScore: score.emotion_score,
    timedLyrics: score.timedLyrics || null,
    audioDataUrl: score.url,  // blob URL works for current session
    date: new Date().toLocaleString(),
  } : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Gradient header */}
      <div style={{ background: 'var(--grad)', padding: '36px 20px 32px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>{rk.emoji}</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: 1.5, marginBottom: 4 }}>{rk.label}</div>
        <div style={{ opacity: .85, fontSize: 14, marginBottom: 18, maxWidth: 320, margin: '0 auto 18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {score.songTitle || song?.title}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: 'rgba(255,255,255,0.22)', borderRadius: 50, padding: '10px 28px' }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 48 }}>{avg}</span>
          <span style={{ fontSize: 16, opacity: .8 }}>/100</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px' }}>

        {/* Score rings */}
        <div className="card" style={{ padding: '24px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' }}>Score Breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            <Ring val={score.pitch_score} label="Pitch" color="#FF4E8A" delay={100} />
            <Ring val={score.timing_score} label="Timing" color="#9B5CF6" delay={400} />
            <Ring val={score.emotion_score} label="Emotion" color="#0EA5E9" delay={700} />
          </div>
        </div>

        {/* Feedback */}
        <div style={{
          padding: '16px 18px', marginBottom: 16, borderRadius: 16,
          background: rk.bg, border: `1px solid ${rk.border}`, borderLeft: `4px solid ${rk.color}`
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: rk.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Feedback</div>
          <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.75 }}>
            {avg >= 85 ? '🌟 Outstanding! Your pitch and emotion are exceptional. Main stage material!'
              : avg >= 70 ? '🎉 Great performance! Strong timing. Work on those high notes for Platinum!'
                : avg >= 55 ? '👏 Good effort! Emotion comes through. Keep practicing pitch matching.'
                  : '💪 Nice start! Focus on matching the melody and staying on beat.'}
          </p>
        </div>

        {/* ── Your Recording — Beautiful PerformanceCard ── */}
        {previewItem && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              🎧 Your Recording
            </div>
            <PerformanceCard item={previewItem} currentUser={null} onDelete={null} />
          </div>
        )}

        {/* Action buttons */}
        {score.url && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {/* Share / Download */}
              <a href={score.url} download={`karaoke-${Date.now()}.webm`} className="btn btn-soft"
                style={{ flex: 1, padding: '10px', fontSize: 13, textDecoration: 'none', textAlign: 'center', minWidth: 100 }}>⬇️ Download</a>
              <button onClick={share} className="btn btn-soft" style={{ flex: 1, padding: '10px', fontSize: 13, minWidth: 100 }}>
                {copied ? '✓ Copied!' : '📤 Share'}
              </button>
            </div>

            {/* Post + Draft */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={postToCommunity}
                disabled={posting || posted}
                className={posted ? 'btn btn-soft' : 'btn btn-grad'}
                style={{
                  flex: 1, padding: '12px', fontSize: 14, minWidth: 140,
                  opacity: posting ? 0.7 : 1,
                  background: posted ? 'rgba(16,185,129,0.12)' : undefined,
                  color: posted ? '#059669' : undefined,
                  border: posted ? '1px solid rgba(16,185,129,0.35)' : undefined,
                }}>
                {posting ? '⏳ Posting…' : posted ? '✅ Posted!' : '🌟 Post to Community'}
              </button>
              <button
                onClick={saveDraft}
                disabled={drafting || drafted}
                className="btn btn-soft"
                style={{
                  flex: 1, padding: '12px', fontSize: 14, minWidth: 120,
                  opacity: drafting ? 0.7 : 1,
                  background: drafted ? 'rgba(99,102,241,0.1)' : undefined,
                  color: drafted ? '#4F46E5' : undefined,
                  border: drafted ? '1px solid rgba(99,102,241,0.35)' : undefined,
                }}>
                {drafting ? '⏳ Saving…' : drafted ? '✅ Saved!' : '💾 Save as Draft'}
              </button>
            </div>

            {/* Status messages */}
            {posted && (
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                Visible in <a href="/feed" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>Community Feed</a>
              </p>
            )}
            {drafted && (
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                Saved to <a href="/profile" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>Your Drafts</a>
              </p>
            )}
            {actionErr && <p style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#E0284A' }}>⚠️ {actionErr}</p>}
          </div>
        )}

        {/* Navigation actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onAgain} className="btn btn-grad" style={{ padding: '14px', fontSize: 15 }}>🎤 Sing Again</button>
          <button onClick={onNew} className="btn btn-out" style={{ padding: '13px', fontSize: 15 }}>🎵 New Song</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/feed" className="btn btn-soft" style={{ flex: 1, padding: '11px', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>📻 Feed</a>
            <a href="/leaderboard" className="btn btn-soft" style={{ flex: 1, padding: '11px', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>🏆 Ranks</a>
          </div>
        </div>
      </div>
    </div>
  )
}
