import React, { useEffect, useState, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { Cpu, Activity, Layers } from 'lucide-react';

export default function InfrastructureHealth({ riskAlerts = [], isAnalyzing, currentStep }) {
  const [latency, setLatency] = useState("12ms"); // Initial default latency matching the original UI design
  const [waveData, setWaveData] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // 1. Live Latency Tracker Engine
  useEffect(() => {
    if (isAnalyzing && currentStep === 'processing') {
      startTimeRef.current = Date.now();
      setLatency("Evaluating...");
      
      timerRef.current = setInterval(() => {
        const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
        setLatency(`${elapsed}s`);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (startTimeRef.current) {
        const finalDuration = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
        setLatency(`${finalDuration}s`);
        startTimeRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAnalyzing, currentStep]);

  // 2. Dynamic Real-time AI Wave Telemetry Simulation
  useEffect(() => {
    const generateWaveNode = (isHighActivity) => {
      const nodes = [];
      const totalPoints = 15;
      for (let i = 0; i < totalPoints; i++) {
        const base = Math.sin((i / totalPoints) * Math.PI * 2) * 20 + 40;
        const noise = Math.random() * (isHighActivity ? 35 : 8);
        nodes.push({ value: Math.max(10, Math.min(95, base + noise)) });
      }
      return nodes;
    };

    // Initial seed wave
    setWaveData(generateWaveNode(false));

    let waveInterval;
    if (isAnalyzing && currentStep === 'processing') {
      // High-frequency active processing pulse
      waveInterval = setInterval(() => {
        setWaveData(generateWaveNode(true));
      }, 250);
    } else {
      // Low-frequency ambient standby pulse
      waveInterval = setInterval(() => {
        setWaveData(generateWaveNode(false));
      }, 1200);
    }

    return () => clearInterval(waveInterval);
  }, [isAnalyzing, currentStep]);

  // Derived tracking stats
  const activeThreads = riskAlerts.length > 0 ? `${riskAlerts.length * 3} Active` : "1 Idle Thread";

  return (
    <div className="bg-[#111625] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col h-[420px] w-full select-none justify-between">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col mb-4">
        <h3 className="text-[12px] font-mono tracking-widest text-slate-200 uppercase font-bold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'}`} />
          ENTERPRISE INFRASTRUCTURE HEALTH
        </h3>
        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
          System Performance Overview
        </p>
      </div>

      {/* METRIC GRID CARD CORES */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        
        {/* CARD 1: HARDWARE MODEL */}
        <div className="bg-[#161B2D]/60 border border-slate-800/80 p-3 rounded-lg flex flex-col items-center justify-center text-center transition-all hover:border-slate-700/40 min-h-[72px]">
          <Cpu className={`w-4 h-4 mb-1.5 ${isAnalyzing ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '3s' }} />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">MODEL</span>
          <span className="text-[11px] font-mono text-slate-200 font-bold mt-0.5 truncate max-w-full" title={isAnalyzing ? "LLaMA 3 (Groq)..." : "LLaMA 3 (Groq)"}>
            {isAnalyzing ? "LLaMA 3 (Groq)..." : "LLaMA 3 (Groq)"}
          </span>
        </div>

        {/* CARD 2: COMPUTE LATENCY */}
        <div className="bg-[#161B2D]/60 border border-slate-800/80 p-3 rounded-lg flex flex-col items-center justify-center text-center transition-all hover:border-slate-700/40 min-h-[72px]">
          <Activity className={`w-4 h-4 mb-1.5 ${isAnalyzing ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">LATENCY</span>
          <span className={`text-[11px] font-mono font-bold mt-0.5 ${isAnalyzing ? 'text-amber-400' : 'text-slate-200'}`}>
            {latency}
          </span>
        </div>

        {/* CARD 3: WORKER THREADS */}
        <div className="bg-[#161B2D]/60 border border-slate-800/80 p-3 rounded-lg flex flex-col items-center justify-center text-center transition-all hover:border-slate-700/40 min-h-[72px]">
          <Layers className="w-4 h-4 mb-1.5 text-slate-400" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">THREADS</span>
          <span className="text-[11px] font-mono text-slate-200 font-bold mt-0.5 truncate max-w-full" title={activeThreads}>
            {activeThreads}
          </span>
        </div>
      </div>

      {/* RECHARTS HIGH FREQUENCY WAVE GRAPH COMPONENT */}
      <div className="flex-1 min-h-[140px] relative bg-[#131828]/40 border border-slate-900/60 rounded-xl p-2 overflow-hidden shadow-inner">
        <div className="absolute top-3 left-3 z-10 select-none">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest bg-[#111625] px-1.5 py-0.5 rounded border border-slate-800">
            {isAnalyzing ? 'VECTOR AGENT BUSY' : 'TELEMETRY SYNCED'}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={waveData} margin={{ top: 15, right: -5, left: -5, bottom: -5 }}>
            <YAxis domain={[0, 100]} hide={true} />
            <defs>
              <linearGradient id="cyberWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isAnalyzing ? "#22d3ee" : "#3b82f6"} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={isAnalyzing ? "#22d3ee" : "#3b82f6"} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isAnalyzing ? "#22d3ee" : "#2563eb"} 
              strokeWidth={1.5} 
              fillOpacity={1} 
              fill="url(#cyberWave)"
              animationDuration={200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
