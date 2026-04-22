"use client"
import { useState } from 'react'
import Link from 'next/link'
import { fbSignIn, fbSignUp, setUser, fbGoogleSignIn } from '../lib/store'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setErr('')
    if (!email || !pass) return setErr('Please fill in all fields')
    if (mode === 'register' && !name) return setErr('Please enter your stage name')
    setLoading(true)
    try {
      const u = mode === 'register' ? await fbSignUp(email, pass, name) : await fbSignIn(email, pass)
      setUser(u)
      window.location.href = '/'
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  const submitGoogle = async () => {
    setErr('')
    setLoading(true)
    try {
      const u = await fbGoogleSignIn()
      setUser(u)
      window.location.href = '/'
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 68, height: 68, borderRadius: 22, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(255,78,138,0.3)' }}>🎤</div>
          <h1 className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 30, marginBottom: 4 }}>Karaoke King</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account and start singing'}</p>
        </div>

        {/* Mode tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${mode === 'login' ? 'on' : ''}`} onClick={() => { setMode('login'); setErr('') }}>Sign In</button>
          <button className={`tab ${mode === 'register' ? 'on' : ''}`} onClick={() => { setMode('register'); setErr('') }}>Sign Up</button>
        </div>

        <div className="card" style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Stage Name</label>
                <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Your karaoke name" style={{ padding: '12px 14px' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Email</label>
              <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ padding: '12px 14px' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Password</label>
              <input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ padding: '12px 14px' }} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {err && <div style={{ background: '#FFF0F2', border: '1px solid #FBBFD0', borderRadius: 10, padding: '10px 14px', color: '#E0284A', fontSize: 13 }}>⚠️ {err}</div>}
            <button onClick={submit} disabled={loading} className="btn btn-grad" style={{ padding: '13px', fontSize: 15, width: '100%', opacity: loading ? .7 : 1 }}>
              {loading ? 'Please wait…' : mode === 'login' ? '🎤 Sign In' : '🎵 Create Account'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 700 }}>OR</div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={submitGoogle} disabled={loading} className="btn" style={{
          width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 12,
          background: 'white', border: '1px solid var(--border)', color: 'var(--text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1
        }}>
          <img src="https://www.google.com/favicon.ico" alt="G" style={{ width: 18, height: 18 }} />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text2)' }}>
          <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Continue as guest →</Link>
        </div>
      </div>
    </div>
  )
}
