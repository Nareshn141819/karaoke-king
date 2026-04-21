"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

const RANK_COLOR = { Platinum: '#7C3AED', Gold: '#B45309', Silver: '#4B5563', Bronze: '#92400E' }
const RANK_BG = { Platinum: 'linear-gradient(135deg,#7C3AED,#A78BFA)', Gold: 'linear-gradient(135deg,#B45309,#FBBF24)', Silver: 'linear-gradient(135deg,#4B5563,#9CA3AF)', Bronze: 'linear-gradient(135deg,#92400E,#D97706)' }
const RANK_EMOJI = { Platinum: '💎', Gold: '🥇', Silver: '🥈', Bronze: '🥉' }

function fmtTime(s) {
    if (!isFinite(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
}

export default function PerformanceCard({ item, currentUser, onDelete, compact = false }) {
    const audioRef = useRef(null)
    const seekRef = useRef(null)
    const rafRef = useRef(null)
    const thumbRef = useRef(null)

    const [playing, setPlaying] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [progress, setProgress] = useState(0)   // 0-100
    const [curTime, setCurTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [activeLine, setActiveLine] = useState(-1)
    const [dragging, setDragging] = useState(false)
    const [audioErr, setAudioErr] = useState(false)

    const lyricRefs = useRef([])
    const ytRef = useRef(null)
    const instrRef = useRef(null)

    const tl = item?.timedLyrics   // [{text,time}] or null
    const rc = RANK_COLOR[item?.rank] || '#6B7280'
    const rb = RANK_BG[item?.rank] || 'linear-gradient(135deg,#6B7280,#9CA3AF)'
    const re = RANK_EMOJI[item?.rank] || '🎤'

    // ── RAF tick ──────────────────────────────────────────────────
    const tick = useCallback(() => {
        const a = audioRef.current || instrRef.current
        if (!a || a.paused) return
        const t = a.currentTime, d = a.duration || 1
        if (!dragging) {
            setProgress((t / d) * 100)
            setCurTime(t)
        }
        if (tl?.length) {
            let idx = -1
            for (let i = 0; i < tl.length; i++) { if (tl[i].time <= t) idx = i }
            setActiveLine(idx)
            if (idx >= 0 && lyricRefs.current[idx]) {
                lyricRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
        }
        rafRef.current = requestAnimationFrame(tick)
    }, [dragging, tl])

    useEffect(() => {
        const a = audioRef.current || instrRef.current
        if (!a) return
        const onLoaded = () => {
            if (a.duration === Infinity) {
                // Fix for recorded WebM blobs
                a.currentTime = 1e8;
                a.ontimeupdate = () => {
                    a.ontimeupdate = null;
                    a.currentTime = 0;
                    setDuration(a.duration);
                };
            } else {
                setDuration(a.duration || 0)
            }
        }
        const onPlay = () => { setPlaying(true); rafRef.current = requestAnimationFrame(tick) }
        const onPause = () => { setPlaying(false); cancelAnimationFrame(rafRef.current) }
        const onEnded = () => { setPlaying(false); setProgress(0); setCurTime(0); setActiveLine(-1) }
        const onError = () => setAudioErr(true)
        a.addEventListener('loadedmetadata', onLoaded)
        a.addEventListener('play', onPlay)
        a.addEventListener('pause', onPause)
        a.addEventListener('ended', onEnded)
        a.addEventListener('error', onError)
        return () => {
            a.removeEventListener('loadedmetadata', onLoaded)
            a.removeEventListener('play', onPlay)
            a.removeEventListener('pause', onPause)
            a.removeEventListener('ended', onEnded)
            a.removeEventListener('error', onError)
            cancelAnimationFrame(rafRef.current)
        }
    }, [tick])

    // Helper to send messages to YouTube iframe API
    const postYT = (action, val) => {
        if (!ytRef.current?.contentWindow) return
        try {
            ytRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: action, args: val ? [val] : [] }), '*')
        } catch { }
    }

    const togglePlay = () => {
        if (!hasStarted) setHasStarted(true)
        const a = audioRef.current || instrRef.current
        if (!a) {
            // fallback if only youtube is available
            if (ytRef.current && item?.videoId) {
                if (playing) { postYT('pauseVideo'); setPlaying(false) }
                else { postYT('playVideo'); setPlaying(true) }
            } else {
                setPlaying(!playing) // Fake play to reveal lyrics
            }
            return
        }
        if (audioErr && !instrRef.current) return
        if (a.paused) {
            a.play().catch(() => { })
            if (a !== instrRef.current && instrRef.current) instrRef.current.play().catch(() => { })
            postYT('playVideo')
        } else {
            a.pause()
            if (a !== instrRef.current && instrRef.current) instrRef.current.pause()
            postYT('pauseVideo')
        }
    }

    const skip = (sec) => {
        const a = audioRef.current || instrRef.current
        if (!a) return
        const nT = Math.max(0, Math.min(a.duration || 0, a.currentTime + sec))
        a.currentTime = nT
        if (a !== instrRef.current && instrRef.current) instrRef.current.currentTime = nT
        postYT('seekTo', nT)
        setCurTime(nT)
    }

    // ── Pointer-based seek (fixes the dot bug) ────────────────────
    const calcPct = (e) => {
        const bar = seekRef.current
        if (!bar) return null
        const rect = bar.getBoundingClientRect()
        return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    }

    const applySeek = (pct) => {
        const a = audioRef.current || instrRef.current
        if (!a || !a.duration || !isFinite(a.duration)) return
        const nT = pct * a.duration
        a.currentTime = nT
        if (a !== instrRef.current && instrRef.current) instrRef.current.currentTime = nT
        postYT('seekTo', nT)
        setProgress(pct * 100)
        setCurTime(nT)
    }

    const onSeekPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        const pct = calcPct(e)
        if (pct !== null) applySeek(pct)
    }
    const onSeekPointerMove = (e) => {
        if (!dragging) return
        const pct = calcPct(e)
        const a = audioRef.current || instrRef.current
        if (pct !== null) { setProgress(pct * 100); setCurTime((a?.duration || 0) * pct) }
    }
    const onSeekPointerUp = (e) => {
        const pct = calcPct(e)
        if (pct !== null) applySeek(pct)
        setDragging(false)
    }

    const mine = currentUser && currentUser.uid === item?.uid

    // ── Seed a nice gradient from rank color ─────────────────────
    const gradA = rc
    const gradB = `${rc}88`

    return (
        <div style={{
            background: 'white',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
            border: `1px solid ${rc}22`,
            transition: 'box-shadow 0.2s',
            fontFamily: "'Nunito','Inter',sans-serif",
        }}>
            {/* Hidden audio layers */}
            {item?.audioDataUrl && !audioErr && (
                <audio ref={audioRef} src={item.audioDataUrl} preload="metadata" />
            )}
            {item?.instrumentalUrl && (
                <audio ref={instrRef} src={item.instrumentalUrl} crossOrigin="anonymous" preload="auto" />
            )}

            {/* ── Spotify-style hero header ── */}
            <div style={{
                background: `linear-gradient(145deg, ${rc}EE, ${rc}55 60%, ${rc}22)`,
                padding: compact ? '18px 18px 14px' : '22px 22px 18px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Background big emoji watermark */}
                <div style={{
                    position: 'absolute', right: -10, top: -10,
                    fontSize: 110, opacity: 0.08, pointerEvents: 'none', userSelect: 'none',
                }}>{re}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                    {/* Avatar circle */}
                    <div style={{
                        width: compact ? 44 : 52, height: compact ? 44 : 52,
                        borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(255,255,255,0.25)',
                        border: '2px solid rgba(255,255,255,0.5)',
                        boxShadow: `0 4px 16px ${rc}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 900, fontSize: compact ? 16 : 20,
                    }}>
                        {(item?.user || '?')[0].toUpperCase()}
                    </div>

                    {/* Name + song */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: compact ? 14 : 16, color: 'white', lineHeight: 1.2 }}>
                            {item?.user || 'Anonymous'}
                        </div>
                        <div style={{
                            fontSize: compact ? 12 : 13, color: 'rgba(255,255,255,0.82)',
                            marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            🎵 {item?.song}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                            {item?.date}
                        </div>
                    </div>

                    {/* Rank badge */}
                    <div style={{
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(8px)',
                        border: '1.5px solid rgba(255,255,255,0.35)',
                        borderRadius: 16, padding: '8px 14px',
                        textAlign: 'center', flexShrink: 0, minWidth: 64,
                    }}>
                        <div style={{ fontSize: compact ? 20 : 24 }}>{re}</div>
                        <div style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item?.rank}</div>
                        <div style={{ fontSize: compact ? 14 : 17, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                            {item?.avgScore}<span style={{ fontSize: 9, opacity: 0.7 }}>/100</span>
                        </div>
                    </div>
                </div>

                {/* Score pills */}
                {!compact && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                        {[['🎯 Pitch', item?.pitchScore], ['⏱ Timing', item?.timingScore], ['💫 Emotion', item?.emotionScore]].map(([lbl, val]) => (
                            <div key={lbl} style={{
                                fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.95)',
                                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: 50, padding: '4px 12px',
                            }}>{lbl} {val}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Custom Audio Player ── */}
            <div style={{ padding: compact ? '14px 16px' : '16px 20px', background: 'white' }}>
                {item?.videoId && (
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '30%', overflow: 'hidden', borderRadius: 12, marginBottom: 16 }}>
                        <iframe
                            ref={ytRef}
                            src={`https://www.youtube.com/embed/${item.videoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&playsinline=1`}
                            style={{ position: 'absolute', top: '-50%', left: 0, width: '100%', height: '200%', pointerEvents: 'none', border: 'none' }}
                            allow="autoplay"
                        />
                    </div>
                )}

                {(audioErr && !item?.instrumentalUrl && !item?.videoId) ? (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '8px 0' }}>
                        ⚠️ Audio unavailable
                    </div>
                ) : (
                    <>
                        {/* Control row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, justifyContent: 'center' }}>
                            {/* Skip back 10s */}
                            <button
                                onClick={() => skip(-10)}
                                title="Back 10s"
                                style={{
                                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                                    background: `${rc}14`, color: rc, cursor: 'pointer', fontSize: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = `${rc}28`}
                                onMouseLeave={e => e.currentTarget.style.background = `${rc}14`}
                            >⏮</button>

                            {/* Play / Pause */}
                            <button
                                onClick={togglePlay}
                                style={{
                                    width: compact ? 42 : 50, height: compact ? 42 : 50,
                                    borderRadius: '50%', border: 'none',
                                    background: `linear-gradient(135deg, ${rc}, ${gradB})`,
                                    color: 'white', cursor: 'pointer', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: compact ? 16 : 20,
                                    boxShadow: `0 6px 18px ${rc}50`,
                                    transition: 'transform 0.13s, box-shadow 0.13s',
                                }}
                                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.boxShadow = `0 2px 8px ${rc}40` }}
                                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 6px 18px ${rc}50` }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 6px 18px ${rc}50` }}
                            >
                                {playing ? '⏸' : '▶'}
                            </button>

                            {/* Skip forward 10s */}
                            <button
                                onClick={() => skip(10)}
                                title="Forward 10s"
                                style={{
                                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                                    background: `${rc}14`, color: rc, cursor: 'pointer', fontSize: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = `${rc}28`}
                                onMouseLeave={e => e.currentTarget.style.background = `${rc}14`}
                            >⏭</button>

                            {/* Time */}
                            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                                {fmtTime(curTime)} / {fmtTime(duration)}
                            </div>
                        </div>

                        {/* Waveform-style progress bar */}
                        <div
                            ref={seekRef}
                            onPointerDown={onSeekPointerDown}
                            onPointerMove={onSeekPointerMove}
                            onPointerUp={onSeekPointerUp}
                            style={{
                                height: 8, borderRadius: 99,
                                background: `${rc}18`,
                                cursor: 'pointer', position: 'relative',
                                userSelect: 'none', touchAction: 'none',
                            }}
                        >
                            {/* Filled */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, height: '100%',
                                width: `${progress}%`, borderRadius: 99,
                                background: `linear-gradient(90deg, ${rc}, ${gradB})`,
                                transition: dragging ? 'none' : 'width 0.12s linear',
                                pointerEvents: 'none',
                            }} />
                            {/* Thumb dot */}
                            <div ref={thumbRef} style={{
                                position: 'absolute', top: '50%',
                                left: `${progress}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 16, height: 16, borderRadius: '50%',
                                background: rc,
                                border: '2.5px solid white',
                                boxShadow: `0 2px 8px ${rc}70`,
                                pointerEvents: 'none',
                                transition: dragging ? 'none' : 'left 0.12s linear',
                                zIndex: 2,
                            }} />
                        </div>
                    </>
                )}
            </div>

            {/* ── Scrolling Lyrics ── */}
            {tl?.length > 0 && hasStarted && (
                <div style={{
                    margin: compact ? '0 16px 14px' : '0 20px 16px',
                    borderRadius: 14,
                    background: `linear-gradient(180deg, ${rc}08, ${rc}03)`,
                    border: `1px solid ${rc}18`,
                    padding: '10px 12px',
                    maxHeight: compact ? 100 : 140,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                }}>
                    {tl.map((ln, i) => {
                        const active = i === activeLine
                        const past = i < activeLine
                        return (
                            <div
                                key={i}
                                ref={el => lyricRefs.current[i] = el}
                                style={{
                                    padding: '4px 10px 4px 14px',
                                    fontSize: active ? 14 : 12,
                                    fontWeight: active ? 900 : past ? 600 : 500,
                                    color: active ? rc : past ? 'var(--text3)' : '#C4C4C4',
                                    borderLeft: `3px solid ${active ? rc : 'transparent'}`,
                                    background: active ? `${rc}10` : 'transparent',
                                    borderRadius: 6,
                                    transition: 'all 0.3s ease',
                                    lineHeight: 1.65,
                                    marginBottom: 2,
                                }}
                            >
                                {active && <span style={{ fontSize: 9, marginRight: 6, opacity: 0.7 }}>▶</span>}
                                {ln.text}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Footer: delete ── */}
            {(mine && onDelete) && (
                <div style={{ padding: compact ? '0 16px 12px' : '0 20px 14px' }}>
                    <button
                        onClick={() => onDelete(item.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 16px', fontSize: 12, border: 'none', borderRadius: 50,
                            background: '#FFF0F2', color: '#E0284A', cursor: 'pointer', fontWeight: 700,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFD9E0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFF0F2'}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}
