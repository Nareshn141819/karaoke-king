const fs = require('fs');
const lines = fs.readFileSync('c:/Users/ACER/Downloads/karaoke-king-v2/kk/frontend/components/Studio.js', 'utf8').split('\n');

const newReturn = `  return (
    <div style={{ minHeight: '100vh', background: 'url(/studio_bg.png) center/cover fixed', position: 'relative' }}>
      {/* Light overlay to make cards pop brighter */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Earphone/Mic Tip Popup ── */}
        {showTip && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10,0,30,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: '32px 28px', maxWidth: 380, width: '100%',
              textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
              animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎧</div>
              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 12 }}>Before You Sing!</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 8 }}>🎤 <strong>Keep your mic close</strong> to your mouth</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 24 }}>🎧 <strong>Use wired earphones / headphones</strong> for the best experience and to avoid feedback</div>
              <button onClick={() => setShowTip(false)} style={{ width: '100%', padding: '14px', borderRadius: 50, border: 'none', background: 'var(--grad)', color: 'white', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,78,138,0.4)' }}>Got it, Let's Sing! 🎤</button>
            </div>
            <style>{\`@keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}\`}</style>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', padding: '13px 18px',
          display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 50, border: 'none', background: 'var(--surface)', cursor: 'pointer', fontSize: 16 }}>←</button>
          {song.thumbnail && <img src={song.thumbnail} alt="" style={{ width: 42, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: 2 }}>NOW SINGING</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeHtml(song.title)}</div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 100px' }}>

          {/* ── MONITOR CARD ── */}
          <div className="card slide-up" style={{ padding: '16px 20px', marginBottom: 14, background: mon ? 'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,1))' : 'white', border: mon ? '2px solid rgba(155,92,246,0.5)' : '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 26 }}>🎧</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Voice Monitoring & Mixing</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{mon ? 'Hear yourself clearly in earphones' : 'Toggle to enable monitoring and mixing'}</div>
              </div>
              <div className="toggle" style={{ background: mon ? 'var(--grad)' : '#D1D5DB' }} onClick={() => setMon(v => !v)}>
                <div className="toggle-knob" style={{ left: mon ? 23 : 3 }} />
              </div>
            </div>
            {mon && (
              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 30 }}>
                {/* Mon Volume */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Voice Vol</span><span>{Math.round(monVol * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={monVol} onChange={e => setMonVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--pink)', cursor: 'pointer' }} />
                </div>
                {/* Instr Volume */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Music Vol</span><span>{Math.round(instrVol * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={instrVol} onChange={e => setInstrVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)', cursor: 'pointer' }} />
                </div>
                {/* Reverb */}
                <button disabled={phase !== 'ready'} onClick={() => phase === 'ready' && setReverb(v => !v)} className="btn btn-soft" style={{ padding: '8px 20px', fontSize: 13, background: reverb ? 'var(--grad)' : 'var(--surface)', color: reverb ? 'white' : 'var(--text2)', border: reverb ? 'none' : '1px solid var(--border)', opacity: phase !== 'ready' ? 0.5 : 1 }}>✨ Reverb {reverb ? 'On' : 'Off'}</button>
              </div>
            )}
          </div>

          {/* ── VIDEO + LYRICS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
            <div className="card slide-right" style={{ padding: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>🎵 Music</div>
              {song.videoId ? (
                <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <EmbedPlayer videoId={song.videoId} />
                </div>
              ) : song.instrumentalUrl ? (
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🎼</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>Instrumental loaded</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Auto-plays when you record</div>
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🔇</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Search a YouTube song for music</div>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>💡 {song.instrumentalUrl ? 'Instrumental auto-mixes with your voice' : 'Music plays on record'}</div>
            </div>

            <div className="card slide-left" style={{ padding: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>🎤 Lyrics</div>
                  {activeTimed?.length > 0 && <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, marginTop: 1 }}>⏱ Timed · {activeTimed.length} lines</div>}
                </div>
                <button onClick={() => setPaste(v => !v)} className="btn btn-soft" style={{ padding: '4px 10px', fontSize: 11 }}>{paste ? 'Hide' : '✏️ Paste'}</button>
              </div>
              {paste ? (
                <div>
                  <textarea value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste lyrics (one line per row)…" style={{ width: '100%', height: 145, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: 10, fontSize: 12, resize: 'none', fontFamily: "'Nunito',sans-serif", outline: 'none', lineHeight: 1.9 }} />
                  {manual && <button onClick={() => setPaste(false)} className="btn btn-grad" style={{ marginTop: 8, padding: '6px 14px', fontSize: 12 }}>✓ Use lyrics</button>}
                </div>
              ) : (
                <div style={{ minHeight: 120 }}>
                  {lLoad && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Fetching lyrics…</div>}
                  {lErr && !manual && <div style={{ textAlign: 'center', padding: '20px 0' }}><div style={{ fontSize: 28, marginBottom: 8 }}>😔</div><div style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.9 }}>Lyrics not found<br /><span style={{ fontSize: 11 }}>Try "Artist - Title" or ✏️ Paste manually</span></div></div>}
                  {al && !lLoad && win.map((l, i) => (
                    <div key={i} style={{ padding: '5px 10px 5px 12px', fontSize: i === ai ? 16 : 13, fontWeight: i === ai ? 900 : 700, color: i === ai ? 'var(--pink)' : 'var(--text3)', borderLeft: \`3px solid \${i === ai ? 'var(--pink)' : 'transparent'}\`, background: i === ai ? 'rgba(255,78,138,0.08)' : 'transparent', borderRadius: 6, transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)', lineHeight: 1.5, marginBottom: 2, transform: i === ai ? 'scale(1.03)' : 'scale(1)' }}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RECORDING CONTROLS ── */}
          <div className="card slide-up" style={{ padding: '28px 20px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.98)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, marginBottom: 24 }}>
              {bars.map((h, i) => (
                <div key={i} className="wbar" style={{ height: h, width: 6, borderRadius: 3, animationDelay: \`\${(i % 8) * 0.1}s\`, background: phase === 'rec' ? \`hsl(\${300 + i * 2},75%,56%)\` : 'var(--border)', animationPlayState: phase === 'rec' ? 'running' : 'paused', transition: 'height 0.1s' }} />
              ))}
            </div>

            {phase === 'rec' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--pink)', animation: 'pulse 1s ease-out infinite' }} />
                <span className="grad-text" style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 32 }}>{fmt(dur)}</span>
              </div>
            )}

            {phase !== 'processing' ? (
              <div className="pop-in-mic" style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                {phase === 'rec' && <div className="pulse-ring" style={{ inset: -20, opacity: 0.5 }} />}
                <button onClick={phase === 'ready' ? startRec : stopRec} style={{ position: 'relative', zIndex: 1, width: 100, height: 100, borderRadius: '50%', border: 'none', background: phase === 'ready' ? 'var(--grad)' : 'linear-gradient(135deg,#FF4444,#CC0000)', cursor: 'pointer', fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: phase === 'ready' ? '0 10px 40px rgba(255,78,138,0.5)' : '0 10px 40px rgba(255,0,0,0.6)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform: phase === 'rec' ? 'scale(1.1)' : 'scale(1)' }}>
                  {phase === 'ready' ? '🎤' : '⏹'}
                </button>
              </div>
            ) : (
              <div className="spin" style={{ margin: '0 auto 14px', width: 60, height: 60, borderWidth: 5 }} />
            )}

            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text2)' }}>
              {phase === 'ready' && 'Tap mic to start · Sing along!'}
              {phase === 'rec' && 'Recording · Tap ⏹ to finish'}
              {phase === 'processing' && 'Analysing your performance…'}
            </div>

            {err && <div style={{ marginTop: 14, background: '#FFF0F2', border: '1px solid #FBBFD0', borderRadius: 10, padding: '12px 16px', color: '#E0284A', fontSize: 13, fontWeight: 700 }}>⚠️ {err}</div>}
          </div>
        </div>
      </div>
      <style>{\`
        @keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.2);opacity:0}}
        .wbar { transform-origin: bottom; }
      \`}</style>
    </div>
  )
}

function EmbedPlayer({ videoId }) {
  const url = \`https://www.youtube.com/watch?v=\${videoId}\`
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
      <iframe src={\`https://www.youtube.com/embed/\${videoId}?controls=1&rel=0&enablejsapi=1&origin=\${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}\`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen />
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: 'white', textDecoration: 'none', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF0000', marginRight: 2 }} /> If blocked, open in YouTube
      </a>
    </div>
  )
}
`;

const top = lines.slice(0, 327).join('\n');
fs.writeFileSync('c:/Users/ACER/Downloads/karaoke-king-v2/kk/frontend/components/Studio.js', top + '\n' + newReturn);
