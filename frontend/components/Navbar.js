"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUser, getProfile } from '../lib/store'

// Inline person SVG avatar (gradient background, no letters)
const NavPersonAvatar = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%', display: 'block', border: '2px solid var(--purple)' }}>
    <circle cx="17" cy="17" r="17" fill="url(#nav_av_g)" />
    <circle cx="17" cy="13" r="5.5" fill="rgba(255,255,255,0.85)" />
    <ellipse cx="17" cy="26" rx="8.5" ry="5.5" fill="rgba(255,255,255,0.85)" />
    <defs>
      <linearGradient id="nav_av_g" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF4E8A" />
        <stop offset="1" stopColor="#9B5CF6" />
      </linearGradient>
    </defs>
  </svg>
)

// Skeleton variant — shows shimmer placeholder for the entire navbar
export function NavbarSkeleton() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      height: 'var(--nav)', background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      boxShadow: '0 1px 16px rgba(155,92,246,0.07)'
    }}>
      {/* Logo skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 130, height: 20, borderRadius: 6 }} />
      </div>
      {/* Right buttons skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skeleton" style={{ width: 88, height: 34, borderRadius: 50 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%' }} />
      </div>
    </header>
  )
}

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoErr, setPhotoErr] = useState(false)

  useEffect(() => {
    const u = getUser()
    setUser(u)
    if (u?.uid) {
      if (u.photoUrl) setPhotoUrl(u.photoUrl)
      getProfile(u.uid).then(profile => {
        if (profile?.photoUrl) { setPhotoUrl(profile.photoUrl); setPhotoErr(false) }
      }).catch(() => {})
    }
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      height: 'var(--nav)', background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
      boxShadow: '0 1px 16px rgba(155,92,246,0.07)'
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎤</div>
        <span className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Karaoke King</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <Link href="/upload" className="btn btn-grad" style={{ padding: '7px 16px', fontSize: 13 }}>+ Upload</Link>
            <Link href="/profile" style={{ display: 'block', flexShrink: 0 }}>
              {photoUrl && !photoErr
                ? <img
                    src={photoUrl}
                    alt="profile"
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--purple)', display: 'block' }}
                    onError={() => setPhotoErr(true)}
                  />
                : <NavPersonAvatar size={34} />
              }
            </Link>
          </>
        ) : (
          <Link href="/login" className="btn btn-grad" style={{ padding: '8px 20px', fontSize: 13 }}>Sign In</Link>
        )}
      </div>
    </header>
  )
}
