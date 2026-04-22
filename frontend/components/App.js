"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar, { NavbarSkeleton } from './Navbar'
import BottomNav from './BottomNav'
import SearchBar from './SearchBar'
import Studio from './Studio'
import Results from './Results'
import { getUser } from '../lib/store'

// Set NEXT_PUBLIC_API in Vercel env vars to your backend URL (e.g. Railway)
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') { try { const c = localStorage.getItem('kk_app_state'); if (c) return JSON.parse(c).view || 'home' } catch (e) { } }
    return 'home'
  })
  const [song, setSong] = useState(() => {
    if (typeof window !== 'undefined') { try { const c = localStorage.getItem('kk_app_state'); if (c) return JSON.parse(c).song || null } catch (e) { } }
    return null
  })
  const [score, setScore] = useState(() => {
    if (typeof window !== 'undefined') { try { const c = localStorage.getItem('kk_app_state'); if (c) return JSON.parse(c).score || null } catch (e) { } }
    return null
  })
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(true)

  // Quick-search picker state
  const [qsArtist, setQsArtist] = useState(null)   // currently selected quick-search artist
  const [qsResults, setQsResults] = useState([])
  const [qsLoading, setQsLoading] = useState(false)

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kk_app_state', JSON.stringify({ view, song, score }))
      } catch (e) { }
    }
  }, [view, song, score])

  // Auto-navigate to studio if a song was queued from another page (e.g. FeedPage)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const pending = localStorage.getItem('kk_pending_song')
    if (pending) {
      localStorage.removeItem('kk_pending_song')
      try {
        const s = JSON.parse(pending)
        setSong(s)
        setView('studio')
      } catch { }
    }
  }, [])

  useEffect(() => {
    fetch(`${API}/api/songs`)
      .then(r => r.ok ? r.json() : { songs: [] })
      .then(d => setSongs(d.songs || []))
      .catch(() => setSongs([]))
      .finally(() => setSongsLoading(false))
  }, [])

  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const goSing = (s) => {
    // Require sign-in to sing
    if (typeof window !== 'undefined') {
      const u = getUser()
      if (!u) { window.location.href = '/login'; return }
    }
    setSong(s); setView('studio'); setQsArtist(null); setQsResults([])
  }

  const openQuickSearch = async (artist) => {
    if (qsArtist === artist) { setQsArtist(null); setQsResults([]); return }
    setQsArtist(artist)
    setQsResults([])
    setQsLoading(true)
    try {
      const r = await fetch(`${API}/api/search?q=${encodeURIComponent(artist)}`)
      const d = r.ok ? await r.json() : {}
      setQsResults(d.items || [])
    } catch { setQsResults([]) }
    finally { setQsLoading(false) }
  }

  if (view === 'studio') return (
    <Studio song={song} onDone={s => { setScore(s); setView('results') }} onBack={() => setView('home')} />
  )
  if (view === 'results') return (
    <Results score={score} song={song} onAgain={() => setView('studio')} onNew={() => { setSong(null); setScore(null); setView('home') }} />
  )

  // ── Full skeleton page while initial data loads ──
  if (songsLoading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NavbarSkeleton />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 32px)' }}>

        {/* Skeleton Hero */}
        <div className="skeleton" style={{ borderRadius: 24, height: 190, marginBottom: 28 }} />

        {/* Skeleton Songs section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 170, height: 22, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 56, height: 16, borderRadius: 6 }} />
        </div>

        {/* Skeleton Song card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 14, marginBottom: 28 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--sh)' }}>
              <div className="skeleton" style={{ height: 96 }} />
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '85%' }} />
                <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '55%' }} />
                <div className="skeleton" style={{ height: 28, borderRadius: 50, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Quick Search card */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6, marginBottom: 14 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: [80, 100, 70, 90, 110, 75, 95, 85][i], height: 32, borderRadius: 50 }} />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 32px)' }}>

        {/* Hero — overflow: visible so dropdown isn't clipped */}
        <div style={{
          borderRadius: 24, background: 'var(--grad)',
          padding: '28px 24px 32px', marginBottom: 28,
          position: 'relative', overflow: 'visible',
        }}>
          {/* decorative blobs */}
          <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 110, opacity: 0.08, transform: 'rotate(20deg)', pointerEvents: 'none', userSelect: 'none' }}>🎤</div>
          <div style={{ position: 'absolute', bottom: -10, left: 20, fontSize: 70, opacity: 0.07, pointerEvents: 'none', userSelect: 'none' }}>🎵</div>

          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Find & Sing
          </div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 'clamp(22px,5vw,34px)', color: 'white', lineHeight: 1.15, marginBottom: 22 }}>
            Your Stage.<br />Your Voice. 🎤
          </h1>
          <SearchBar onSelect={goSing} />
        </div>

        {/* Community Songs */}
        {songs.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>
                🎵 Community Songs
              </h2>
              <Link href="/feed?tab=songs" style={{ fontSize: 13, fontWeight: 800, color: 'var(--pink)', textDecoration: 'none' }}>See all →</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 14 }}>
              {songs.slice(0, 8).map(s => (
                <SongCard key={s.id} song={s} onSing={() => goSing({
                  title: s.title,
                  videoId: s.videoId || '',
                  thumbnail: s.coverUrl ? `${API}${s.coverUrl}` : '',
                  instrumentalUrl: s.audioFile ? `${API}/uploads/${s.audioFile}` : '',
                  lyrics: s.lyrics || '',
                  timedLyrics: s.timedLyrics || null,
                })} />
              ))}
            </div>
          </section>
        )}

        {/* Quick search pills */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚡ Quick Search
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Arijit Singh', 'Taylor Swift', 'Shreya Ghoshal', 'Ed Sheeran', 'Sanjith Hegde', 'Kishore Kumar', 'Pritam', 'AR Rahman', 'Lata Mangeshkar', 'Sonu Nigam', 'Armaan Malik', 'SP Balasubramanya', 'Rajesh Krishnan', 'Vijay Prakash'].map(q => (
              <button
                key={q}
                onClick={() => openQuickSearch(q)}
                style={{
                  padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                  background: qsArtist === q ? 'var(--grad)' : 'var(--surface)',
                  border: qsArtist === q ? 'none' : '1px solid var(--border)',
                  color: qsArtist === q ? 'white' : 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (qsArtist !== q) { e.currentTarget.style.background = 'var(--grad)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = 'none' } }}
                onMouseLeave={e => { if (qsArtist !== q) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.border = '1px solid var(--border)' } }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Inline song picker */}
          {qsArtist && (
            <QuickSearchPicker
              artist={qsArtist}
              results={qsResults}
              loading={qsLoading}
              onPick={goSing}
              onClose={() => { setQsArtist(null); setQsResults([]) }}
            />
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}

function QuickSearchPicker({ artist, results, loading, onPick, onClose }) {
  return (
    <div style={{
      marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>
          🎶 Songs by {artist}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--text3)', lineHeight: 1, padding: '2px 6px'
          }}
        >×</button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--pink)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
            Searching YouTube…
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '22px 0', color: 'var(--text3)', fontSize: 13 }}>
          No results found. Try searching manually above.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => onPick({
                title: item.snippet?.title || artist,
                videoId: item.id?.videoId || '',
                thumbnail: item.snippet?.thumbnails?.default?.url || ''
              })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 14,
                background: 'var(--surface)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(255,78,138,0.06),rgba(155,92,246,0.06))'; e.currentTarget.style.borderColor = 'rgba(155,92,246,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {item.snippet?.thumbnails?.default?.url ? (
                <img src={item.snippet.thumbnails.default.url} alt=""
                  style={{ width: 56, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 40, borderRadius: 8, background: '#F0EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎵</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.snippet?.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {item.snippet?.channelTitle}
                </div>
              </div>
              <div style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 50, fontSize: 12,
                fontWeight: 800, background: 'var(--grad)', color: 'white',
                boxShadow: '0 2px 8px rgba(255,78,138,0.3)'
              }}>
                ▶ Sing
              </div>
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function SongCard({ song, onSing }) {
  return (
    <div
      className="card song-card"
      onClick={onSing}
      style={{ overflow: 'hidden', cursor: 'pointer' }}
    >
      <div style={{
        height: 96, background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, position: 'relative', overflow: 'hidden'
      }}>
        {song.coverUrl
          ? <img src={`${API}${song.coverUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>🎵</span>
        }
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }}>▶</div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{song.artist || 'Unknown'}</div>
        {song.genre && (
          <div style={{
            display: 'inline-block', marginTop: 6,
            padding: '2px 10px', borderRadius: 50, fontSize: 10, fontWeight: 800,
            background: 'var(--surface)', color: 'var(--purple)', border: '1px solid var(--border)'
          }}>{song.genre}</div>
        )}
      </div>
    </div>
  )
}
