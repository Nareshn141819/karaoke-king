"use client"
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAudio } from '../lib/AudioContext'

// ── Icons ─────────────────────────────────────────────────────────
const PlayIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const PauseIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
const SkipBackIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
const SkipNextIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>
const SkipNextIconLg = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>
const CloseIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
const ChevronDownIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
const HeartIcon = ({ filled }) => filled
  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF4E8A"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const ShuffleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
const RepeatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const ListIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
const VolumeIcon = ({ muted }) => muted
  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></svg>
  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>

// ── Favorites helpers ─────────────────────────────────────────────
function isFav(videoId) {
  try { return JSON.parse(localStorage.getItem('kk_listen_favs') || '[]').some(f => f.videoId === videoId) } catch { return false }
}
function toggleFav(song) {
  try {
    let favs = JSON.parse(localStorage.getItem('kk_listen_favs') || '[]')
    if (favs.some(f => f.videoId === song.videoId)) favs = favs.filter(f => f.videoId !== song.videoId)
    else favs.unshift({ ...song, addedAt: Date.now() })
    localStorage.setItem('kk_listen_favs', JSON.stringify(favs))
  } catch {}
}

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function GlobalMiniPlayer() {
  const pathname = usePathname()
  const {
    currentSong, isPlaying, audioLoading, audioError,
    playerExpanded, setPlayerExpanded,
    togglePlay, playNext, playPrev,
    currentTime, duration, seekTo,
    volume, muted, setVolume, setMuted,
    queue, queueIndex, setQueueIndex, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    closePlayer,
  } = useAudio()

  const [showQueue, setShowQueue] = useState(false)
  const progressRef = useRef(null)

  // Don't show on studio page, login page
  if (!currentSong) return null
  if (pathname?.startsWith('/studio') || pathname?.startsWith('/login')) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const thumb = currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.videoId}/hqdefault.jpg`

  const handleSeek = e => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(pct)
  }

  // ── Full-screen expanded player ───────────────────────────
  if (playerExpanded) {
    return (
      <>
        <div className="gmp-fullplayer" style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: '#080010',
        }}>
          {/* Background blur artwork */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${thumb})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(60px) brightness(0.4)',
            transform: 'scale(1.3)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
              <button onClick={() => { setPlayerExpanded(false); setShowQueue(false) }}
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
              /* Queue list */
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
                    {i === queueIndex && <div className="gmp-eq"><span/><span/><span/></div>}
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
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative',
                  }}>
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {audioLoading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="gmp-spin-lg" />
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
                  <button onClick={() => toggleFav(currentSong)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', flexShrink: 0, marginLeft: 12 }}>
                    <HeartIcon filled={isFav(currentSong.videoId)} />
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div ref={progressRef} onClick={handleSeek}
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
                  <button onClick={togglePlay}
                    style={{
                      width: 68, height: 68, borderRadius: '50%', background: 'white',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#1E0A3C', boxShadow: '0 8px 32px rgba(255,255,255,0.25)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    {audioLoading ? <div className="gmp-spin-dark" /> : isPlaying ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
                  </button>
                  <button onClick={playNext}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <SkipNextIconLg />
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
                    className="gmp-vol" style={{ width: 140 }} />
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

        {/* Inline styles for full player */}
        <style>{`
          @keyframes gmpSpin { to { transform: rotate(360deg) } }
          @keyframes gmpEq { from { height: 4px } to { height: 16px } }
          .gmp-spin-lg {
            width: 44px; height: 44px; border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.2); border-top-color: white;
            animation: gmpSpin 0.8s linear infinite;
          }
          .gmp-spin-dark {
            width: 28px; height: 28px; border-radius: 50%;
            border: 3px solid rgba(30,10,60,0.15); border-top-color: #1E0A3C;
            animation: gmpSpin 0.8s linear infinite;
          }
          .gmp-eq { display: flex; align-items: flex-end; gap: 2; height: 16px; }
          .gmp-eq span { width: 3px; border-radius: 2px; background: #FF4E8A; animation: gmpEq 0.6s ease-in-out infinite alternate; }
          .gmp-eq span:nth-child(1) { height: 8px; animation-delay: 0s; }
          .gmp-eq span:nth-child(2) { height: 14px; animation-delay: 0.2s; }
          .gmp-eq span:nth-child(3) { height: 6px; animation-delay: 0.4s; }
          .gmp-vol {
            -webkit-appearance: none; appearance: none;
            height: 4px; border-radius: 2px; outline: none;
            background: linear-gradient(to right,
              rgba(255,255,255,0.8) ${(volume) * 100}%,
              rgba(255,255,255,0.2) ${(volume) * 100}%);
          }
          .gmp-vol::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none;
            width: 14px; height: 14px; border-radius: 50%;
            background: white; cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          .gmp-vol::-moz-range-thumb {
            width: 14px; height: 14px; border-radius: 50%;
            background: white; cursor: pointer; border: none;
          }
        `}</style>
      </>
    )
  }

  // ── Mini player bar (collapsed) ─────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--bot)',
      left: 0, right: 0,
      zIndex: 998,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', height: 3, background: 'rgba(155,92,246,0.15)' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #FF4E8A, #9B5CF6)',
          transition: 'width 0.5s linear',
        }} />
      </div>

      {/* Player row */}
      <div
        onClick={() => setPlayerExpanded(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(155,92,246,0.12)',
          cursor: 'pointer',
          boxShadow: '0 -4px 24px rgba(155,92,246,0.12)',
        }}>
        {/* Thumbnail */}
        <img src={thumb} alt="" style={{
          width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }} />

        {/* Song info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E0A3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSong.title}
          </div>
          <div style={{ fontSize: 11, color: '#A99DC0', marginTop: 1 }}>{currentSong.artist || ''}</div>
        </div>

        {/* Fav */}
        <button
          onClick={e => { e.stopPropagation(); toggleFav(currentSong) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#A99DC0' }}>
          <HeartIcon filled={isFav(currentSong.videoId)} />
        </button>

        {/* Skip next */}
        <button
          onClick={e => { e.stopPropagation(); playNext() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#6B5B8A' }}>
          <SkipNextIcon />
        </button>

        {/* Play/Pause */}
        <button
          onClick={e => { e.stopPropagation(); togglePlay() }}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF4E8A, #9B5CF6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(255,78,138,0.35)',
          }}>
          {audioLoading
            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
            : isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </button>

        {/* Close */}
        <button
          onClick={e => { e.stopPropagation(); closePlayer() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#A99DC0', marginLeft: 4 }}>
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  )
}
