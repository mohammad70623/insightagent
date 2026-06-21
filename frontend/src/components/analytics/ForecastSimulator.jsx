import React from 'react';
import { BarChart3, Sliders } from 'lucide-react';

const ForecastSimulator = ({ simulatedForecastData, priceMultiplier, setPriceMultiplier, efficiencyMultiplier, setEfficiencyMultiplier }) => {
  return (
    <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-850 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-primary" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              Predictive Insights & Revenue Forecasting
            </h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Target Horizon: 2 Quarters | Ingested Base Weights</p>
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
              <span className={priceMultiplier >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {priceMultiplier >= 0 ? `+${priceMultiplier}` : priceMultiplier}%
              </span>
            </div>
            <input 
              type="range" 
              min="-50" 
              max="50" 
              value={priceMultiplier} 
              onChange={(e) => setPriceMultiplier(Number(e.target.value))}
              className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1 flex-1 min-w-[150px]">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-gray-400">Op. Efficiency</span>
              <span className={efficiencyMultiplier >= 0 ? 'text-indigo-400 font-bold' : 'text-red-400 font-bold'}>
                {efficiencyMultiplier >= 0 ? `+${efficiencyMultiplier}` : efficiencyMultiplier}%
              </span>
            </div>
            <input 
              type="range" 
              min="-20" 
              max="20" 
              value={efficiencyMultiplier} 
              onChange={(e) => setEfficiencyMultiplier(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {simulatedForecastData.map((data, index) => (
          <div key={index} className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-4 flex flex-col justify-between transition-all duration-300 hover:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-gray-400">{data.period}</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                data.growth_rate >= 0 ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {data.growth_rate >= 0 ? `+${data.growth_rate}` : data.growth_rate}% Projected Growth
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Simulated Value</p>
                <p className="text-xl font-bold tracking-tight text-white mt-0.5">${Math.round(data.predicted_revenue).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-gray-600 font-semibold">Confidence Interval</p>
                <p className="text-[11px] font-mono text-brand-muted mt-0.5">
                  ${Math.round(data.confidence_bound_low).toLocaleString()} - ${Math.round(data.confidence_bound_high).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastSimulator;
