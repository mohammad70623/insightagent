import React from 'react';
import { ShieldAlert, X, RefreshCw, AlertCircle, Upload, FileText, Zap } from 'lucide-react';

/** Lightweight inline markdown → JSX renderer. No external deps. */
const Markdown = ({ text }) => {
  if (!text) return null;

  const SECTION_STYLES = {
    strength:   { color: '#34d399', bg: 'rgba(52,211,153,0.07)',  icon: '💪' },
    weakness:   { color: '#f87171', bg: 'rgba(248,113,113,0.07)', icon: '⚠️' },
    opportunit: { color: '#38bdf8', bg: 'rgba(56,189,248,0.07)',  icon: '🚀' },
    threat:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',  icon: '🛡️' },
    strategic:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', icon: '📊' },
    summary:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', icon: '📊' },
  };

  const sectionStyle = (heading) => {
    const h = heading.toLowerCase();
    return Object.entries(SECTION_STYLES).find(([k]) => h.includes(k))?.[1]
      ?? { color: '#818cf8', bg: 'rgba(129,140,248,0.07)', icon: '•' };
  };

  // Parse **bold** in a line of text
  const parseBold = (line) => {
    const parts = [];
    let last = 0, m, re = /\*\*(.+?)\*\*/g;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push(<strong key={m.index} style={{ color: '#fff', fontWeight: 700 }}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts.length ? parts : line;
  };

  const lines = text.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      const s = sectionStyle(line.slice(3));
      out.push(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginTop:22, marginBottom:8, padding:'7px 12px', background:s.bg, borderRadius:8, border:`1px solid ${s.color}33` }}>
          <span>{s.icon}</span>
          <span style={{ color:s.color, fontSize:11, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>
            {line.slice(3)}
          </span>
        </div>
      ); i++; continue;
    }

    if (line.startsWith('# ')) {
      out.push(<h1 key={i} style={{ color:'#fff', fontSize:17, fontWeight:800, margin:'14px 0 10px', paddingBottom:8, borderBottom:'1px solid rgba(99,102,241,0.18)' }}>{line.slice(2)}</h1>);
      i++; continue;
    }

    if (line.startsWith('### ')) {
      out.push(<h3 key={i} style={{ color:'#e5e7eb', fontSize:13, fontWeight:700, margin:'12px 0 6px' }}>{line.slice(4)}</h3>);
      i++; continue;
    }

    if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      out.push(
        <pre key={i} style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 14px', fontSize:11, color:'#6ee7b7', fontFamily:'monospace', margin:'8px 0', overflowX:'auto' }}>
          {code.join('\n')}
        </pre>
      ); i++; continue;
    }

    if (/^[-*] /.test(line)) {
      const bullets = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { bullets.push(lines[i].slice(2)); i++; }
      out.push(
        <ul key={i} style={{ margin:'4px 0 10px', padding:0, listStyle:'none' }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5, fontSize:13, color:'#d1d5db', lineHeight:1.65 }}>
              <span style={{ marginTop:7, width:5, height:5, borderRadius:'50%', background:'#6366f1', flexShrink:0, display:'inline-block' }} />
              <span>{parseBold(b)}</span>
            </li>
          ))}
        </ul>
      ); continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      out.push(<hr key={i} style={{ border:'none', borderTop:'1px solid rgba(99,102,241,0.12)', margin:'14px 0' }} />);
      i++; continue;
    }

    if (line.trim()) {
      out.push(<p key={i} style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7, marginBottom:7 }}>{parseBold(line)}</p>);
    }
    i++;
  }

  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
// SwotModal — pure display panel, all state owned by parent (SwotButton)
// ─────────────────────────────────────────────────────────────────────────────
const SwotModal = ({ isOpen, onClose, hasFiles, swotData, loading, onRefresh }) => {
  if (!isOpen) return null;

  const isError = swotData && (swotData.startsWith('Failed') || swotData.startsWith('## ⚠️') || swotData.startsWith('## No'));

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}
    >
      <div style={{ position:'relative', width:'100%', maxWidth:740, maxHeight:'88vh', display:'flex', flexDirection:'column', borderRadius:20, background:'linear-gradient(145deg,#111827,#0d1117)', border:'1px solid rgba(99,102,241,0.2)', boxShadow:'0 0 80px rgba(99,102,241,0.12),0 32px 80px rgba(0,0,0,0.7)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid rgba(99,102,241,0.12)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShieldAlert size={17} style={{ color:'#818cf8' }} />
            </div>
            <div>
              <div style={{ color:'#fff', fontSize:13, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace' }}>AI Strategic SWOT Intelligence</div>
              <div style={{ color:'#6b7280', fontSize:10, fontFamily:'monospace', marginTop:2 }}>
                {hasFiles ? 'Powered by your uploaded documents · LLaMA 3 70B' : 'No documents uploaded yet'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {!loading && swotData && !isError && (
              <button onClick={onRefresh} style={iconBtn} title="Re-generate">
                <RefreshCw size={13} />
              </button>
            )}
            <button onClick={onClose} style={iconBtn}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

          {/* No files uploaded */}
          {!hasFiles && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:18, padding:'40px 24px' }}>
              <div style={{ width:70, height:70, borderRadius:18, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Upload size={28} style={{ color:'#818cf8' }} />
              </div>
              <div>
                <div style={{ color:'#fff', fontSize:15, fontWeight:700, marginBottom:8 }}>Upload a Document First</div>
                <div style={{ color:'#9ca3af', fontSize:13, lineHeight:1.7, maxWidth:380 }}>
                  The SWOT analysis is powered by <strong style={{ color:'#fff' }}>your own business documents</strong>.
                  Go to the <strong style={{ color:'#a5b4fc' }}>Data Upload</strong> page, upload a file,
                  then come back and click SWOT.
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 18px', borderRadius:10, background:'rgba(99,102,241,0.06)', border:'1px dashed rgba(99,102,241,0.2)' }}>
                <FileText size={14} style={{ color:'#818cf8' }} />
                <span style={{ fontSize:12, color:'#9ca3af' }}>Supported: <strong style={{ color:'#e5e7eb' }}>PDF · CSV · TXT · JSON</strong></span>
              </div>
              <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontFamily:'monospace', color:'#818cf8', background:'none', border:'none', cursor:'pointer' }}>
                <Zap size={12} /> Go to Data Upload
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:14 }}>
              <div style={{ position:'relative', width:50, height:50 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#6366f1', animation:'swot-spin 1s linear infinite' }} />
                <div style={{ position:'absolute', inset:6, borderRadius:'50%', background:'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ShieldAlert size={14} style={{ color:'#818cf8' }} />
                </div>
              </div>
              <div style={{ color:'#a5b4fc', fontSize:11, fontFamily:'monospace', letterSpacing:'0.14em' }}>Analyzing Strengths & Risks...</div>
            </div>
          )}

          {/* Error / special state */}
          {!loading && swotData && isError && (
            <div style={{ borderRadius:12, padding:20, background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.18)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <AlertCircle size={20} style={{ color:'#f87171', flexShrink:0, marginTop:2 }} />
                <div style={{ flex:1 }}><Markdown text={swotData} /></div>
              </div>
            </div>
          )}

          {/* Full SWOT report */}
          {!loading && swotData && !isError && (
            <Markdown text={swotData} />
          )}

        </div>

        {/* Footer */}
        {!loading && swotData && !isError && (
          <div style={{ padding:'10px 24px', borderTop:'1px solid rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#34d399' }} />
              <span style={{ color:'#6b7280', fontSize:10, fontFamily:'monospace' }}>Grounded in your uploaded documents</span>
            </div>
            <button onClick={onClose} style={{ fontSize:11, fontFamily:'monospace', color:'#6b7280', background:'rgba(255,255,255,0.04)', border:'none', padding:'5px 14px', borderRadius:7, cursor:'pointer' }}>CLOSE</button>
          </div>
        )}
      </div>

      <style>{`@keyframes swot-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const iconBtn = { width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#9ca3af' };

export default SwotModal;
