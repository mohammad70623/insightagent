import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, BarChart3, Sliders, BrainCircuit, Loader2, ArrowUpRight, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FutureTrends() {
  const [baseCapital, setBaseCapital] = useState(5000000);
  const [forecastLoading, setForecastLoading] = useState(false);

  // 6 Sliders Simulation states (-100 to +100)
  const [priceAdjuster, setPriceAdjuster] = useState(0);
  const [marketingBoost, setMarketingBoost] = useState(0);
  const [productInnovation, setProductInnovation] = useState(0);
  const [opEfficiency, setOpEfficiency] = useState(0);
  const [supportCapacity, setSupportCapacity] = useState(0);
  const [competitionThreat, setCompetitionThreat] = useState(0);
  const [insightText, setInsightText] = useState("Awaiting simulation variables...");
  const [loadingAI, setLoadingAI] = useState(false);

  // Instant Math Calculations
  const netModifier = useMemo(() => {
    return (priceAdjuster + marketingBoost + productInnovation + opEfficiency + supportCapacity - competitionThreat) / 100;
  }, [priceAdjuster, marketingBoost, productInnovation, opEfficiency, supportCapacity, competitionThreat]);

  const baselineQ = useMemo(() => {
    return baseCapital / 6;
  }, [baseCapital]);

  const activeProjection = useMemo(() => {
    return Math.round(baselineQ * (1 + netModifier));
  }, [baselineQ, netModifier]);

  // Compounded timeline projections
  const timelineData = useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    return quarters.map((quarter, index) => {
      const step = index + 1;
      const growthFactor = Math.pow(1 + netModifier / 6, step);
      const baseTrend = Math.pow(1.015, step);
      const revenue = baselineQ * growthFactor * baseTrend;
      return {
        name: quarter,
        revenue: Math.round(revenue)
      };
    });
  }, [baselineQ, netModifier]);

  const finalProjectedRevenue = useMemo(() => {
    return timelineData[timelineData.length - 1]?.revenue || 0;
  }, [timelineData]);

  // API Live Ingestion simulation
  const fetchLiveAISimulation = async () => {
    setLoadingAI(true);
    setForecastLoading(true);
    try {
      const response = await api.post("/predictive/simulate", {
        priceAdjuster: Number(priceAdjuster),
        marketingBoost: Number(marketingBoost),
        productInnovation: Number(productInnovation),
        opEfficiency: Number(opEfficiency),
        supportCapacity: Number(supportCapacity),
        competitionThreat: Number(competitionThreat),
        baseCapital: Number(baseCapital),
        activeProjection: Number(activeProjection)
      });
      setInsightText(response.data.aiMarkdownReport);
    } catch (error) {
      console.error("AI Live Sync failed", error);
    } finally {
      setLoadingAI(false);
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLiveAISimulation();
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [priceAdjuster, marketingBoost, productInnovation, opEfficiency, supportCapacity, competitionThreat, baseCapital, activeProjection]);

  // Native DOM Printing and PDF Exporter
  const handleDownloadPDF = () => {
    const reportElement = document.getElementById('ai-report-content');
    if (!reportElement) {
      alert("No executive report content detected.");
      return;
    }

    // 1. Open a clean temporary printing window
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    
    // 2. Fetch all system stylesheet links to retain beautiful styling and fonts
    let stylesHtml = '';
    for (const node of document.querySelectorAll('link[rel="stylesheet"], style')) {
      stylesHtml += node.outerHTML;
    }

    // 3. Document payload injected with print-specific style overrides to eliminate dark background for premium paper printing
    printWindow.document.write(`
      <html>
        <head>
          <title>InsightAgent Executive Advisory Report</title>
          ${stylesHtml}
          <style>
            body { 
              background: #ffffff !important; 
              color: #0f172a !important; 
              font-family: ui-sans-serif, system-ui, sans-serif;
              padding: 30px; 
            }
            /* Ensure text colors inside the report change from white/neon to professional dark grey */
            #ai-report-content, #ai-report-content * { 
              color: #0f172a !important; 
              background-color: transparent !important;
              border-color: #cbd5e1 !important;
              text-shadow: none !important;
              box-shadow: none !important;
            }
            h1, h2, h3 { color: #1e1b4b !important; margin-top: 20px; margin-bottom: 10px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .gap-2 { gap: 0.5rem; }
            hr { border-top: 1px solid #e2e8f0; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 25px; border-bottom: 2px solid #1e1b4b; padding-bottom: 10px;">
            <h2 style="margin:0; color:#1e1b4b !important;">InsightAgent Enterprise AI</h2>
            <p style="margin:5px 0 0 0; font-size:12px; color:#64748b !important;">Advisory Forecast Report | Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div>
            ${reportElement.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // 4. Trigger the native print dialog seamlessly, allowing direct "Save as PDF"
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="space-y-6 text-white min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-primary" /> Future Trends
          </h2>
          <p className="text-xs text-brand-muted mt-1.5">
            Predictive Insights & Revenue Forecasting simulation model.
          </p>
        </div>
      </div>

      {/* Main Sandbox Wrapper (Captured by PDF exporter) */}
      <div id="future-trends-sandbox" className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl space-y-6">
        
        {/* Cockpit Config Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B0F19] rounded-xl p-5 border border-gray-850">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-brand-primary" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              Business Impact Controls
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                Adjust baseline capital and performance multipliers to dynamically recompile trends.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Base Capital ($):</span>
            <input 
              type="number"
              value={baseCapital}
              onChange={(e) => setBaseCapital(Math.max(0, Number(e.target.value)))}
              className="bg-slate-950/80 border border-slate-800 text-brand-primary text-xs font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-primary w-40"
              placeholder="e.g. 5000000"
            />
          </div>
        </div>

        {/* Multi-variable Multipliers Grid */}
        <div className="bg-[#0B0F19]/50 rounded-xl p-5 border border-gray-850 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Adjuster */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Price Adjuster</span>
                <span className={priceAdjuster >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {priceAdjuster >= 0 ? `+${priceAdjuster}` : priceAdjuster}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={priceAdjuster} 
                onChange={(e) => setPriceAdjuster(Number(e.target.value))}
                className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Marketing Boost */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Marketing Boost</span>
                <span className={marketingBoost >= 0 ? 'text-indigo-400 font-bold' : 'text-red-400 font-bold'}>
                  {marketingBoost >= 0 ? `+${marketingBoost}` : marketingBoost}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={marketingBoost} 
                onChange={(e) => setMarketingBoost(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Product Innovation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Product Innovation</span>
                <span className={productInnovation >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {productInnovation >= 0 ? `+${productInnovation}` : productInnovation}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={productInnovation} 
                onChange={(e) => setProductInnovation(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Op. Efficiency */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Op. Efficiency</span>
                <span className={opEfficiency >= 0 ? 'text-indigo-400 font-bold' : 'text-red-400 font-bold'}>
                  {opEfficiency >= 0 ? `+${opEfficiency}` : opEfficiency}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={opEfficiency} 
                onChange={(e) => setOpEfficiency(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Support Capacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Support Capacity</span>
                <span className={supportCapacity >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {supportCapacity >= 0 ? `+${supportCapacity}` : supportCapacity}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={supportCapacity} 
                onChange={(e) => setSupportCapacity(Number(e.target.value))}
                className="w-full accent-brand-primary h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Competition Threat */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Competition Threat</span>
                <span className={competitionThreat >= 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                  {competitionThreat >= 0 ? `+${competitionThreat}` : competitionThreat}%
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={competitionThreat} 
                onChange={(e) => setCompetitionThreat(Number(e.target.value))}
                className="w-full accent-red-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Charts & AI Recommendations Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          
          {/* Neon Chart Viewport */}
          <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-5 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[360px] relative">
            {forecastLoading && (
              <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary z-10">
                <span className="animate-spin mr-2">⏳</span> Recompiling Projections...
              </div>
            )}
            <div className="flex items-center justify-between mb-3 border-b border-gray-850 pb-2">
              <span className="text-xs font-bold font-mono text-gray-400">PROJECTED REVENUE TIMELINE</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-green-400 bg-green-500/10 border-green-500/20">
                Live Compounded
              </span>
            </div>

            {/* Recharts Area Chart */}
            <div className="flex-1 w-full min-h-[220px] my-2 relative">
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
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
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

            {/* Simulated Projection Summary Metrics */}
            <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between flex-wrap gap-2 text-left">
              <div>
                <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Active Period Base (Q)</p>
                <p className="text-sm font-bold text-gray-300">
                  ${Math.round(baselineQ).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Dynamic Header Projection</p>
                <p className="text-sm font-bold text-indigo-400">
                  ${activeProjection.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Compounded Final Projection</p>
                <p className="text-base font-bold text-brand-primary">
                  ${finalProjectedRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* AI Strategic Intelligence Report */}
          <div className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-5 flex flex-col justify-between transition-all duration-300 hover:border-gray-700 min-h-[360px] relative">
            {loadingAI && (
              <div className="absolute inset-0 bg-[#0B0F19]/80 rounded-lg flex items-center justify-center text-[10px] font-mono text-brand-primary z-10">
                <span className="animate-spin mr-2">⏳</span> Generating Intelligence report...
              </div>
            )}
            <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-3">
              <div className="flex items-center gap-[10px]">
                <BrainCircuit size={18} className="text-slate-400" />
                <span className="text-xs font-bold font-mono tracking-wide text-slate-200">
                  Executive Intelligence Report
                </span>
              </div>
              <button 
                id="pdf-download-btn"
                onClick={handleDownloadPDF}
                className="btn btn-xs bg-brand-primary/10 border border-brand-primary/25 hover:bg-brand-primary/20 text-brand-primary font-bold text-[9px] rounded-lg px-2 py-1 cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.1)] hover:shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                <Download size={10} /> Download Report
              </button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar pr-1 text-left">
              <div id="ai-report-content" className="text-[11px] font-mono text-brand-muted leading-relaxed italic prose prose-invert max-w-none">
                <ReactMarkdown>
                  {insightText || "Adjust cockpit variables to compile live analysis..."}
                </ReactMarkdown>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
