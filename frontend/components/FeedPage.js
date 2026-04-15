"use client"
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import PerformanceCard from './PerformanceCard'
import { getUser, getCommunityFeed, delCommunityFeed } from '../lib/store'
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

// Follow helpers
const getFollowing = () => { try { return JSON.parse(localStorage.getItem('kk_following') || '[]') } catch { return [] } }
const toggleFollow = (uid) => {
  const list = getFollowing()
  const idx = list.indexOf(uid)
  if (idx >= 0) list.splice(idx, 1); else list.push(uid)
  localStorage.setItem('kk_following', JSON.stringify(list))
  return list
}

export default function FeedPage() {
  const [songs, setSongs] = useState([])
  const [perfs, setPerfs] = useState([])
  const [tab, setTab] = useState('perfs')
  const [user, setUser] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [songSearch, setSongSearch] = useState('')  // search query for songs tab
  const [following, setFollowing] = useState(getFollowing())
  const [feedLoading, setFeedLoading] = useState(true)
  const [songsLoading, setSongsLoading] = useState(true)

  useEffect(() => {
    const u = getUser()
    setUser(u)
    getCommunityFeed().then(feed => setPerfs(feed)).finally(() => setFeedLoading(false))
    fetch(`${API}/api/songs`)
      .then(r => r.ok ? r.json() : { songs: [] })
      .then(d => setSongs(d.songs || []))
      .catch(() => { })
      .finally(() => setSongsLoading(false))
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
          feedLoading ? (
            /* Skeleton for performances */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 6 }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: 160, borderRadius: 12, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 11, width: '80%', borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : perfs.length === 0 ? (
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
          songsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0,1,2,3].map(i => (
                <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 13, width: '60%', borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 6 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 50 }} />
                    <div className="skeleton" style={{ width: 36, height: 32, borderRadius: 50 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🎵</div>
              <p style={{ color: 'var(--text2)', marginBottom: 16 }}>No songs uploaded yet</p>
              {user && <a href="/upload" className="btn btn-grad" style={{ padding: '11px 24px', fontSize: 14, textDecoration: 'none' }}>+ Upload Song</a>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Search bar */}
              <div style={{ position: 'relative' }}>
                <input
                  value={songSearch}
                  onChange={e => setSongSearch(e.target.value)}
                  placeholder="🔍 Search songs by title or artist…"
                  className="inp"
                  style={{ padding: '11px 16px 11px 42px', borderRadius: 50, fontSize: 13, width: '100%' }}
                />
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
                {songSearch && (
                  <button onClick={() => setSongSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)' }}>×</button>
                )}
              </div>

              {/* Filtered list */}
              {(() => {
                const q = songSearch.toLowerCase()
                const filtered = q ? songs.filter(s =>
                  (s.title || '').toLowerCase().includes(q) ||
                  (s.artist || '').toLowerCase().includes(q)
                ) : songs
                return filtered.length === 0 ? (
                  <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No songs match “{songSearch}”
                  </div>
                ) : filtered.map(s => {
                  const mine = user && user.uid === s.uploaderUid
                  const isFollowing = following.includes(s.uploaderUid)
                  return (
                    <div key={s.id} className="card lift-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {s.coverUrl ? <img src={`${API}${s.coverUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.artist || 'Unknown'} · by {s.uploaderName || '?'}</div>
                        {s.timedLyrics?.length > 0 && <div style={{ fontSize: 10, color: 'var(--purple)', marginTop: 2, fontWeight: 700 }}>📝 {s.timedLyrics.length} timed lyric lines</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Follow button — not shown for own songs */}
                        {!mine && s.uploaderUid && (
                          <button
                            onClick={() => setFollowing(toggleFollow(s.uploaderUid))}
                            className={`follow-btn ${isFollowing ? 'following' : ''}`}
                          >
                            {isFollowing ? '✔ Following' : '+ Follow'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const songData = {
                              title: s.title, videoId: s.videoId || '',
                              thumbnail: s.coverUrl ? `${API}${s.coverUrl}` : '',
                              instrumentalUrl: s.audioFile ? `${API}/uploads/${s.audioFile}` : '',
                              lyrics: s.lyrics || '', timedLyrics: s.timedLyrics || null,
                            }
                            localStorage.setItem('kk_pending_song', JSON.stringify(songData))
                            window.location.href = '/'
                          }}
                          className="btn btn-grad" style={{ padding: '7px 14px', fontSize: 12 }}
                        >▶ Sing</button>
                        {mine && (
                          <button onClick={() => removeSong(s.id)} disabled={deleting === s.id} className="btn btn-red" style={{ padding: '7px 12px', fontSize: 12, opacity: deleting === s.id ? 0.6 : 1 }}>
                            {deleting === s.id ? '…' : '🗑'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )
        )}
      </div>
      <BottomNav />
    </div>
  )
}
