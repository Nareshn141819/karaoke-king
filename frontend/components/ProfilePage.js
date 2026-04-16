"use client"
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import PerformanceCard from './PerformanceCard'
import { getUser, setUser as saveUser, getCommunityFeed, delCommunityFeed, addCommunityFeed, getDrafts, delDraft, logout, fbUpdateName, fbUpdatePassword, getProfile, upsertProfile, uploadAvatar } from '../lib/store'

// Generic person SVG avatar
const PersonAvatar = ({ size = 80, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', ...style }}>
    <circle cx="40" cy="40" r="40" fill="url(#av_grad)" />
    <circle cx="40" cy="30" r="13" fill="rgba(255,255,255,0.85)" />
    <ellipse cx="40" cy="62" rx="20" ry="13" fill="rgba(255,255,255,0.85)" />
    <defs>
      <linearGradient id="av_grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4E8A" />
        <stop offset="1" stopColor="#9B5CF6" />
      </linearGradient>
    </defs>
  </svg>
)
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

// SVG icons
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

// Follow helpers (localStorage-based)
const getFollowing = () => { try { return JSON.parse(localStorage.getItem('kk_following') || '[]') } catch { return [] } }
const toggleFollow = (uid) => {
  const list = getFollowing()
  const idx = list.indexOf(uid)
  if (idx >= 0) list.splice(idx, 1); else list.push(uid)
  localStorage.setItem('kk_following', JSON.stringify(list))
  return list
}

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [songs, setSongs] = useState([])
  const [perfs, setPerfs] = useState([])
  const [drafts, setDrafts] = useState([])
  const [tab, setTab] = useState('songs')
  const [loading, setLoading] = useState(true)
  const [postingDraft, setPostingDraft] = useState(null)
  const [pageReady, setPageReady] = useState(false)  // true once user is resolved

  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPass, setNewPass] = useState('')
  const [sErr, setSErr] = useState('')
  const [sMsg, setSMsg] = useState('')
  const [sLoad, setSLoad] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [following, setFollowing] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
    setNewName(u.name || '')
    setAvatarUrl(u.photoUrl || null)
    setFollowing(getFollowing())
    setPageReady(true)  // user is resolved — show page skeleton

    // Fetch Firestore profile
    getProfile(u.uid).then(profile => {
      if (profile?.photoUrl) {
        setAvatarUrl(profile.photoUrl)
        saveUser({ ...u, photoUrl: profile.photoUrl })
      }
      // Followers count from Firestore
      if (profile?.followers) setFollowersCount(profile.followers.length)
      setProfileLoading(false)
    }).catch(() => setProfileLoading(false))

    getCommunityFeed().then(all => {
      setPerfs(all.filter(p => p.uid === u.uid))
    })
    getDrafts(u.uid).then(d => setDrafts(d))
    fetch(`${API}/api/songs?uid=${u.uid}`)
      .then(r => r.ok ? r.json() : { songs: [] })
      .then(d => setSongs(d.songs || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const deleteSong = async (id) => {
    if (!confirm('Delete this song?')) return
    try {
      await fetch(`${API}/api/songs/${id}`, { method: 'DELETE', headers: { 'x-user-uid': user?.uid || '' } })
      setSongs(s => s.filter(x => x.id !== id))
    } catch { }
  }

  const removePerf = async (id, docId) => {
    await delCommunityFeed(id, docId)
    const all = await getCommunityFeed()
    setPerfs(all.filter(p => p.uid === user?.uid))
  }

  const removeDraft = async (id, docId) => {
    await delDraft(id, docId)
    const d = await getDrafts(user?.uid)
    setDrafts(d)
  }

  const postDraft = async (draft) => {
    if (!confirm('Post this draft to the Community Feed?')) return
    setPostingDraft(draft.id)
    try {
      const { isDraft, docId, ...item } = draft
      await addCommunityFeed({ ...item, id: Date.now(), date: new Date().toLocaleString() })
      // Keeping in drafts as requested by user
    } catch { }
    setPostingDraft(null)
  }

  const signOut = () => { logout(); window.location.href = '/' }

  // Profile picture handler — uploads to Firebase Storage
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadErr('Please select a valid image file (JPG, PNG, WEBP, etc.)')
      return
    }
    // Validate file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image is too large. Please use an image under 5 MB.')
      return
    }
    setUploadErr('')
    setAvatarUploading(true)
    try {
      const url = await uploadAvatar(user.uid, file)
      if (url) {
        setAvatarUrl(url)
        saveUser({ ...user, photoUrl: url })
        await upsertProfile(user.uid, {
          name: user.name,
          email: user.email,
          photoUrl: url,
        })
      } else {
        setUploadErr('Upload failed. Please try again.')
      }
    } catch (err) {
      console.warn('Avatar upload error:', err)
      setUploadErr('Upload failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setAvatarUploading(false)
      // Reset file input so the same file can be re-selected
      e.target.value = ''
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.name) return
    setSLoad(true); setSErr(''); setSMsg('')
    try {
      await fbUpdateName(newName.trim())
      setSMsg('Stage name updated successfully!')
      setUser({ ...user, name: newName.trim() })
    } catch (e) { setSErr(e.message) }
    finally { setSLoad(false) }
  }

  const handleUpdatePass = async () => {
    if (newPass.length < 6) return setSErr('Password must be at least 6 characters.')
    setSLoad(true); setSErr(''); setSMsg('')
    try {
      await fbUpdatePassword(newPass)
      setSMsg('Password updated securely!')
      setNewPass('')
    } catch (e) { setSErr(e.message) }
    finally { setSLoad(false) }
  }

  // Show skeleton only while user session is being resolved (brief flash)
  if (!pageReady) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>
        {/* Skeleton hero card */}
        <div className="skeleton" style={{ borderRadius: 24, height: 280, marginBottom: 20 }} />
        {/* Skeleton tabs */}
        <div className="skeleton" style={{ borderRadius: 12, height: 44, marginBottom: 20 }} />
        {/* Skeleton list items */}
        {[0,1,2].map(i => (
          <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )

  const init = (user.name || 'U').slice(0, 2).toUpperCase()
  const followingCount = following.length

  // Instagram-style stat items
  const statItems = [
    { label: 'Songs',     value: songs.length },
    { label: 'Followers', value: followersCount },
    { label: 'Following', value: followingCount },
    { label: 'Perfs',     value: perfs.length },
    { label: 'Drafts',    value: drafts.length },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>

        {/* Profile hero */}
        <div style={{ borderRadius: 24, background: 'var(--grad)', padding: '32px 24px 28px', textAlign: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 100, opacity: 0.08, pointerEvents: 'none' }}>👤</div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
            title="Settings"
          >
            ⚙️
          </button>

          {/* Clickable avatar — tap to upload photo */}
          <label className="av-upload" style={{ margin: '0 auto 14px', display: 'block', width: 80, height: 80 }}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            {avatarUploading ? (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spin" style={{ width: 28, height: 28, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)' }}
                onError={() => setAvatarUrl(null)} /* if image fails to load, fall back to icon */
              />
            ) : (
              <PersonAvatar size={80} style={{ border: '3px solid rgba(255,255,255,0.5)', boxSizing: 'border-box' }} />
            )}
            {!avatarUploading && <div className="av-overlay">📷</div>}
          </label>
          {uploadErr && (
            <div style={{ background: 'rgba(255,255,255,0.9)', color: '#E0284A', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, marginBottom: 10, maxWidth: 280, margin: '0 auto 10px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
              ⚠️ {uploadErr}
            </div>
          )}
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 22, color: 'white', marginBottom: 4 }}>{user.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 20 }}>{user.email}</p>

          {!showSettings && (
            <>
              {/* Instagram-style stats row */}
              <div style={{ display: 'flex', marginBottom: 22, borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                {statItems.map((s, idx) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1, textAlign: 'center', padding: '12px 4px',
                      borderRight: idx < statItems.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, color: 'white', lineHeight: 1.1 }}>
                      {loading || profileLoading ? <span style={{ display: 'inline-block', width: 28, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.3)', verticalAlign: 'middle' }} /> : s.value}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/upload" className="btn" style={{ padding: '9px 22px', fontSize: 13, borderRadius: 50, background: 'white', color: 'var(--pink)', textDecoration: 'none', fontWeight: 800 }}>+ Upload Song</a>
                <button onClick={signOut} className="btn" style={{ padding: '8px 20px', fontSize: 13, borderRadius: 50, background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>Sign Out</button>
              </div>
            </>
          )}
        </div>

        {showSettings ? (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, marginBottom: 16 }}>⚙️ Account Settings</h3>

            {sErr && <div style={{ background: '#FFF0F2', color: '#E0284A', padding: '10px 14px', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>⚠️ {sErr}</div>}
            {sMsg && <div style={{ background: '#F0FFF4', color: '#1B8C4F', padding: '10px 14px', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>✅ {sMsg}</div>}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Change Stage Name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="inp" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1, padding: '10px 14px' }} />
                <button onClick={handleUpdateName} disabled={sLoad} className="btn btn-grad" style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0, opacity: sLoad ? 0.7 : 1 }}>Update</button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Change Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="inp" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New Password (6+ chars)" style={{ flex: 1, padding: '10px 14px' }} />
                <button onClick={handleUpdatePass} disabled={sLoad} className="btn btn-grad" style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0, opacity: sLoad ? 0.7 : 1 }}>Update</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button onClick={() => setShowSettings(false)} className="btn" style={{ padding: '8px 16px', fontSize: 13, background: 'var(--surface)', color: 'var(--text2)', borderRadius: 50 }}>← Back to Profile</button>
              <button onClick={signOut} className="btn btn-red" style={{ padding: '8px 16px', fontSize: 13 }}>Sign Out</button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab ${tab === 'songs' ? 'on' : ''}`} onClick={() => setTab('songs')}>🎵 My Songs ({songs.length})</button>
              <button className={`tab ${tab === 'recs' ? 'on' : ''}`} onClick={() => setTab('recs')}>🎤 Recordings ({perfs.length})</button>
              <button className={`tab ${tab === 'drafts' ? 'on' : ''}`} onClick={() => setTab('drafts')}>💾 Drafts ({drafts.length})</button>
            </div>

            {loading || profileLoading ? (
              /* Full skeleton for all tabs */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 6 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="skeleton" style={{ width: 64, height: 32, borderRadius: 50 }} />
                      <div className="skeleton" style={{ width: 36, height: 32, borderRadius: 50 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : tab === 'songs' ? (
              /* ── MY SONGS ── */
              songs.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
                  <p style={{ color: 'var(--text2)', marginBottom: 20 }}>You haven't uploaded any songs yet</p>
                  <a href="/upload" className="btn btn-grad" style={{ padding: '11px 28px', fontSize: 14, textDecoration: 'none' }}>Upload First Song</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {songs.map(s => (
                    <div key={s.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {s.coverUrl ? <img src={`${API}${s.coverUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.artist || 'Unknown'} · {s.genre || ''}</div>
                        {s.timedLyrics?.length > 0 && <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 2 }}>📝 {s.timedLyrics.length} timed lyric lines</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
                        <button onClick={() => deleteSong(s.id)} className="btn btn-red" style={{ padding: '7px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : tab === 'recs' ? (
              /* ── MY RECORDINGS ── */
              perfs.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎤</div>
                  <p style={{ color: 'var(--text2)', marginBottom: 20 }}>No recordings posted yet</p>
                  <a href="/" className="btn btn-grad" style={{ padding: '11px 28px', fontSize: 14, textDecoration: 'none' }}>Start Singing</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {perfs.map(p => (
                    <PerformanceCard key={p.id} item={p} currentUser={user} onDelete={() => removePerf(p.id, p.docId)} />
                  ))}
                </div>
              )
            ) : (
              /* ── DRAFTS ── */
              drafts.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💾</div>
                  <p style={{ color: 'var(--text2)', marginBottom: 8, fontWeight: 700 }}>No drafts saved</p>
                  <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>After recording, hit "Save as Draft" to keep a private copy before posting.</p>
                  <a href="/" className="btn btn-grad" style={{ padding: '11px 28px', fontSize: 14, textDecoration: 'none' }}>Start Singing</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {drafts.map(d => (
                    <div key={d.id}>
                      <PerformanceCard item={d} currentUser={user} onDelete={null} compact={false} />
                      {/* Draft action bar */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => postDraft(d)}
                          disabled={postingDraft === d.id}
                          className="btn btn-grad"
                          style={{ flex: 1, padding: '10px', fontSize: 13, opacity: postingDraft === d.id ? 0.7 : 1 }}
                        >
                          {postingDraft === d.id ? '⏳ Posting…' : '📤 Post to Community'}
                        </button>
                        <button
                          onClick={() => removeDraft(d.id, d.docId)}
                          className="btn btn-red"
                          style={{ padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <TrashIcon /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
