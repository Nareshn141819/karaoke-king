"use client"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

const Ctx = createContext(null)

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(false)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)

  const audioRef = useRef(null)
  // Cache of videoId -> audioUrl to skip server round-trip on replay
  const urlCacheRef = useRef(new Map())

  // Restore last song from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kk_current_song')
      if (saved) {
        const song = JSON.parse(saved)
        setCurrentSong(song)
        setPlayerExpanded(false) // start collapsed as mini-player
      }
    } catch {}
  }, [])

  // Save current song to localStorage whenever it changes
  useEffect(() => {
    if (currentSong) {
      try { localStorage.setItem('kk_current_song', JSON.stringify(currentSong)) } catch {}
    }
  }, [currentSong])

  // Audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDur = () => { if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration) }
    const onCanPlay = () => { setAudioLoading(false); setAudioError(null) }
    const onPlaying = () => { setAudioLoading(false); setIsPlaying(true) }
    const onPause = () => setIsPlaying(false)
    const onError = (e) => {
      setAudioLoading(false)
      // Only show error if we actually have a src set (not when clearing)
      const src = audioRef.current?.src
      if (src && src !== window.location.href) {
        setAudioError('Failed to load — tap retry or try another song')
      }
    }
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play() }
      else playNext()
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
    }
  }, [repeat])

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  // Prefetch: warm the backend cache for the next song in queue
  const prefetchNext = useCallback((currentVideoId, songQueue) => {
    if (!songQueue || songQueue.length < 2) return
    const curIdx = songQueue.findIndex(s => s.videoId === currentVideoId)
    if (curIdx === -1) return
    const nextIdx = (curIdx + 1) % songQueue.length
    const nextSong = songQueue[nextIdx]
    if (nextSong?.videoId && !urlCacheRef.current.has(nextSong.videoId)) {
      // Fire a HEAD request to warm the server-side cache, don't await
      fetch(`${API}/api/listen/audio/${nextSong.videoId}`, { method: 'HEAD' }).catch(() => {})
    }
  }, [])

  const playSong = useCallback(async (song, songQueue = []) => {
    setAudioLoading(true)
    setAudioError(null)
    setCurrentSong(song)
    setPlayerExpanded(true)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    if (songQueue.length > 0) setQueue(songQueue)

    try {
      let videoId = song.videoId
      if (!videoId) {
        const r = await fetch(`${API}/api/listen/search?q=${encodeURIComponent(song.query || song.title + ' ' + song.artist)}`)
        const d = r.ok ? await r.json() : {}
        if (d.items?.length > 0) {
          song = { ...song, videoId: d.items[0].videoId, thumbnail: d.items[0].thumbnail || song.thumbnail }
          videoId = song.videoId
        } else { setAudioError('Could not find song'); setAudioLoading(false); return }
      }

      const audioUrl = `${API}/api/listen/audio/${videoId}`

      // Pre-check: verify the audio endpoint responds OK before setting src
      try {
        const check = await fetch(audioUrl, { method: 'HEAD' })
        if (!check.ok) {
          // Server couldn't get the audio — try searching by song name instead
          console.warn(`Audio HEAD check failed (${check.status}) for ${videoId}, trying search...`)
          const searchQuery = song.query || `${song.title} ${song.artist || ''}`
          const searchR = await fetch(`${API}/api/listen/search?q=${encodeURIComponent(searchQuery)}`)
          const searchD = searchR.ok ? await searchR.json() : {}
          const alt = searchD.items?.find(item => item.videoId && item.videoId !== videoId)
          if (alt) {
            videoId = alt.videoId
            song = { ...song, videoId, thumbnail: alt.thumbnail || song.thumbnail }
          } else {
            throw new Error('No alternative found')
          }
        }
      } catch (headErr) {
        // HEAD might not be supported — proceed anyway with the original URL
        console.warn('HEAD pre-check skipped:', headErr.message)
      }

      const finalAudioUrl = `${API}/api/listen/audio/${videoId}`
      urlCacheRef.current.set(videoId, finalAudioUrl)
      const fullSong = { ...song, videoId, audioUrl: finalAudioUrl }
      setCurrentSong(fullSong)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = finalAudioUrl
        // Use load() to immediately start buffering, then play
        audioRef.current.load()
        audioRef.current.play()
          .then(() => { setIsPlaying(true); setAudioLoading(false) })
          .catch(e => { console.warn('Autoplay blocked:', e); setIsPlaying(false); setAudioLoading(false) })
      }

      const effectiveQueue = songQueue.length > 0 ? songQueue : queue
      setQueue(prev => prev.some(s => s.videoId === videoId) ? prev : [...prev, { ...fullSong, queueId: `q-${Date.now()}` }])
      setQueueIndex(() => {
        const q = effectiveQueue.length > 0 ? effectiveQueue : [fullSong]
        return q.findIndex(s => s.videoId === videoId)
      })

      // Prefetch next song in background after short delay
      setTimeout(() => prefetchNext(videoId, songQueue.length > 0 ? songQueue : queue), 2000)
    } catch (e) {
      console.error('playSong error:', e)
      setAudioError('Failed to load — tap retry or try another song')
      setAudioLoading(false)
    }
  }, [queue, prefetchNext])

  // Retry current song
  const retrySong = useCallback(() => {
    if (currentSong) {
      // Clear the cache for this videoId so it re-fetches
      if (currentSong.videoId) urlCacheRef.current.delete(currentSong.videoId)
      playSong(currentSong, queue)
    }
  }, [currentSong, queue, playSong])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return
    if (isPlaying) { audioRef.current.pause() }
    else {
      // If no src is loaded (e.g. restored from localStorage), load it
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        if (currentSong.audioUrl) {
          audioRef.current.src = currentSong.audioUrl
          audioRef.current.load()
        } else if (currentSong.videoId) {
          audioRef.current.src = `${API}/api/listen/audio/${currentSong.videoId}`
          audioRef.current.load()
        }
      }
      audioRef.current.play().catch(() => {})
    }
  }, [isPlaying, currentSong])

  const playNext = useCallback(() => {
    if (!queue.length) return
    const nextIdx = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (queueIndex + 1) % queue.length
    setQueueIndex(nextIdx)
    playSong(queue[nextIdx])
  }, [queue, queueIndex, shuffle, playSong])

  const playPrev = useCallback(() => {
    if (!queue.length) return
    if (currentTime > 3) { audioRef.current.currentTime = 0; return }
    const prevIdx = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (queueIndex - 1 + queue.length) % queue.length
    setQueueIndex(prevIdx)
    playSong(queue[prevIdx])
  }, [queue, queueIndex, shuffle, currentTime, playSong])

  const seekTo = useCallback((pct) => {
    if (!audioRef.current || !duration) return
    audioRef.current.currentTime = pct * duration
  }, [duration])

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    setCurrentSong(null)
    setPlayerExpanded(false)
    try { localStorage.removeItem('kk_current_song') } catch {}
  }, [])

  return (
    <Ctx.Provider value={{
      currentSong, isPlaying, audioLoading, audioError,
      currentTime, duration, volume, muted, setVolume, setMuted,
      playerExpanded, setPlayerExpanded,
      queue, setQueue, queueIndex, setQueueIndex,
      shuffle, setShuffle, repeat, setRepeat,
      audioRef, playSong, togglePlay, playNext, playPrev, seekTo, fmt, closePlayer, retrySong,
    }}>
      {/* Single global audio element — preload auto for faster start */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      {children}
    </Ctx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider')
  return ctx
}
