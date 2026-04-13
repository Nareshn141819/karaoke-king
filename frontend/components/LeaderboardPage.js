"use client"
import { useState } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
const DEMO = [
  { id: '1', uid: 'KingVoice99', rank: 'Platinum', avg: 94, song: 'Bohemian Rhapsody', p: 96, t: 93, e: 93 },
  { id: '2', uid: 'StarDust', rank: 'Gold', avg: 82, song: "Sweet Child O' Mine", p: 85, t: 80, e: 81 },
  { id: '3', uid: 'NightOwl', rank: 'Gold', avg: 77, song: 'Smells Like Teen Spirit', p: 79, t: 76, e: 76 },
  { id: '4', uid: 'MelodyMaster', rank: 'Silver', avg: 68, song: 'Let It Be', p: 70, t: 65, e: 69 },
  { id: '5', uid: 'VocalHero', rank: 'Silver', avg: 62, song: 'Wonderwall', p: 61, t: 64, e: 61 },
  { id: '6', uid: 'StageFright', rank: 'Bronze', avg: 45, song: 'My Way', p: 44, t: 47, e: 44 },
]
const RS = { Platinum: { c: '#7C3AED', bg: '#F5F0FF', bd: '#C4B5FD', e: '💎' }, Gold: { c: '#B45309', bg: '#FFFBEB', bd: '#FCD34D', e: '🥇' }, Silver: { c: '#4B5563', bg: '#F9FAFB', bd: '#9CA3AF', e: '🥈' }, Bronze: { c: '#92400E', bg: '#FEF3C7', bd: '#D97706', e: '🥉' } }
const M = ['🥇', '🥈', '🥉']
export default function LeaderboardPage() {
  const [f, setF] = useState('all')
  const list = f === 'all' ? DEMO : DEMO.filter(x => x.rank === f)
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(var(--nav) + 20px) 16px calc(var(--bot) + 24px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 28 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Top voices on Karaoke King</p>
        </div>
        {/* Podium top 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
          {[1, 0, 2].map(i => {
            const it = DEMO[i]; const r = RS[it.rank] || RS.Bronze; const top = i === 0
            return (
              <div key={i} className="card" style={{ padding: '16px 12px', textAlign: 'center', background: top ? 'var(--grad)' : 'white', transform: top ? 'translateY(-10px)' : 'none' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{M[i]}</div>
                <div className="av" style={{ width: 42, height: 42, fontSize: 15, margin: '0 auto 8px', background: top ? 'rgba(255,255,255,0.25)' : 'var(--grad)' }}>
                  {it.uid[0]}
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: top ? 'white' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.uid}</div>
                <div className={top ? '' : 'grad-text'} style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 26, color: top ? 'white' : undefined, marginTop: 4 }}>{it.avg}</div>
              </div>
            )
          })}
        </div>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['all', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(x => (
            <button key={x} onClick={() => setF(x)} className={`btn ${f === x ? 'btn-grad' : 'btn-soft'}`} style={{ padding: '7px 18px', fontSize: 13 }}>
              {x === 'all' ? 'All' : x}
            </button>
          ))}
        </div>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((it, i) => {
            const r = RS[it.rank] || RS.Bronze
            return (
              <div key={it.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 30, textAlign: 'center', flexShrink: 0 }}>
                  {i < 3 && f === 'all' ? <span style={{ fontSize: 20 }}>{M[i]}</span> : <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--text3)' }}>#{i + 1}</span>}
                </div>
                <div className="av" style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}>{it.uid[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{it.uid}</span>
                    <span className="chip" style={{ fontSize: 10, color: r.c, background: r.bg, border: `1px solid ${r.bd}` }}>{r.e} {it.rank}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{it.song}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 26 }}>{it.avg}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>pts</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
