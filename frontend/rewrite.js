const fs = require('fs');
const lines = fs.readFileSync('c:/Users/ACER/Downloads/karaoke-king-v2/kk/frontend/components/Studio.js', 'utf8').split('\n');

const newReturn = `  return (
    <div style={{ position: 'fixed', inset: 0, background: 'url(/studio_bg.png) center/cover', zIndex: 1000, display: 'flex', flexDirection: 'column', color: 'white', fontFamily: "'Nunito',sans-serif" }}>
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(20,5,25,0.75) 0%, rgba(10,2,15,0.98) 100%)', zIndex: 0 }} />

      {/* Top Header & Pitch Track */}
      <div className="studio-enter-up" style={{ padding: '30px 20px 10px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 20, cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: 18 }}>←</button>
          <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
             <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--pink)', letterSpacing: 2 }}>NOW SINGING</div>
             <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeHtml(song.title)}</div>
          </div>
          <button onClick={() => setPaste(v=>!v)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 20, cursor: 'pointer', backdropFilter: 'blur(10px)', fontSize: 16 }} title="Paste Lyrics">📝</button>
        </div>

        {/* Real-time Pitch Track (Smule visual style) */}
        <div style={{ position: 'relative', height: 48, background: 'rgba(0,0,0,0.5)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, borderLeft: '2px solid var(--pink)', zIndex: 10, boxShadow: '0 0 16px var(--pink)' }} />
          <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', left: '20%', transform: \\\`translateX(-\\\${dur * 40}px)\\\`, transition: phase === 'rec' ? 'transform 1s linear' : 'none' }}>
            {activeTimed?.map((l, i) => (
               <div key={i} style={{ width: Math.max(16, l.text.length * 2.2), marginRight: 60, height: 6, borderRadius: 4, background: i === ai ? 'var(--pink)' : 'rgba(255,255,255,0.2)', transition: 'background 0.2s', boxShadow: i === ai ? '0 0 10px var(--pink)' : 'none' }} />
            ))}
            {!activeTimed && <div style={{ width: 2000, height: 4, background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%)', backgroundSize: '40px 100%' }} />}
          </div>
          <div style={{ position: 'absolute', right: 16, fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>0 Points &nbsp; C &nbsp; B &nbsp; A &nbsp; A+</div>
        </div>
      </div>

      {/* Main Lyrics Area */}
      <div className="studio-enter-left" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', zIndex: 1 }}>
        {paste ? (
          <div style={{ width: '100%', maxWidth: 500, background: 'rgba(0,0,0,0.6)', padding: 24, borderRadius: 20, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h3 style={{ fontSize: 16, marginBottom: 12, fontWeight: 800 }}>Paste Custom Lyrics</h3>
             <textarea value={manual} onChange={e => setManual(e.target.value)} placeholder="Line 1\\nLine 2..." style={{ width: '100%', height: 200, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.8, borderRadius: 12, padding: 12, fontFamily: "'Nunito',sans-serif" }} />
             <button onClick={() => setPaste(false)} className="btn btn-grad" style={{ width: '100%', padding: '14px', marginTop: 16, fontSize: 15 }}>Apply Lyrics</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 640 }}>
             {al ? (
               win.map((l, i) => {
                 const active = i === ai;
                 const past = i < ai;
                 return (
                   <div key={i} style={{ 
                     fontSize: active ? 36 : 22, 
                     fontWeight: active ? 900 : 700, 
                     color: active ? 'var(--pink)' : past ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                     textShadow: active ? '0 0 30px rgba(255,78,138,0.8)' : 'none',
                     transform: active ? 'scale(1.05)' : 'scale(1)',
                     transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                     margin: active ? '20px 0' : '10px 0', 
                     lineHeight: 1.3
                   }}>{l}</div>
                 )
               })
             ) : (
               <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 600 }}>
                 {lLoad ? (
                   <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 10 }}>
                     <div className="spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--pink)' }} />
                     Fetching lyrics...
                   </div>
                 ) : lErr ? (
                   <div>No lyrics found.<br/><span style={{fontSize: 14, opacity: 0.7}}>Tap 📝 to paste manually</span></div>
                 ) : 'Search or Paste lyrics'}
               </div>
             )}
          </div>
        )}

        {/* Small Video Embed inside studio */}
        {song.videoId && (
           <div style={{ position: 'absolute', right: 20, bottom: 20, width: 140, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', opacity: 0.5, transition: 'all 0.3s ease', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)' }} onMouseEnter={e=>{e.currentTarget.style.opacity=1; e.currentTarget.style.transform='scale(1.1) translateY(-10px)'}} onMouseLeave={e=>{e.currentTarget.style.opacity=0.5; e.currentTarget.style.transform='scale(1) translateY(0)'}}>
              <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, fontWeight: 900, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, zIndex: 10 }}>MUSIC VIDEO</div>
              <EmbedPlayer videoId={song.videoId} />
           </div>
        )}
      </div>

      {/* Bottom Control Dock */}
      <div className="studio-enter-up" style={{ padding: '0 20px 40px', position: 'relative', zIndex: 11 }}>
        
        {/* Status / Errors */}
        {err && <div style={{ background: 'rgba(224,40,74,0.15)', border: '1px solid rgba(224,40,74,0.4)', color: '#FF6B6B', textAlign: 'center', padding: '10px', borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>⚠️ {err}</div>}
        {phase === 'processing' && <div style={{ textAlign: 'center', color: 'var(--pink)', fontWeight: 800, marginBottom: 16, fontSize: 16, animation: 'pulse 1.5s infinite' }}>Analysing your brilliant performance...</div>}

        {/* Live Mixer Popup */}
        {showMix && (
          <div className="studio-enter-up" style={{ background: 'rgba(15,8,25,0.92)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, padding: '24px', marginBottom: 20, position: 'absolute', bottom: 130, left: 20, right: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
               <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>🎧 Voice Monitor</span>
               <div className="toggle" style={{ background: mon ? 'var(--grad)' : 'rgba(255,255,255,0.2)' }} onClick={() => setMon(v => !v)}>
                 <div className="toggle-knob" style={{ left: mon ? 23 : 3 }} />
               </div>
             </div>
             {mon && (
               <div style={{ marginBottom: 24 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontWeight: 700 }}>
                   <span>Monitor Volume</span>
                   <span style={{ color: 'white' }}>{Math.round(monVol*100)}%</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.05" value={monVol} onChange={e => setMonVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--pink)' }} />
               </div>
             )}
             <div style={{ marginBottom: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontWeight: 700 }}>
                 <span>Instrumental Volume</span>
                 <span style={{ color: 'white' }}>{Math.round(instrVol*100)}%</span>
               </div>
               <input type="range" min="0" max="1" step="0.05" value={instrVol} onChange={e => setInstrVol(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)' }} />
             </div>
             <button onClick={() => setReverb(v=>!v)} className="btn" style={{ background: reverb ? 'var(--grad)' : 'rgba(255,255,255,0.1)', color: 'white', width: '100%', padding: '12px', fontSize: 15, borderRadius: 12, border: reverb ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
               ✨ Studio Reverb {reverb?'On':'Off'}
             </button>
             <button onClick={() => setShowMix(false)} style={{ width: '100%', background: 'transparent', border:'none', color:'rgba(255,255,255,0.5)', marginTop: 12, padding: 8, cursor: 'pointer', fontWeight: 700 }}>Close Mixer</button>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.6)', padding: '12px 28px', borderRadius: 60, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
           
           {/* Headphones Toggle */}
           <button onClick={() => setMon(v=>!v)} style={{ background: 'transparent', border: 'none', color: mon ? 'var(--pink)' : 'rgba(255,255,255,0.4)', fontSize: 24, cursor: 'pointer', transition: 'color 0.2s', position: 'relative' }}>
             🎧
             {mon && <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: 'var(--pink)' }} />}
           </button>

           {/* Mixer Slider Toggle */}
           <button onClick={() => setShowMix(v=>!v)} style={{ background: 'transparent', border: 'none', color: showMix ? 'var(--purple)' : 'rgba(255,255,255,0.8)', fontSize: 26, cursor: 'pointer', transition: 'color 0.2s' }}>
             🎛
           </button>
           
           {/* Giant Center Record/Stop */}
           <div style={{ position: 'relative' }}>
             {phase === 'rec' && <div className="pulse-ring" />}
             <button 
               disabled={phase === 'processing'}
               onClick={phase === 'ready' ? startRec : stopRec} 
               style={{ 
                 position: 'relative', zIndex: 2,
                 width: 76, height: 76, borderRadius: '38px', border: 'none', 
                 background: phase === 'ready' ? 'var(--grad)' : 'rgba(230,40,70,1)', 
                 color: 'white', fontSize: 32, cursor: 'pointer', 
                 boxShadow: phase === 'rec' ? '0 0 30px rgba(230,40,70,0.8)' : '0 10px 30px rgba(255,78,138,0.5)',
                 transform: 'translateY(-20px)', transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
             }}>
               {phase === 'ready' ? '🎤' : '⏹'}
             </button>
             {phase === 'rec' && <div style={{ position: 'absolute', bottom: -16, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: 900, color: 'var(--pink)', textShadow: '0 0 10px var(--pink)' }}>{fmt(dur)}</div>}
           </div>

           {/* Refresh / Redo */}
           <button disabled={phase==='rec'} onClick={() => { if(confirm("Discard and start over?")){ setPhase('ready'); setDur(0); setLine(0); setErr(null) } }} style={{ background: 'transparent', border: 'none', color: phase==='rec' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)', fontSize: 22, cursor: phase==='rec'?'default':'pointer' }}>
             🔄
           </button>
           
           {/* Done / Checkmark */}
           <button disabled={phase!=='rec'} onClick={stopRec} style={{ background: 'transparent', border: 'none', color: phase==='rec' ? '#10B981' : 'rgba(255,255,255,0.2)', fontSize: 26, cursor: phase==='rec'?'pointer':'default', textShadow: phase==='rec' ? '0 0 15px rgba(16,185,129,0.5)' : 'none' }}>
             ✅
           </button>
        </div>

        {/* Live Audio Waveform visualizer */}
        {phase === 'rec' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, marginTop: 24, height: 40 }}>
             {bars.map((h, i) => (
                <div key={i} style={{ 
                  width: 4, height: Math.max(4, Math.min(40, h * 0.8)), 
                  background: \`hsl(\${320 + i * 2}, 80%, 65%)\`, 
                  borderRadius: 2, transition: 'height 0.05s',
                  boxShadow: '0 0 10px rgba(255,78,138,0.3)'
                }} />
             ))}
          </div>
        )}
      </div>

      {/* Earphone Tip Overlay */}
      {showTip && (
        <div className="studio-enter-up" style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'rgba(20,10,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 360, textAlign: 'center', color: 'white', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: 50, marginBottom: 16, animation: 'studioFadeUp 0.8s ease' }}>🎧</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Before You Sing!</h2>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 auto 24px', textAlign: 'left', display: 'inline-block' }}>
               🎤 <strong>Keep your mic close</strong> to your mouth.<br/>
               🎧 <strong>Use wired earphones</strong> to prevent echo and delay.<br/>
            </div>
            <button onClick={() => setShowTip(false)} className="btn btn-grad" style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 16 }}>Got it, Let's Sing!</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmbedPlayer({ videoId }) {
  const url = \`https://www.youtube.com/watch?v=\${videoId}\`
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
      <iframe src={\`https://www.youtube.com/embed/\${videoId}?controls=1&rel=0&enablejsapi=1&origin=\${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}\`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen />
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: 'white', textDecoration: 'none', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF0000', marginRight: 2 }} /> If blocked..
      </a>
    </div>
  )
}
`

const top = lines.slice(0, 327).join('\n');
fs.writeFileSync('c:/Users/ACER/Downloads/karaoke-king-v2/kk/frontend/components/Studio.js', top + '\n' + newReturn);
