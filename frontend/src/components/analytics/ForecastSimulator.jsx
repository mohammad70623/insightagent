import React, { useMemo } from 'react';
import { BarChart3, Sliders, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const ForecastSimulator = ({ 
  forecastData, 
  forecastLoading, 
  priceAdjuster, 
  setPriceAdjuster,
  marketingBoost,
  setMarketingBoost,
  productInnovation,
  setProductInnovation,
  opEfficiency,
  setOpEfficiency,
  supportCapacity,
  setSupportCapacity,
  competitionThreat,
  setCompetitionThreat,
  insightText,
  loadingAI
}) => {
  const isDisabled = !forecastData;
  const isFallbackMode = forecastData?.status === "fallback";

  const cleanNumber = (val) => {
    if (val === undefined || val === null || val === '') return 5000000; // Updated default base for realistic enterprise simulation
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[\$,]/g, '');
    return parseFloat(cleaned) || 5000000;
  };

  const historicalBaseRevenue = forecastData?.base_revenue;
  const baseVal = cleanNumber(historicalBaseRevenue || 5000000);

  // Multi-variable calculation logic for progressive timeline (Next 6 Quarters)
  const timelineData = useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    
    // Compute coefficients for all 6 sliders
    const pCoeff = priceAdjuster * 0.003;        // Price Adjuster (-50% to +50% -> -0.15 to +0.15)
    const mCoeff = marketingBoost * 0.004;       // Marketing Boost (0% to 100% -> 0 to 0.4)
    const iCoeff = productInnovation * 0.005;    // Product Innovation (0% to 100% -> 0 to 0.5)
    const eCoeff = opEfficiency * 0.005;         // Op. Efficiency (-20% to +20% -> -0.1 to +0.1)
    const sCoeff = supportCapacity * 0.002;      // Support Capacity (-50% to +50% -> -0.1 to +0.1)
    const cCoeff = -competitionThreat * 0.003;   // Competition Threat (0% to 100% -> -0.3 to 0)

    const netSimulationFactor = pCoeff + mCoeff + iCoeff + eCoeff + sCoeff + cCoeff;

    return quarters.map((quarter, index) => {
      const step = index + 1; // 1 to 6
      // Progressive curve growth factor compounded over time steps
      const growthFactor = Math.pow(1 + netSimulationFactor / 6, step);
      // Progressive base trend (e.g. natural 1.5% growth per quarter)
      const baseTrend = Math.pow(1.015, step);
      const revenue = baseVal * growthFactor * baseTrend;
      return {
        name: quarter,
        revenue: Math.round(revenue)
      };
    });
  }, [baseVal, priceAdjuster, marketingBoost, productInnovation, opEfficiency, supportCapacity, competitionThreat]);

  // Main simulated projection metric matches the final data point of the curve
  const finalProjectedRevenue = timelineData[timelineData.length - 1].revenue;

  return (
    <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl space-y-6">
      <div className="flex flex-col gap-6 border-b border-gray-850 pb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-brand-primary" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              Predictive Insights & Revenue Forecasting
            </h4>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {isFallbackMode 
                ? 'Mode: Industry Baseline Defaults | Ingested Base Weights: $5,000,000'
                : `Target Horizon: Next 6 Quarters | Ingested Base Weights: $${Math.round(baseVal).toLocaleString()}`
              }
            </p>
          </div>
        </div>
        
        {/* Dynamic What-If Control Simulation Deck */}
        <div className="bg-[#0B0F19] rounded-xl p-5 border border-gray-850 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono border-b border-gray-800/60 pb-2">
            <Sliders size={12} className="text-brand-primary" /> SCENARIO COCKPIT SIMULATION DECK:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Adjuster */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Price Adjuster</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : (priceAdjuster >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold')}>
                  {isDisabled ? '0%' : (priceAdjuster >= 0 ? `+${priceAdjuster}` : priceAdjuster) + '%'}
                </span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                value={isDisabled ? 0 : priceAdjuster} 
                onChange={(e) => setPriceAdjuster(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Marketing Boost */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Marketing Boost</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : 'text-indigo-400 font-bold'}>
                  {isDisabled ? '0%' : `+${marketingBoost}%`}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={isDisabled ? 0 : marketingBoost} 
                onChange={(e) => setMarketingBoost(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Product Innovation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Product Innovation</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : 'text-emerald-400 font-bold'}>
                  {isDisabled ? '0%' : `+${productInnovation}%`}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={isDisabled ? 0 : productInnovation} 
                onChange={(e) => setProductInnovation(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-emerald-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Op. Efficiency */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Op. Efficiency</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : (opEfficiency >= 0 ? 'text-indigo-400 font-bold' : 'text-red-400 font-bold')}>
                  {isDisabled ? '0%' : (opEfficiency >= 0 ? `+${opEfficiency}` : opEfficiency) + '%'}
                </span>
              </div>
              <input 
                type="range" 
                min="-20" 
                max="20" 
                value={isDisabled ? 0 : opEfficiency} 
                onChange={(e) => setOpEfficiency(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Support Capacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Support Capacity</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : (supportCapacity >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold')}>
                  {isDisabled ? '0%' : (supportCapacity >= 0 ? `+${supportCapacity}` : supportCapacity) + '%'}
                </span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                value={isDisabled ? 0 : supportCapacity} 
                onChange={(e) => setSupportCapacity(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {/* Competition Threat */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Competition Threat</span>
                <span className={isDisabled ? 'text-gray-600 font-bold' : 'text-red-400 font-bold'}>
                  {isDisabled ? '0%' : `+${competitionThreat}%`}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={isDisabled ? 0 : competitionThreat} 
                onChange={(e) => setCompetitionThreat(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full accent-red-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {isDisabled ? (
          <div className="sm:col-span-2 rounded-lg bg-[#0B0F19]/40 border border-dashed border-gray-880/60 p-8 flex flex-col justify-center items-center text-center text-slate-500 font-mono text-[10px] leading-relaxed min-h-[140px]">
            <span className="text-lg mb-2">⚡</span>
            <span>Forecast Engine Initializing: Loading baseline weights...</span>
          </div>
        ) : (
          <>
            {/* Projected Revenue Card */}
            <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-5 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[320px] relative">
              {forecastLoading && (
                <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary z-10">
                  <span className="animate-spin mr-2">⏳</span> Updating Forecast...
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono text-gray-400">PROJECTED REVENUE</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isFallbackMode 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-green-400 bg-green-500/10 border-green-500/20'
                }`}>
                  {isFallbackMode ? 'Baseline Estimate' : 'Live Simulated'}
                </span>
              </div>
              
              {/* Neon Area Chart */}
              <div className="flex-1 w-full min-h-[180px] my-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="neonTealGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B0F19', 
                        borderColor: '#1F2937', 
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontFamily: 'monospace'
                      }}
                      itemStyle={{ color: '#00E5FF' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Projected Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#00E5FF" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#neonTealGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Metrics at the bottom */}
              <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Simulated Projection</p>
                  <p className="text-2xl font-bold tracking-tight text-white mt-0.5">
                    ${finalProjectedRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Strategic Recommendation Card */}
            <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-5 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[320px] relative">
              {loadingAI && (
                <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary z-10">
                  <span className="animate-spin mr-2">⏳</span> SYNTHESIZING...
                </div>
              )}
              <div className="flex items-center gap-[10px] border-b border-gray-850 pb-2 mb-3">
                <BrainCircuit size={18} className="text-slate-400" />
                <span className="text-xs font-bold font-mono tracking-wide text-slate-200">
                  Executive Intelligence Report
                </span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                <div className="text-[11px] font-mono text-brand-muted leading-relaxed italic prose prose-invert max-w-none">
                  <ReactMarkdown>
                    {insightText || "Awaiting simulation variables..."}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastSimulator;
