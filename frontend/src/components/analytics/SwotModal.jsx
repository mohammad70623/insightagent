import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

const SwotModal = ({ swotData, isSwotOpen, setIsSwotOpen, swotLoading, fetchSwotAnalysis }) => {
  const [buttonPos, setButtonPos] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - buttonPos.x,
      y: e.clientY - buttonPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = Math.max(20, Math.min(window.innerWidth - 80, e.clientX - dragOffset.x));
      const newY = Math.max(20, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setButtonPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      <button 
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && fetchSwotAnalysis()}
        style={{ left: `${buttonPos.x}px`, top: `${buttonPos.y}px`, position: 'fixed', zIndex: 50 }}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-2xl flex items-center justify-center text-white font-mono text-xs font-bold tracking-tighter border border-indigo-400/30 cursor-grab active:cursor-grabbing transition-colors select-none"
      >
        SWOT
      </button>

      {isSwotOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-surface/80 border border-gray-800/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative backdrop-blur-xl max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setIsSwotOpen(false)} 
              className="absolute top-4 w-8 h-8 rounded-lg flex items-center justify-center right-4 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 text-brand-primary border-b border-gray-800 pb-3 mb-4">
              <ShieldAlert size={18} />
              <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white">AI Strategic SWOT Intelligence</h3>
            </div>

            {swotLoading ? (
              <div className="flex items-center justify-center h-48 text-xs font-mono tracking-widest text-brand-primary animate-pulse">
                GENERATING SWOT INSIGHT MATRIX...
              </div>
            ) : (
              <div className="text-xs text-gray-300 leading-relaxed font-sans space-y-4 whitespace-pre-wrap whitespace-pre-line text-left">
                {swotData}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SwotModal;
