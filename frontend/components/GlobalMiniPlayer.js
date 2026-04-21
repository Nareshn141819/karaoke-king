"use client"
import { usePathname } from 'next/navigation'
import { useAudio } from '../lib/AudioContext'

const PlayIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const PauseIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
const SkipNextIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>
const CloseIcon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
const HeartIcon = ({ filled }) => filled
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF4E8A"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>

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

export default function GlobalMiniPlayer() {
  const pathname = usePathname()
  const { currentSong, isPlaying, audioLoading, playerExpanded, setPlayerExpanded, togglePlay, playNext, currentTime, duration, closePlayer } = useAudio()

  // Don't show on studio page, login page, or when full player is expanded
  if (!currentSong || playerExpanded) return null
  if (pathname?.startsWith('/studio') || pathname?.startsWith('/login')) return null
  // Don't show on listen page — ListenPage renders its own mini-player area
  // Actually show everywhere including listen (it's at the bottom, above BottomNav)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const thumb = currentSong.thumbnail || `https://img.youtube.com/vi/${currentSong.videoId}/hqdefault.jpg`

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
