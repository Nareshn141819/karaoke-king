"use client"
import { useState, useEffect } from 'react'
import { getUser, getProfile } from '../lib/store'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    const u = getUser()
    setUser(u)
    if (u?.uid) {
      // Use cached photoUrl first, then fetch from Firestore
      if (u.photoUrl) setPhotoUrl(u.photoUrl)
      getProfile(u.uid).then(profile => {
        if (profile?.photoUrl) setPhotoUrl(profile.photoUrl)
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
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎤</div>
        <span className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Karaoke King</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <a href="/upload" className="btn btn-grad" style={{ padding: '7px 16px', fontSize: 13 }}>+ Upload</a>
            {/* Profile avatar — shows photo if available */}
            <a href="/profile" style={{ display: 'block', flexShrink: 0 }}>
              {photoUrl
                ? <img
                    src={photoUrl}
                    alt="profile"
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--purple)', display: 'block' }}
                  />
                : <div className="av" style={{ width: 34, height: 34, fontSize: 13 }}>
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
              }
            </a>
          </>
        ) : (
          <a href="/login" className="btn btn-grad" style={{ padding: '8px 20px', fontSize: 13 }}>Sign In</a>
        )}
      </div>
    </header>
  )
}
