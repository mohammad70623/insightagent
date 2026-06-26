import React, { useEffect, useState } from 'react';
import { createClient } from 'contentful';
import { Shield, Database, Bot, EyeOff, Server, Loader2, AlertCircle } from 'lucide-react';

// Initialize the Contentful client
const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

/**
 * PrivacyPolicyModal - Reusable global modal for displaying privacy documentation from Contentful.
 * Props:
 *   - isOpen (boolean): Controls whether the modal is visible.
 *   - onClose (function): Callback triggered when the modal should be closed.
 */
const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scroll leaking
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Fetch the privacy policy entry from Contentful
    const fetchPrivacyPolicy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.getEntries({
          content_type: 'privacyPolicy',
          limit: 1,
        });

        if (response.items && response.items.length > 0) {
          const fields = response.items[0].fields;
          
          // Case-insensitive/defensive field mapping to handle diverse Contentful schema variants
          setPolicy({
            title: fields.title || fields.Title || 'Privacy Policy',
            subtitle: fields.subtitle || fields.Subtitle || 'InsightAgent security and privacy details.',
            section1Title: fields.section1title || fields.section1Title || fields.Section1Title || '1. DATA INGESTION & COLLECTION',
            section1Bullet1: fields.section1bullet1 || fields.section1Bullet1 || fields.Section1Bullet1 || '',
            section2Title: fields.section2title || fields.section2Title || fields.Section2Title || '2. AI PIPELINE & MODEL TRANSPARENCY',
            card1Title: fields.card1title || fields.card1Title || fields.Card1Title || 'ZERO MODEL TRAINING',
            card1Body: fields.card1body || fields.card1Body || fields.Card1Body || '',
            card2Title: fields.card2title || fields.card2Title || fields.Card2Title || 'ISOLATED QDRANT VECTOR DB',
            card2Body: fields.card2body || fields.card2Body || fields.Card2Body || '',
          });
        } else {
          throw new Error('No privacy policy configurations found in Contentful.');
        }
      } catch (err) {
        console.error('Contentful fetching error:', err);
        setError('Failed to retrieve active privacy policy configuration. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();

    // Clean up background scroll leakage on unmount/close
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper function to parse plain text bullets/paragraphs into premium structured items
  const renderBulletPoints = (text) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return (
      <ul className="list-none space-y-3.5 pl-0">
        {lines.map((line, idx) => {
          // Remove default bullet characters if Contentful includes them
          const cleanLine = line.replace(/^[•*\-▪]\s*/, '');
          const colonIndex = cleanLine.indexOf(':');

          // Highlight key labels formatted as "Label: Content"
          if (colonIndex !== -1 && colonIndex < 35) {
            const boldText = cleanLine.substring(0, colonIndex + 1);
            const normalText = cleanLine.substring(colonIndex + 1);
            return (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-brand-muted leading-relaxed">
                <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
                <div>
                  <strong className="text-white font-semibold">{boldText}</strong>
                  {normalText}
                </div>
              </li>
            );
          }
          return (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-brand-muted leading-relaxed">
              <span className="text-brand-primary font-mono text-[10px] mt-0.5 select-none">▪</span>
              <div>{cleanLine}</div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#070a13]/85 backdrop-blur-md p-4 animate-backdrop-fade"
      onClick={onClose}
    >
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-gray-800/60 bg-[#0b0f19] shadow-2xl flex flex-col text-left overflow-hidden relative animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Panel */}
        <div className="flex items-center justify-between border-b border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Pulsing indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary font-mono flex items-center gap-1.5">
              <Shield size={14} /> Legal Documentation
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-brand-muted hover:text-white transition-colors text-lg font-bold bg-transparent border-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              <p className="text-xs text-brand-muted font-mono tracking-widest uppercase">Initializing Secure Stream...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 my-8">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">Connection Interrupted</h4>
                <p className="text-[11px] text-red-300/80 leading-relaxed mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && policy && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Segment */}
              <div className="relative overflow-hidden rounded-xl border border-gray-800/40 bg-gradient-to-r from-surface to-[#0e1322] p-6">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 uppercase mb-3">
                  🔐 Security & Privacy Architecture
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">{policy.title}</h2>
                <p className="text-xs text-brand-muted mt-2 leading-relaxed max-w-2xl">
                  {policy.subtitle}
                </p>
                <div className="text-[9px] text-gray-500 font-mono mt-4">
                  InsightAgent Core Policy Engine • v2.2-Contentful
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="space-y-6">
                
                {/* SECTION 1 */}
                <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
                  <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-brand-primary">
                      <Database size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">{policy.section1Title}</h3>
                      <p className="text-[9px] text-gray-500 mt-0.5">Strict classification of user account credentials and knowledge assets.</p>
                    </div>
                  </div>
                  {renderBulletPoints(policy.section1Bullet1)}
                </div>

                {/* SECTION 2 */}
                <div className="rounded-xl border border-gray-800/40 bg-surface/50 p-5 shadow-sm hover:border-gray-700/40 transition-colors duration-300">
                  <div className="flex items-center gap-3 border-b border-gray-800/40 pb-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#070a13] border border-gray-800/60 text-brand-primary">
                      <Bot size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">{policy.section2Title}</h3>
                      <p className="text-[9px] text-gray-500 mt-0.5">How your intelligence clusters interact with LLM models and vector stores.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Your data is processed in a closed-loop system optimized for Retrieval-Augmented Generation (RAG):
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card 1 */}
                      <div className="bg-[#070a13] border border-gray-800/60 p-4 rounded-lg flex gap-3 hover:border-indigo-500/20 transition-colors duration-300">
                        <EyeOff size={16} className="text-brand-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">{policy.card1Title}</h4>
                          <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                            {policy.card1Body}
                          </p>
                        </div>
                      </div>
                      
                      {/* Card 2 */}
                      <div className="bg-[#070a13] border border-gray-800/60 p-4 rounded-lg flex gap-3 hover:border-emerald-500/20 transition-colors duration-300">
                        <Server size={16} className="text-brand-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">{policy.card2Title}</h4>
                          <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">
                            {policy.card2Body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Footer Close Panel */}
        <div className="border-t border-gray-800/60 bg-[#0b0f19]/90 backdrop-blur-md px-6 py-4 flex justify-end shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-xs bg-brand-primary text-black font-bold text-xs rounded-lg px-4 py-2 hover:bg-indigo-400 transition-all cursor-pointer h-8 border-none flex items-center justify-center active:scale-95"
          >
            Close Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
