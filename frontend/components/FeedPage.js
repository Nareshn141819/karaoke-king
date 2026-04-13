"use client"
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import PerformanceCard from './PerformanceCard'
import { getUser, getCommunityFeed, delCommunityFeed } from '../lib/store'
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

export default function FeedPage() {
  const [songs, setSongs] = useState([])
  const [perfs, setPerfs] = useState([])
  const [tab, setTab] = useState('perfs')
  const [user, setUser] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const u = getUser()
    setUser(u)
    getCommunityFeed().then(feed => setPerfs(feed))
    fetch(`${API}/api/songs`)
      .then(r => r.ok ? r.json() : { songs: [] })
      .then(d => setSongs(d.songs || []))
      .catch(() => { })
  }, [])

  const removePerf = async (id, docId) => {
    if (!confirm('Remove this performance from the community feed?')) return
    await delCommunityFeed(id, docId)
    const feed = await getCommunityFeed()
    setPerfs(feed)
  }

  const removeSong = async (id) => {
    if (!confirm('Permanently delete this song?')) return
    setDeleting(id)
    try {
      await fetch(`${API}/api/songs/${id}`, { method: 'DELETE', headers: { 'x-user-uid': user?.uid || '' } })
      setSongs(s => s.filter(x => x.id !== id))
    } catch { }
    setDeleting(null)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>
        <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 20 }}>Community</h1>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${tab === 'perfs' ? 'on' : ''}`} onClick={() => setTab('perfs')}>
            🎤 Performances
            {perfs.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(255,78,138,0.15)', color: 'var(--pink)', borderRadius: 50, padding: '1px 7px', fontWeight: 800 }}>{perfs.length}</span>}
          </button>
          <button className={`tab ${tab === 'songs' ? 'on' : ''}`} onClick={() => setTab('songs')}>
            🎵 Songs
            {songs.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(155,92,246,0.15)', color: 'var(--purple)', borderRadius: 50, padding: '1px 7px', fontWeight: 800 }}>{songs.length}</span>}
          </button>
        </div>

        {/* ── PERFORMANCES TAB ── */}
        {tab === 'perfs' && (
          perfs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🎤</div>
              <p style={{ color: 'var(--text2)', marginBottom: 8, fontWeight: 700, fontSize: 16 }}>No performances yet!</p>
              <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Record a song and tap "Post to Community" on the results screen.</p>
              <a href="/" className="btn btn-grad" style={{ padding: '11px 24px', fontSize: 14, textDecoration: 'none' }}>Start Singing</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {perfs.map(it => (
                <PerformanceCard
                  key={it.id}
                  item={it}
                  currentUser={user}
                  onDelete={() => removePerf(it.id, it.docId)}
                />
              ))}
            </div>
          )
        )}

        {/* ── SONGS TAB ── */}
        {tab === 'songs' && (
          songs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🎵</div>
              <p style={{ color: 'var(--text2)', marginBottom: 16 }}>No songs uploaded yet</p>
              {user && <a href="/upload" className="btn btn-grad" style={{ padding: '11px 24px', fontSize: 14, textDecoration: 'none' }}>+ Upload Song</a>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {songs.map(s => {
                const mine = user && user.uid === s.uploaderUid
                return (
                  <div key={s.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {s.coverUrl ? <img src={`${API}${s.coverUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.artist || 'Unknown'} · by {s.uploaderName || '?'}</div>
                      {s.timedLyrics?.length > 0 && <div style={{ fontSize: 10, color: 'var(--purple)', marginTop: 2, fontWeight: 700 }}>📝 {s.timedLyrics.length} timed lyric lines</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      <a href="/" className="btn btn-grad" style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}>▶ Sing</a>
                      {mine && (
                        <button onClick={() => removeSong(s.id)} disabled={deleting === s.id} className="btn btn-red" style={{ padding: '7px 12px', fontSize: 12, opacity: deleting === s.id ? 0.6 : 1 }}>
                          {deleting === s.id ? '…' : '🗑'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
      <BottomNav />
    </div>
  )
}
