"use client"
import { useEffect, useState } from 'react'
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const ReelIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" /><line x1="7" x2="7" y1="2" y2="22" /><line x1="17" x2="17" y1="2" y2="22" /><line x1="2" x2="7" y1="12" y2="12" /><line x1="2" x2="7" y1="7" y2="7" /><line x1="2" x2="7" y1="17" y2="17" /><line x1="17" x2="22" y1="12" y2="12" /><line x1="17" x2="22" y1="7" y2="7" /><line x1="17" x2="22" y1="17" y2="17" /></svg>
const TrophyIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>

const TABS = [
  { href: '/', icon: <HomeIcon />, label: 'Home' },
  { href: '/feed', icon: <ReelIcon />, label: 'Feed' },
  { href: '/leaderboard', icon: <TrophyIcon />, label: 'Ranks' },
  { href: '/profile', icon: <UserIcon />, label: 'Me' },
]
export default function BottomNav() {
  const [p, setP] = useState('')
  useEffect(() => setP(window.location.pathname), [])
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      height: 'var(--bot)', background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(24px)', borderTop: '1px solid var(--border)',
      display: 'flex', boxShadow: '0 -2px 20px rgba(155,92,246,0.08)'
    }}>
      {TABS.map(t => {
        const on = p === t.href || (t.href !== '/' && p.startsWith(t.href))
        return (
          <a key={t.href} href={t.href} className="nav-btn" style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            textDecoration: 'none', padding: '6px 0',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? 'var(--pink)' : 'var(--text3)' }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: on ? 900 : 700, color: on ? 'var(--pink)' : 'var(--text3)', transition: 'color 0.15s' }}>{t.label}</span>
            {on && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--pink)', marginTop: 1 }} />}
          </a>
        )
      })}
    </nav>
  )
}
