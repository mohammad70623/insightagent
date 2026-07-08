import React from 'react';
import { BarChart3, Sliders } from 'lucide-react';

const ForecastSimulator = ({ forecastData, forecastLoading, priceMultiplier, setPriceMultiplier, efficiencyMultiplier, setEfficiencyMultiplier }) => {
  // Sliders are only disabled when there is zero data at all (initial load / hard crash)
  const isDisabled = !forecastData;
  const isFallbackMode = forecastData?.status === "fallback";

  return (
    <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-850 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-primary" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              Predictive Insights & Revenue Forecasting
            </h4>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isFallbackMode 
                ? 'Mode: Industry Baseline Defaults | Upload a financial document to calibrate'
                : 'Target Horizon: 2 Quarters | Ingested Base Weights'
              }
            </p>
          </div>
        </div>
        
        {/* Dynamic What-If Control Simulation Deck */}
        <div className="bg-[#0B0F19] rounded-xl p-4 border border-gray-850 flex flex-wrap gap-6 items-center flex-1 max-w-2xl justify-end">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
            <Sliders size={12} className="text-brand-primary" /> WHAT-IF CONTROLS:
          </div>
          
          <div className="space-y-1 flex-1 min-w-[150px]">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-gray-400">Price Adjuster</span>
              <span className={isDisabled ? 'text-gray-600 font-bold' : (priceMultiplier >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold')}>
                {isDisabled ? '0%' : (priceMultiplier >= 0 ? `+${priceMultiplier}` : priceMultiplier) + '%'}
              </span>
            </div>
            <input 
              type="range" 
              min="-50" 
              max="50" 
              value={isDisabled ? 0 : priceMultiplier} 
              onChange={(e) => setPriceMultiplier(Number(e.target.value))}
              disabled={isDisabled}
              className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1 flex-1 min-w-[150px]">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-gray-400">Op. Efficiency</span>
              <span className={isDisabled ? 'text-gray-600 font-bold' : (efficiencyMultiplier >= 0 ? 'text-indigo-400 font-bold' : 'text-red-400 font-bold')}>
                {isDisabled ? '0%' : (efficiencyMultiplier >= 0 ? `+${efficiencyMultiplier}` : efficiencyMultiplier) + '%'}
              </span>
            </div>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              value={isDisabled ? 0 : efficiencyMultiplier} 
              onChange={(e) => setEfficiencyMultiplier(Number(e.target.value))}
              disabled={isDisabled}
              className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isDisabled ? (
          <div className="sm:col-span-2 rounded-lg bg-[#0B0F19]/40 border border-dashed border-gray-800/60 p-8 flex flex-col justify-center items-center text-center text-slate-500 font-mono text-[10px] leading-relaxed min-h-[140px]">
            <span className="text-lg mb-2">⚡</span>
            <span>Forecast Engine Initializing: Loading baseline weights...</span>
          </div>
        ) : (
          <>
            {/* Projected Revenue Card */}
            <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-4 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[140px] relative">
              {forecastLoading && (
                <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary">
                  <span className="animate-spin mr-2">⏳</span> RE-CALCULATING...
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-gray-400">PROJECTED REVENUE</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isFallbackMode 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-green-400 bg-green-500/10 border-green-500/20'
                }`}>
                  {isFallbackMode ? 'Baseline Estimate' : 'Live Simulated'}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Simulated Projection</p>
                  <p className="text-xl font-bold tracking-tight text-white mt-0.5">
                    ${Math.round(forecastData?.projected_revenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Strategic Recommendation Card */}
            <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-4 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[140px] relative">
              {forecastLoading && (
                <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary">
                  <span className="animate-spin mr-2">⏳</span> SYNTHESIZING...
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-400">🤖 AI STRATEGIC INSIGHT</span>
              </div>
              <div className="mt-2 flex-1 flex items-center">
                <p className="text-[11px] font-mono text-brand-muted leading-relaxed italic">
                  {forecastData?.ai_insight || "Awaiting simulation variables..."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastSimulator;
