import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export default function CriticalRiskAlerts({ riskAlerts = [], isAnalyzing, currentStep }) {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // 1. Dynamic Data Aggregation: Grouping the RAG threat streams by unique category keys
  const groupedAlerts = riskAlerts.reduce((acc, alert) => {
    const category = (alert.type || alert.metric || 'General').toString().trim();
    if (!acc[category]) {
      acc[category] = {
        category,
        severity: alert.severity || 'INFO',
        items: []
      };
    }
    
    // Strict business rule: Inherit the highest severity vector for the root badge
    const currentSeverity = (alert.severity || 'INFO').toUpperCase();
    const existingSeverity = acc[category].severity.toUpperCase();

    if (currentSeverity === 'CRITICAL') {
      acc[category].severity = 'CRITICAL';
    } else if (currentSeverity === 'HIGH' && existingSeverity !== 'CRITICAL') {
      acc[category].severity = 'HIGH';
    } else if (currentSeverity === 'WARNING' && !['CRITICAL', 'HIGH'].includes(existingSeverity)) {
      acc[category].severity = 'WARNING';
    }

    acc[category].items.push(alert.description || alert.message || '');
    return acc;
  }, {});

  const finalCategoryList = Object.values(groupedAlerts);

  return (
    <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col h-[400px] w-full text-left font-sans">
      {/* COMPONENT STREAM HEADER */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-mono tracking-widest text-slate-200 uppercase font-bold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${riskAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            CRITICAL RISK ALERTS
          </h3>
          <button className="text-slate-500 hover:text-slate-300 transition-colors text-xs bg-transparent border-none cursor-pointer">•••</button>
        </div>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
          Real-time AI Risk Evaluation Engine | {isAnalyzing ? 'Analyzing Vector Clusters...' : `${riskAlerts.length} Flagged Anomalies Across ${finalCategoryList.length} Unique Categories`}
        </p>
      </div>

      {/* PIPELINE SCANNING VIEW */}
      {isAnalyzing && currentStep === 'processing' ? (
        <div className="flex flex-col items-center justify-center flex-1 space-y-3">
          <div className="w-full max-w-[95%] space-y-2 animate-pulse">
            <div className="h-10 bg-slate-800/40 rounded w-full"></div>
            <div className="h-10 bg-slate-800/40 rounded w-full"></div>
          </div>
        </div>
      ) : finalCategoryList.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-slate-500 text-xs font-sans">No operational anomalies identified.</p>
        </div>
      ) : (
        /* ACCORDION FEED CONTAINER */
        <div className="overflow-y-auto flex-1 scrollbar-thin pr-1 space-y-2.5">
          {finalCategoryList.map((item) => {
            const isExpanded = !!expandedCategories[item.category];
            const severityNormalized = item.severity.toUpperCase();
            
            let badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (severityNormalized === 'CRITICAL') badgeClass = "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]";
            if (severityNormalized === 'HIGH') badgeClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
            if (severityNormalized === 'WARNING') badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";

            return (
              <div 
                key={item.category} 
                className="bg-[#161B2D]/40 border border-slate-800/60 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-700/50"
              >
                {/* INTERACTIVE CARD INTERFACE HEADER */}
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
                    <span className="text-[9px] font-mono bg-[#111625] px-2 py-0.5 rounded text-slate-400 border border-slate-800 shrink-0">
                      {item.items.length} {item.items.length === 1 ? 'Incident' : 'Incidents'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-400 text-[10px] font-mono shrink-0">
                    <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                  </div>
                </div>

                {/* ACCORDION COLLAPSIBLE MULTI-PARAGRAPH BODY */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-800/30 bg-[#121625]/40 divide-y divide-slate-800/50 space-y-2.5 select-text">
                    {item.items.map((description, descIdx) => (
                      <div key={descIdx} className={descIdx > 0 ? "pt-2.5 select-text" : "select-text"}>
                        <div className="text-[9px] text-slate-500 font-mono mb-1 tracking-wider uppercase select-none">
                          Incident Instance #{descIdx + 1}:
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed font-sans text-justify select-text cursor-text selection:bg-blue-500/30 selection:text-white">
                          {description}
                        </p>
                      </div>
                    ))}
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
