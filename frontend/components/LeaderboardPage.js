"use client"
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { getCommunityFeed, getUser } from '../lib/store'

const RS = {
  Platinum: { c: '#7C3AED', bg: '#F5F0FF', bd: '#C4B5FD', e: '💎' },
  Gold:     { c: '#B45309', bg: '#FFFBEB', bd: '#FCD34D', e: '🥇' },
  Silver:   { c: '#4B5563', bg: '#F9FAFB', bd: '#9CA3AF', e: '🥈' },
  Bronze:   { c: '#92400E', bg: '#FEF3C7', bd: '#D97706', e: '🥉' },
}
const MEDALS = ['🥇', '🥈', '🥉']

function getRank(avg) {
  return avg >= 85 ? 'Platinum' : avg >= 70 ? 'Gold' : avg >= 55 ? 'Silver' : 'Bronze'
}

export default function LeaderboardPage() {
  const [f, setF]           = useState('all')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Require sign-in
    if (!getUser()) { window.location.href = '/login'; return }

    getCommunityFeed()
      .then(feed => {
        // Aggregate: keep each user's best score
        const map = {}
        feed.forEach(item => {
          const score = Number(item.avgScore || item.avg_score || 0)
          if (!score) return
          const key = item.uid || item.user || 'anon'
          if (!map[key] || score > map[key].avg) {
            map[key] = {
              id:   key,
              uid:  item.user || item.uid || 'Anonymous',
              rank: item.rank || getRank(score),
              avg:  score,
              song: item.song || '',
              p:    Number(item.pitchScore   || item.pitch_score   || score),
              t:    Number(item.timingScore  || item.timing_score  || score),
              e:    Number(item.emotionScore || item.emotion_score || score),
            }
          }
        })
        const sorted = Object.values(map).sort((a, b) => b.avg - a.avg)
        setEntries(sorted)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const list = f === 'all' ? entries : entries.filter(x => x.rank === f)

  /* ── Loading ── */
  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
        <div className="spin" style={{ width: 44, height: 44, borderWidth: 4 }} />
        <div style={{ color: 'var(--text3)', fontWeight: 700, fontSize: 14 }}>Loading leaderboard…</div>
      </div>
      <BottomNav />
    </div>
  )

  /* ── Empty state ── */
  if (entries.length === 0) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Top voices on Karaoke King</p>
        </div>
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎤</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 10 }}>
            No scores yet!
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
            Be the first to record a song and post it<br />to the community. Your score will appear here!
          </p>
          <a href="/" className="btn btn-grad" style={{ padding: '13px 30px', fontSize: 14, textDecoration: 'none', borderRadius: 50 }}>
            🎵 Start Singing
          </a>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  /* ── Main leaderboard ── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Top voices on Karaoke King</p>
        </div>

        {/* Podium — only shown when 3 or more users */}
        {entries.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
            {[1, 0, 2].map(i => {
              const it = entries[i]
              if (!it) return null
              const r   = RS[it.rank] || RS.Bronze
              const top = i === 0
              return (
                <div key={i} className="card" style={{
                  padding: '16px 12px', textAlign: 'center',
                  background: top ? 'var(--grad)' : 'white',
                  transform: top ? 'translateY(-10px)' : 'none',
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{MEDALS[i]}</div>
                  <div className="av" style={{
                    width: 42, height: 42, fontSize: 15, margin: '0 auto 8px',
                    background: top ? 'rgba(255,255,255,0.25)' : 'var(--grad)',
                  }}>
                    {(it.uid || '?')[0].toUpperCase()}
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 13,
                    color: top ? 'white' : 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{it.uid}</div>
                  <div className={top ? '' : 'grad-text'} style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 26,
                    color: top ? 'white' : undefined, marginTop: 4,
                  }}>{it.avg}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rank filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['all', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(x => (
            <button key={x} onClick={() => setF(x)}
              className={`btn ${f === x ? 'btn-grad' : 'btn-soft'}`}
              style={{ padding: '7px 18px', fontSize: 13 }}>
              {x === 'all' ? 'All' : x}
            </button>
          ))}
        </div>

        {/* Ranked list */}
        {list.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
            No {f} performances yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((it, i) => {
              const r = RS[it.rank] || RS.Bronze
              return (
                <div key={it.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 30, textAlign: 'center', flexShrink: 0 }}>
                    {i < 3 && f === 'all'
                      ? <span style={{ fontSize: 20 }}>{MEDALS[i]}</span>
                      : <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--text3)' }}>#{i + 1}</span>}
                  </div>
                  <div className="av" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>
                    {(it.uid || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{it.uid}</span>
                      <span className="chip" style={{ fontSize: 10, color: r.c, background: r.bg, border: `1px solid ${r.bd}` }}>
                        {r.e} {it.rank}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.song}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 26 }}>{it.avg}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>pts</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
