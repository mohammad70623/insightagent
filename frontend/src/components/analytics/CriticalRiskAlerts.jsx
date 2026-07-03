import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CriticalRiskAlerts({ riskAlerts = [], mitigationPlans = [], isAnalyzing, currentStep }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // 1. Group incoming Risk Alerts by unique high-level categories dynamically
  const groupedAlerts = riskAlerts.reduce((acc, alert) => {
    const category = (alert.type || alert.metric || 'General').toString().trim();
    if (!acc[category]) {
      acc[category] = {
        category,
        severity: alert.severity || 'INFO',
        items: []
      };
    }
    
    const currentSeverity = (alert.severity || 'INFO').toUpperCase();
    if (currentSeverity === 'CRITICAL') acc[category].severity = 'CRITICAL';
    else if (currentSeverity === 'HIGH' && acc[category].severity !== 'CRITICAL') acc[category].severity = 'HIGH';
    else if (currentSeverity === 'WARNING' && !['CRITICAL', 'HIGH'].includes(acc[category].severity)) acc[category].severity = 'WARNING';
    
    acc[category].items.push(alert.description || alert.message || '');
    return acc;
  }, {});

  const finalCategoryList = Object.values(groupedAlerts);

  return (
    <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col h-[420px] w-full select-text">
      
      {/* UNIFIED WIDGET HEADER */}
      <div className="flex flex-col mb-4 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-mono tracking-widest text-slate-200 uppercase font-bold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${riskAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            CRITICAL RISK & REMEDIATION MATRIX
          </h3>
          <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
            Inline RAG Core
          </span>
        </div>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
          Real-time AI Threat Assessment | {riskAlerts.length} Flagged Vulnerabilities Across {finalCategoryList.length} Unique Nodes
        </p>
      </div>

      {/* PIPELINE PROCESSING EFFECT */}
      {isAnalyzing && currentStep === 'processing' ? (
        <div className="flex flex-col items-center justify-center flex-1 space-y-3 select-none">
          <div className="w-full max-w-[95%] space-y-2 animate-pulse">
            <div className="h-10 bg-slate-800/40 rounded w-full"></div>
            <div className="h-10 bg-slate-800/40 rounded w-full"></div>
          </div>
        </div>
      ) : finalCategoryList.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 select-none">
          <p className="text-slate-500 text-xs font-sans">Awaiting telemetry payload vector validation...</p>
        </div>
      ) : (
        /* CLEAN UNIFIED ACCORDION LIST FEED */
        <div className="overflow-y-auto flex-1 scrollbar-thin pr-1 space-y-2.5 select-text">
          {finalCategoryList.map((item) => {
            const isExpanded = !!expandedCategories[item.category];
            const severityNormalized = item.severity.toUpperCase();
            
            let badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (severityNormalized === 'CRITICAL') badgeClass = "bg-red-500/10 text-red-400 border-red-500/20";
            if (severityNormalized === 'HIGH') badgeClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
            if (severityNormalized === 'WARNING') badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";

            // 🔍 Client-Side Dynamic Lookup: Fetch remediation instructions matching this exact category node
            const matchingMitigations = mitigationPlans.filter(
              (mit) => (mit.category || '').toString().trim().toLowerCase() === item.category.toLowerCase()
            );

            return (
              <div 
                key={item.category} 
                className="bg-[#161B2D]/40 border border-slate-800/60 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-700/50 select-text"
              >
                {/* CATEGORY ACCORDION BAR TRIGGER */}
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/20 transition-colors"
                  onClick={() => toggleCategory(item.category)}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert 
                      className={`w-3.5 h-3.5 shrink-0 ${severityNormalized === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} 
                    />
                    <span className="text-xs font-mono font-bold tracking-wide text-slate-200">
                      {item.category}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase font-bold border ${badgeClass}`}>
                      {severityNormalized}
                    </span>
                    <span className="text-[9px] font-mono bg-[#111625] px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                      {item.items.length} {item.items.length === 1 ? 'Incident' : 'Incidents'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-400 text-[10px] font-mono">
                    <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                  </div>
                </div>

                {/* EXPANDED INSIGHT WRAPPER - 100% COPY PASTE UNLOCKED */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/40 bg-[#121625]/60 space-y-3 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
                    
                    {/* SUB-LOOP 1: RENDER EXTRACED INFRASTRUCTURE THREATS */}
                    {item.items.map((description, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-[#181E34]/40 border border-slate-800/60 rounded-md shadow-inner select-text"
                        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                      >
                        <div className="text-[9px] font-mono text-red-400 mb-1.5 uppercase font-bold select-none">
                          INCIDENT THREAT INSTANCE #{idx + 1}
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed font-sans text-justify select-text cursor-text selection:bg-blue-500/40 selection:text-white">
                          {description}
                        </p>
                      </div>
                    ))}

                    {/* SUB-LOOP 2: INLINE INJECTION OF MATCHING REMEDIATION PLANS */}
                    {matchingMitigations.length > 0 && (
                      <div className="mt-1 space-y-2 select-text">
                        {matchingMitigations.map((mit, mitIdx) => (
                          <div 
                            key={mitIdx} 
                            className="p-3 bg-[#122238]/30 border border-blue-500/20 rounded-md shadow-sm select-text transition-colors hover:bg-[#122238]/40"
                            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                          >
                            <div className="flex items-center gap-1.5 mb-1 select-none">
                              <CheckCircle2 className="w-3 h-3 text-blue-400"/>
                              <span className="text-[9px] font-mono text-blue-400 font-bold tracking-wider uppercase">
                                RECOMMENDED MITIGATION ACTION #{mitIdx + 1}
                              </span>
                              <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase font-bold ml-auto">
                                {mit.priority || 'HIGH'}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed font-sans text-justify select-text cursor-text selection:bg-blue-500/40 selection:text-white">
                              {mit.action}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
