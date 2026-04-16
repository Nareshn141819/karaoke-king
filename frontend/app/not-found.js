"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D0020 0%, #1A0040 50%, #0D0020 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Nunito', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,78,138,0.18) 0%, transparent 70%)',
        animation: 'float1 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,92,246,0.2) 0%, transparent 70%)',
        animation: 'float2 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Floating music notes */}
      {mounted && ['🎵', '🎶', '🎤', '🎸', '🎹'].map((emoji, i) => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: 24 + (i % 3) * 10,
          opacity: 0.12 + i * 0.04,
          top: `${10 + i * 18}%`,
          left: `${5 + i * 20}%`,
          animation: `drift${i % 2 === 0 ? 'L' : 'R'} ${5 + i}s ease-in-out infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>{emoji}</div>
      ))}

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        animation: mounted ? 'pageIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
        opacity: 0,
      }}>
        {/* Glowing 404 */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{
            fontSize: 'clamp(100px, 20vw, 160px)',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #FF4E8A 0%, #9B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(255,78,138,0.4))',
          }}>404</div>
          <div style={{
            position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
            width: '60%', height: 20,
            background: 'rgba(155,92,246,0.3)',
            filter: 'blur(20px)',
            borderRadius: '50%',
          }} />
        </div>

        <div style={{
          fontSize: 64, marginBottom: 16,
          animation: 'micBounce 1.5s ease-in-out infinite',
          display: 'inline-block',
        }}>🎤</div>

        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(22px, 5vw, 32px)',
          color: 'white',
          marginBottom: 10,
          letterSpacing: '-0.5px',
        }}>Oops! Wrong Stage</h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 'clamp(14px, 3vw, 16px)',
          maxWidth: 380,
          margin: '0 auto 32px',
          lineHeight: 1.7,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has taken the night off.
          <br />Let&apos;s get you back to the spotlight! 🌟
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 50,
            background: 'linear-gradient(135deg, #FF4E8A 0%, #9B5CF6 100%)',
            color: 'white', fontWeight: 800, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(255,78,138,0.4)',
            fontFamily: "'Nunito', sans-serif",
          }}>
            🏠 Return Home
          </Link>
          <Link href="/feed" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 24px', borderRadius: 50,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            color: 'white', fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
            border: '1.5px solid rgba(255,255,255,0.25)',
            fontFamily: "'Nunito', sans-serif",
          }}>
            🎵 Browse Feed
          </Link>
        </div>

        <div style={{
          marginTop: 48, color: 'rgba(255,255,255,0.2)',
          fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
        }}>
          Karaoke King · Sing. Score. Shine.
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@900&display=swap');
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes micBounce {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(30px, -20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-25px, 15px); }
        }
        @keyframes driftL {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50%       { transform: translateX(15px) rotate(15deg); }
        }
        @keyframes driftR {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50%       { transform: translateX(-15px) rotate(-15deg); }
        }
      `}</style>
    </div>
  )
}
