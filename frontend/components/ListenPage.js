"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar, { NavbarSkeleton } from './Navbar'
import BottomNav from './BottomNav'
import { getUser } from '../lib/store'
import { useAudio } from '../lib/AudioContext'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

// ── Icons ────────────────────────────────────────────────────────
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
const PlayIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const PauseIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
const SkipBackIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
const SkipNextIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>
const HeartIcon = ({ filled }) => filled
  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF4E8A"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const DownloadIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
const ShuffleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
const RepeatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
const ListIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
const VolumeIcon = ({ muted }) => muted
  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></svg>
  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
const ChevronDownIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>

// ── Trending ──────────────────────────────────────────────────────
const TRENDING_SONGS = [
  { title: 'Phir Se Ud Chala', artist: 'Mohit Chauhan', query: 'Phir Se Ud Chala Rockstar', thumbnail: 'https://img.youtube.com/vi/AhFGHs7NhtU/hqdefault.jpg' },
  { title: 'Tum Hi Ho', artist: 'Arijit Singh', query: 'Tum Hi Ho Full Song', thumbnail: 'https://img.youtube.com/vi/Umqb9KENgmk/hqdefault.jpg' },
  { title: 'Kesariya', artist: 'Arijit Singh', query: 'Kesariya Full Song', thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg' },
  { title: 'Apna Bana Le', artist: 'Arijit Singh', query: 'Apna Bana Le Full Song', thumbnail: 'https://img.youtube.com/vi/e-mMFgVEfSQ/hqdefault.jpg' },
  { title: 'Chaleya', artist: 'Arijit Singh', query: 'Chaleya Full Song Jawan', thumbnail: 'https://img.youtube.com/vi/bqjK4Hce5o0/hqdefault.jpg' },
  { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', query: 'Raataan Lambiyan Full Song', thumbnail: 'https://img.youtube.com/vi/gvyUuxdRdR4/hqdefault.jpg' },
  { title: 'Let Me Down Slowly', artist: 'Alec Benjamin', query: 'Let Me Down Slowly Alec Benjamin', thumbnail: 'https://img.youtube.com/vi/50VNCymT-Cs/hqdefault.jpg' },
  { title: 'Shape of You', artist: 'Ed Sheeran', query: 'Shape of You Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
  { title: 'Blinding Lights', artist: 'The Weeknd', query: 'Blinding Lights The Weeknd', thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
  { title: 'Perfect', artist: 'Ed Sheeran', query: 'Perfect Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg' },
  { title: 'Tera Ban Jaunga', artist: 'Akhil Sachdeva', query: 'Tera Ban Jaunga Full Song Kabir Singh', thumbnail: 'https://img.youtube.com/vi/3_fzmPhdEno/hqdefault.jpg' },
  { title: 'Maan Meri Jaan', artist: 'King', query: 'Maan Meri Jaan King', thumbnail: 'https://img.youtube.com/vi/MWP1FPQM3wY/hqdefault.jpg' },
]
const GENRE_FILTERS = ['All', '🔥 Trending', '❤️ Favorites', '🎵 Bollywood', '🌍 English', '🎸 Rock', '🎹 Chill']

function getFavorites() { try { return JSON.parse(localStorage.getItem('kk_listen_favs') || '[]') } catch { return [] } }
function saveFavorites(favs) { localStorage.setItem('kk_listen_favs', JSON.stringify(favs)) }
function isFavorite(videoId) { return getFavorites().some(f => f.videoId === videoId) }
function toggleFavorite(song) {
  let favs = getFavorites()
  favs = favs.some(f => f.videoId === song.videoId)
    ? favs.filter(f => f.videoId !== song.videoId)
    : [{ ...song, addedAt: Date.now() }, ...favs]
  saveFavorites(favs)
  return favs
}

// ── Main ──────────────────────────────────────────────────────────
export default function ListenPage() {
  const [user, setUser] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [showQueue, setShowQueue] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const searchTimeout = useRef(null)
  const progressRef = useRef(null)

  const {
    currentSong, isPlaying, audioLoading, audioError,
    currentTime, duration, volume, muted, setVolume, setMuted,
    playerExpanded, setPlayerExpanded,
    queue, setQueue, queueIndex, setQueueIndex,
    shuffle, setShuffle, repeat, setRepeat,
    playSong, togglePlay, playNext, playPrev, seekTo, fmt,
  } = useAudio()

  useEffect(() => {
    setUser(getUser())
    setFavorites(getFavorites())
    setQueue(TRENDING_SONGS.map((s, i) => ({ ...s, queueId: `t-${i}` })))
    setTimeout(() => setPageLoading(false), 500)
  }, [])

  // ── Search ──────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const r = await fetch(`${API}/api/listen/search?q=${encodeURIComponent(q)}`)
      const d = r.ok ? await r.json() : {}
      setSearchResults(d.items || [])
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }, [])

  const onSearchChange = e => {
    setSearchQuery(e.target.value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(e.target.value), 500)
  }

  // ── Seek via progress bar click ──────────────────────────
  const handleSeek = e => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(pct)
  }

  // ── Favorite ─────────────────────────────────────────────
  const handleFavorite = (song) => {
    const updated = toggleFavorite(song)
    setFavorites(updated)
  }

  // ── Download ─────────────────────────────────────────────
  const handleDownload = async (song) => {
    if (!song.videoId) return
    setDownloading(song.videoId)
    try {
      const url = `${API}/api/listen/audio/${song.videoId}`
      const blob = await (await fetch(url)).blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${(song.title || 'song').replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
    setDownloading(null)
  }

  // ── Filter ───────────────────────────────────────────────
  const filteredSongs = (() => {
    if (activeFilter === '❤️ Favorites') return favorites
    if (activeFilter === '🎵 Bollywood') return TRENDING_SONGS.filter(s => ['Arijit Singh','Mohit Chauhan','Jubin Nautiyal','Akhil Sachdeva','King'].includes(s.artist))
    if (activeFilter === '🌍 English') return TRENDING_SONGS.filter(s => ['Alec Benjamin','Ed Sheeran','The Weeknd'].includes(s.artist))
    return TRENDING_SONGS
  })()

  // ── Progress % ───────────────────────────────────────────
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Skeleton ─────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NavbarSkeleton />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 100px)' }}>
        <div className="skeleton" style={{ height: 52, borderRadius: 50, marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ width: 90, height: 36, borderRadius: 50, flexShrink: 0 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(156px,1fr))', gap: 14 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: 'white', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: 156 }} />
              <div style={{ padding: 12 }}>
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '80%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 100px)' }}>

        {/* ── Search Bar ── */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', borderRadius: 50, padding: '4px 6px 4px 20px',
            boxShadow: '0 4px 24px rgba(155,92,246,0.12)', border: '1.5px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text3)', display: 'flex' }}><SearchIcon /></span>
            <input
              value={searchQuery} onChange={onSearchChange}
              onKeyDown={e => e.key === 'Enter' && doSearch(searchQuery)}
              placeholder="Search songs, artists…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: "'Nunito',sans-serif", fontWeight: 600, color: 'var(--text)', background: 'transparent', padding: '10px 0' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 6, display: 'flex' }}>
                <CloseIcon />
              </button>
            )}
            <button onClick={() => doSearch(searchQuery)}
              style={{ background: 'var(--grad)', border: 'none', borderRadius: 50, padding: '10px 18px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {searching ? <div className="ls-spin" /> : <SearchIcon />}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && searchQuery && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'white', borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 16px 60px rgba(0,0,0,0.18)', border: '1px solid var(--border)',
              zIndex: 100, maxHeight: '60vh', overflowY: 'auto',
            }}>
              {searchResults.map((item, i) => (
                <button key={i}
                  onClick={() => { playSong(item, searchResults); setSearchQuery(''); setSearchResults([]) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px', background: 'transparent',
                    border: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid #F0EBFF' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                  <img src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                    alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.artist || item.channelTitle || ''}</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <PlayIcon size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Genre Pills ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 22, scrollbarWidth: 'none' }}>
          {GENRE_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '9px 18px', borderRadius: 50, fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s',
              background: activeFilter === f ? 'var(--grad)' : 'white',
              color: activeFilter === f ? 'white' : 'var(--text2)',
              border: activeFilter === f ? 'none' : '1.5px solid var(--border)',
              boxShadow: activeFilter === f ? '0 4px 16px rgba(255,78,138,0.3)' : 'none',
            }}>{f}</button>
          ))}
        </div>

        {/* ── Section Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>
            {activeFilter === '❤️ Favorites' ? '❤️ Your Favorites' : activeFilter === 'All' ? '🔥 Trending Now' : activeFilter}
          </h2>
          {activeFilter !== '❤️ Favorites' && (
            <button onClick={() => { setQueue(TRENDING_SONGS); playSong(TRENDING_SONGS[0], TRENDING_SONGS) }}
              style={{ fontSize: 12, fontWeight: 800, color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ▶ Play All
            </button>
          )}
        </div>

        {/* ── Song Grid ── */}
        {filteredSongs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{activeFilter === '❤️ Favorites' ? 'No favorites yet' : 'No songs found'}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{activeFilter === '❤️ Favorites' ? 'Tap ♥ on any song to add it' : 'Try a different filter'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(156px,1fr))', gap: 14 }}>
            {filteredSongs.map((song, i) => (
              <SongTile
                key={song.videoId || i}
                song={song}
                isActive={currentSong?.videoId === song.videoId}
                isPlaying={currentSong?.videoId === song.videoId && isPlaying}
                isFav={isFavorite(song.videoId)}
                onPlay={() => playSong(song, filteredSongs)}
                onFav={() => handleFavorite(song)}
                onDownload={() => handleDownload(song)}
                downloading={downloading === song.videoId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Full Screen Player ── */}
      {currentSong && playerExpanded && (
        <div className="lp-fullplayer" style={{ animation: 'lpSlideUp 0.4s cubic-bezier(0.2,0.8,0.2,1)' }}>
          {/* Blurred BG */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.videoId}/hqdefault.jpg`})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(60px) brightness(0.25) saturate(2)',
          }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(5,0,20,0.7)' }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
              <button onClick={() => setPlayerExpanded(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)' }}>
                <ChevronDownIcon />
              </button>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 3 }}>Now Playing</div>
              <button onClick={() => setShowQueue(!showQueue)}
                style={{ background: showQueue ? 'rgba(255,78,138,0.3)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)' }}>
                <ListIcon />
              </button>
            </div>

            {showQueue ? (
              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
                <h3 style={{ color: 'white', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Queue ({queue.length})</h3>
                {queue.map((song, i) => (
                  <button key={song.queueId || i}
                    onClick={() => { setQueueIndex(i); playSong(song); setShowQueue(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '10px 14px', background: i === queueIndex ? 'rgba(255,78,138,0.25)' : 'rgba(255,255,255,0.07)',
                      border: i === queueIndex ? '1px solid rgba(255,78,138,0.4)' : '1px solid transparent',
                      borderRadius: 14, cursor: 'pointer', textAlign: 'left', marginBottom: 6,
                    }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 20, fontWeight: 700 }}>{i + 1}</span>
                    <img src={song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/default.jpg`}
                      alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: i === queueIndex ? '#FF4E8A' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{song.artist || ''}</div>
                    </div>
                    {i === queueIndex && <div className="lp-eq"><span/><span/><span/></div>}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Album art */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
                  <div style={{
                    width: 'min(80vw, 300px)', height: 'min(80vw, 300px)',
                    borderRadius: 24, overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                    position: 'relative',
                  }}>
                    <img
                      src={currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.videoId}/hqdefault.jpg`}
                      alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {audioLoading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="lp-spin-lg" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Song info + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Poppins',sans-serif" }}>
                      {currentSong.title}
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{currentSong.artist || 'Unknown Artist'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    <button onClick={() => handleDownload(currentSong)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)' }}>
                      {downloading === currentSong.videoId ? <div className="lp-spin-sm" /> : <DownloadIcon />}
                    </button>
                    <button onClick={() => handleFavorite(currentSong)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                      <HeartIcon filled={isFavorite(currentSong.videoId)} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div
                    ref={progressRef}
                    onClick={handleSeek}
                    style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3, cursor: 'pointer', position: 'relative' }}>
                    <div style={{
                      width: `${progress}%`, height: '100%', borderRadius: 3,
                      background: 'linear-gradient(90deg, #FF4E8A, #9B5CF6)',
                      transition: 'width 0.2s linear', position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 14, borderRadius: '50%', background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{fmt(currentTime)}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Main controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 16px' }}>
                  <button onClick={() => setShuffle(!shuffle)}
                    style={{ background: shuffle ? 'rgba(255,78,138,0.25)' : 'none', border: shuffle ? '1px solid rgba(255,78,138,0.5)' : '1px solid transparent', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: shuffle ? '#FF4E8A' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
                    <ShuffleIcon />
                  </button>
                  <button onClick={playPrev}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <SkipBackIcon />
                  </button>
                  {/* Main play/pause */}
                  <button onClick={togglePlay}
                    style={{
                      width: 68, height: 68, borderRadius: '50%', background: 'white',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#1E0A3C', boxShadow: '0 8px 32px rgba(255,255,255,0.25)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    {audioLoading ? <div className="lp-spin-dark" /> : isPlaying ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
                  </button>
                  <button onClick={playNext}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <SkipNextIcon />
                  </button>
                  <button onClick={() => setRepeat(!repeat)}
                    style={{ background: repeat ? 'rgba(155,92,246,0.25)' : 'none', border: repeat ? '1px solid rgba(155,92,246,0.5)' : '1px solid transparent', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: repeat ? '#9B5CF6' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
                    <RepeatIcon />
                  </button>
                </div>

                {/* Volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
                  <button onClick={() => setMuted(!muted)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
                    <VolumeIcon muted={muted} />
                  </button>
                  <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                    className="lp-vol"
                    style={{ width: 140 }}
                  />
                </div>

                {/* Error */}
                {audioError && (
                  <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,78,78,0.2)', borderRadius: 12, marginBottom: 12, border: '1px solid rgba(255,78,78,0.3)' }}>
                    <span style={{ fontSize: 12, color: '#FF8080', fontWeight: 700 }}>{audioError}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />

      <style>{`
        @keyframes lpSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes lpSpin { to { transform: rotate(360deg) } }
        @keyframes lpEq { from { height: 4px } to { height: 16px } }

        .lp-fullplayer {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; flex-direction: column; overflow: hidden;
          background: #080010;
        }
        .lp-spin-lg {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: white;
          animation: lpSpin 0.8s linear infinite;
        }
        .lp-spin-sm {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          animation: lpSpin 0.7s linear infinite;
        }
        .lp-spin-dark {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid rgba(30,10,60,0.15);
          border-top-color: #1E0A3C;
          animation: lpSpin 0.8s linear infinite;
        }
        .ls-spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          animation: lpSpin 0.7s linear infinite;
        }
        .lp-eq {
          display: flex; align-items: flex-end; gap: 2; height: 16px;
        }
        .lp-eq span {
          width: 3px; border-radius: 2px; background: #FF4E8A;
          animation: lpEq 0.6s ease-in-out infinite alternate;
        }
        .lp-eq span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .lp-eq span:nth-child(2) { height: 14px; animation-delay: 0.2s; }
        .lp-eq span:nth-child(3) { height: 6px; animation-delay: 0.4s; }

        .lp-vol {
          -webkit-appearance: none; appearance: none;
          height: 4px; border-radius: 2px; outline: none;
          background: linear-gradient(to right,
            rgba(255,255,255,0.8) ${(volume) * 100}%,
            rgba(255,255,255,0.2) ${(volume) * 100}%);
        }
        .lp-vol::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: white; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .lp-vol::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: white; cursor: pointer; border: none;
        }
      `}</style>
    </div>
  )
}

// ── Song Tile ──────────────────────────────────────────────────────
function SongTile({ song, isActive, isPlaying, isFav, onPlay, onFav, onDownload, downloading }) {
  const [hovered, setHovered] = useState(false)
  const thumb = song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: isActive ? 'linear-gradient(135deg,rgba(255,78,138,0.08),rgba(155,92,246,0.08))' : 'white',
        border: isActive ? '1.5px solid rgba(255,78,138,0.3)' : '1px solid var(--border)',
        boxShadow: hovered ? 'var(--sh2)' : 'var(--sh)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.2,0.8,0.2,1)',
      }}>
      {/* Cover */}
      <div onClick={onPlay} style={{ position: 'relative', height: 156, overflow: 'hidden' }}>
        <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          onError={e => e.target.style.display = 'none'} />
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered || isActive ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}>
          {(hovered || isActive) && (
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FF4E8A,#9B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,78,138,0.5)',
              color: 'white', animation: 'popInMic 0.3s ease',
            }}>
              {isActive && isPlaying
                ? <div className="lp-eq" style={{ transform: 'scale(0.8)' }}><span/><span/><span/></div>
                : <PlayIcon size={20} />
              }
            </div>
          )}
        </div>
        {/* Heart */}
        <button onClick={e => { e.stopPropagation(); onFav() }}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            border: 'none', borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', opacity: hovered || isFav ? 1 : 0, transition: 'opacity 0.2s',
          }}>
          <HeartIcon filled={isFav} />
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div onClick={onPlay} style={{ fontSize: 13, fontWeight: 800, color: isActive ? 'var(--pink)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.artist || ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <button onClick={e => { e.stopPropagation(); onPlay() }}
            style={{ padding: '5px 14px', borderRadius: 50, fontSize: 11, fontWeight: 800, background: 'var(--grad)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,78,138,0.25)' }}>
            {isActive && isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={e => { e.stopPropagation(); onDownload() }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
            {downloading
              ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--pink)', animation: 'lpSpin 0.7s linear infinite' }} />
              : <DownloadIcon />}
          </button>
        </div>
      </div>
    </div>
  )
}
