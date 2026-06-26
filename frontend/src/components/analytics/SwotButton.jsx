import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import SwotModal from './SwotModal';

/**
 * SwotButton — Global floating draggable button.
 * Self-contained: fetches its own file list and owns all SWOT state.
 * Mounted in DashboardLayout so it shows on every authenticated page.
 */
const SwotButton = () => {
  const [hasFiles, setHasFiles]     = useState(false);
  const [isOpen, setIsOpen]         = useState(false);
  const [swotData, setSwotData]     = useState(null);
  const [loading, setLoading]       = useState(false);

  // Drag state
  const [pos, setPos] = useState({
    x: window.innerWidth  - 90,
    y: window.innerHeight - 110,
  });
  const drag = useRef({ active: false, ox: 0, oy: 0, moved: false });
  const btnRef = useRef(null);

  // Check if user has uploaded files (runs once on mount for the initial button color)
  useEffect(() => {
    api.get('/chat/uploaded-files')
      .then(res => setHasFiles(Array.isArray(res.data) && res.data.length > 0))
      .catch(() => setHasFiles(false));
  }, []);

  // Fetch SWOT analysis from backend
  const fetchSwot = useCallback(async (force = false) => {
    setLoading(true);
    try {
      // 1. Verify files exist in real-time
      const filesRes = await api.get('/chat/uploaded-files');
      const filesExist = Array.isArray(filesRes.data) && filesRes.data.length > 0;
      setHasFiles(filesExist);

      if (!filesExist) {
        setSwotData(null);
        setLoading(false);
        return;
      }

      // 2. Fetch SWOT only if we don't have it already, or if forced
      if (!swotData || force) {
        if (force) setSwotData(null);
        const res = await api.get('/chat/analytics/swot');
        setSwotData(res.data.swot_markdown);
      }
    } catch {
      setSwotData('Failed to load SWOT analysis. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [swotData]);

  // Pointer-capture drag — no click-after-drag race condition
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    drag.current = { active: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y, moved: false };
    btnRef.current?.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return;
    drag.current.moved = true;
    setPos({
      x: Math.max(16, Math.min(window.innerWidth  - 68, e.clientX - drag.current.ox)),
      y: Math.max(16, Math.min(window.innerHeight - 68, e.clientY - drag.current.oy)),
    });
  }, []);

  const onPointerUp = useCallback(async () => {
    const wasDragged = drag.current.moved;
    drag.current = { active: false, ox: 0, oy: 0, moved: false };
    if (!wasDragged) {
      setIsOpen(true);
      await fetchSwot();
    }
  }, [fetchSwot]);

  return (
    <>
      {/* Floating Button */}
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position:    'fixed',
          left:        pos.x,
          top:         pos.y,
          zIndex:      99999,
          touchAction: 'none',
          width:       64,
          height:      64,
          borderRadius:'50%',
          border:      hasFiles ? '1.5px solid rgba(129,140,248,0.55)' : '1.5px solid rgba(255,255,255,0.08)',
          background:  hasFiles
            ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
            : 'linear-gradient(135deg,#1f2937,#374151)',
          boxShadow:   hasFiles
            ? '0 0 20px rgba(99,102,241,0.45),0 6px 24px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.4)',
          cursor:      'grab',
          display:     'flex',
          flexDirection:'column',
          alignItems:  'center',
          justifyContent:'center',
          gap:         3,
          userSelect:  'none',
          transition:  'background 0.3s,box-shadow 0.3s',
        }}
        title={hasFiles ? 'Click for AI SWOT Analysis' : 'Upload a document to enable SWOT'}
      >
        {loading
          ? <RefreshCw size={18} style={{ color: '#c7d2fe', animation: 'swot-spin 1s linear infinite' }} />
          : <>
              <ShieldAlert size={16} style={{ color: hasFiles ? '#c7d2fe' : '#6b7280' }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: hasFiles ? '#fff' : '#6b7280', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                SWOT
              </span>
            </>
        }
      </button>

      {/* Modal Panel */}
      <SwotModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        hasFiles={hasFiles}
        swotData={swotData}
        loading={loading}
        onRefresh={() => fetchSwot(true)}
      />

      <style>{`@keyframes swot-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
};

export default SwotButton;
