"use client"
import { useState, useRef, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API || 'http://localhost:5000'

export default function SearchBar({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setRes] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoad] = useState(false)
  const debounce = useRef(null)
  const wrapRef = useRef(null)

  // close on outside click
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (v) => {
    if (!v.trim()) { setRes([]); setOpen(false); return }
    setLoad(true)
    try {
      const r = await fetch(`${API}/api/search?q=${encodeURIComponent(v)}`)
      const d = r.ok ? await r.json() : {}
      const items = d.items || []
      setRes(items)
      setOpen(items.length > 0)
    } catch { setOpen(false) }
    finally { setLoad(false) }
  }

  const onChange = e => {
    setQ(e.target.value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(e.target.value), 400)
  }

  const pick = item => {
    // Decode HTML entities from YouTube API (e.g. &amp; → &)
    const decodeHtml = (str) => {
      const t = document.createElement('textarea')
      t.innerHTML = str
      return t.value
    }
    onSelect({
      title: decodeHtml(item.snippet.title),
      videoId: item.id?.videoId,
      thumbnail: item.snippet.thumbnails?.default?.url || ''
    })
    setOpen(false); setQ('')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 500 }}>
      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={onChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search any song or artist…"
          style={{
            flex: 1, padding: '13px 20px', borderRadius: 50, fontSize: 14,
            outline: 'none', border: 'none', fontFamily: "'Nunito',sans-serif",
            fontWeight: 600, color: '#1E0A3C',
            background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.12)'
          }}
        />
        <button
          onClick={() => search(q)}
          style={{
            padding: '13px 22px', borderRadius: 50, fontSize: 15, border: 'none',
            background: 'rgba(255,255,255,0.25)', cursor: 'pointer',
            color: 'white', fontWeight: 800, backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
          }}
        >
          {loading ? '···' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>}
        </button>
      </div>

      {/* Results dropdown — rendered in a fixed overlay so it's never clipped */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0, right: 0,
          background: 'white',
          borderRadius: 18,
          overflowY: 'auto',
          maxHeight: '60vh',
          boxShadow: '0 16px 60px rgba(0,0,0,0.18)',
          border: '1px solid #E8E0F8',
          zIndex: 9999,
        }}>
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => pick(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid #F0EBFF' : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F7F3FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {item.snippet.thumbnails?.default?.url ? (
                <img
                  src={item.snippet.thumbnails.default.url}
                  alt=""
                  style={{ width: 52, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 52, height: 38, borderRadius: 8, background: '#F0EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎵</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E0A3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.snippet.title}
                </div>
                <div style={{ fontSize: 11, color: '#A99DC0', marginTop: 2 }}>
                  {item.snippet.channelTitle}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FF4E8A,#9B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white' }}>
                ▶
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
