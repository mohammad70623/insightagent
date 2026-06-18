import React, { useState, useEffect, useMemo, memo } from 'react';
import axios from 'axios';
import { TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, MessageSquare, Mail, MessageCircle, ShieldAlert, X, BarChart3 } from 'lucide-react';

const FeedbackRow = memo(({ item }) => {
  const Icon = item.icon;
  return (
    <tr className="border-b border-gray-850/40 hover:bg-gray-900/10 transition-colors">
      <td className="bg-transparent pl-0 py-3 font-semibold text-white">
        <span className="flex items-center gap-2"><Icon size={12} className="text-brand-primary/80"/> {item.source}</span>
      </td>
      <td className="bg-transparent py-3 text-gray-300 max-w-[200px] truncate" title={item.msg}>{item.msg}</td>
      <td className="bg-transparent py-3">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
          item.severity === 'CRITICAL' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
          item.severity === 'HIGH' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
          'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        }`}>
          {item.severity}
        </span>
      </td>
      <td className="bg-transparent text-right pr-0 py-3 text-brand-muted font-medium">{item.time}</td>
    </tr>
  );
});

const Analytics = () => {
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [swotData, setSwotData] = useState(null);
  const [isSwotOpen, setIsSwotOpen] = useState(false);
  const [swotLoading, setSwotLoading] = useState(false);
  
  const [buttonPos, setButtonPos] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchAnalyticsAndForecast = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [metricsRes, forecastRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/v1/chat/analytics/metrics', { headers }),
          axios.get('http://127.0.0.1:8000/api/v1/chat/analytics/forecast', { headers })
        ]);
        
        setLiveMetrics(metricsRes.data);
        setForecastData(forecastRes.data.forecast_data);
      } catch (error) {
        console.error("Failed to fetch live SaaS analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsAndForecast();
  }, []);

  const fetchSwotAnalysis = async () => {
    if (swotData) {
      setIsSwotOpen(true);
      return;
    }
    setSwotLoading(true);
    setIsSwotOpen(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/v1/chat/analytics/swot', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSwotData(response.data.swot_markdown);
    } catch (error) {
      console.error("Failed to fetch SWOT intelligence matrix:", error);
      setSwotData("Failed to load SWOT analysis report. Please verify authorization.");
    } finally {
      setSwotLoading(false);
    }
  };

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

  const metrics = useMemo(() => {
    if (!liveMetrics) return [];
    return [
      { title: 'Total Interactions', value: liveMetrics.total_interactions, change: '+12.4%', isPositive: true, icon: MessageSquare },
      { title: 'Avg. Sentiment Score', value: `${liveMetrics.sentiment_score}%`, change: '+3.1%', isPositive: true, icon: TrendingUp },
      { title: 'Active Complaints', value: String(liveMetrics.active_complaints), change: '-4.2%', isPositive: false, icon: AlertTriangle },
      { title: 'Response Time', value: liveMetrics.response_time, change: '+18.5%', isPositive: true, icon: Clock },
    ];
  }, [liveMetrics]);

  const chartData = useMemo(() => {
    if (!liveMetrics || !liveMetrics.chart_data || liveMetrics.chart_data.length === 0) {
      return [
        { label: 'OCT 18', ux: 140, latency: 170 },
        { label: 'OCT 20', ux: 110, latency: 150 },
        { label: 'OCT 22', ux: 160, latency: 180 },
        { label: 'OCT 24', ux: 120, latency: 140 },
        { label: 'OCT 26', ux: 90,  latency: 130 },
        { label: 'OCT 28', ux: 100, latency: 110 },
        { label: 'OCT 30', ux: 70,  latency: 120 },
      ];
    }
    const baseLabels = ['OCT 18', 'OCT 20', 'OCT 22', 'OCT 24', 'OCT 26', 'OCT 28', 'OCT 30'];
    return liveMetrics.chart_data.map((val, idx) => ({
      label: baseLabels[idx] || `POINT ${idx + 1}`,
      ux: val,
      latency: Math.max(50, val - 30)
    }));
  }, [liveMetrics]);

  const sentiment = useMemo(() => {
    const score = liveMetrics ? liveMetrics.sentiment_score : 78.4;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    return {
      circumference,
      positiveOffset: circumference - (score / 100) * circumference,
      neutralOffset: circumference - ((score + 15) / 100) * circumference,
      negativeOffset: circumference - (100 / 100) * circumference,
    };
  }, [liveMetrics]);

  const products = useMemo(() => [
    { name: 'AgentPro Workflows', rate: '92.4%', width: 'w-[92.4%]', delta: '+4.2%', isUp: true },
    { name: 'Insight SDK v4', rate: '84.1%', width: 'w-[84.1%]', delta: '+1.8%', isUp: true },
    { name: 'CloudSync Enterprise', rate: '71.8%', width: 'w-[71.8%]', delta: '-0.5%', isUp: false },
  ], []);

  const urgentFeedbacks = useMemo(() => [
    { id: 1, source: 'Email', icon: Mail, msg: 'Cannot access checkout page after v2 update...', severity: 'CRITICAL', time: '2 mins ago' },
    { id: 2, source: 'Chat', icon: MessageSquare, msg: 'API response times are exceeding 5000ms in EU...', severity: 'HIGH', time: '15 mins ago' },
    { id: 3, source: 'Twitter', icon: MessageCircle, msg: 'App crashing on login for iOS 17.4 users...', severity: 'CRITICAL', time: '24 mins ago' },
    { id: 4, source: 'Email', icon: Mail, msg: 'Invoice receipt not received for last billing...', severity: 'MEDIUM', time: '1 hr ago' },
  ], []);

  const smoothBezierPath = useMemo(() => {
    return (key) => {
      if (chartData.length === 0) return "";
      const svgWidth = 600;
      const svgHeight = 200;
      const padding = 20;
      const usableHeight = svgHeight - padding * 2;
      const values = chartData.map(d => d[key]);
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const valueRange = maxVal - minVal || 1;
      const points = chartData.map((d, i) => {
        const x = (i * svgWidth) / (chartData.length - 1);
        const y = svgHeight - (padding + ((d[key] - minVal) / valueRange) * usableHeight);
        return { x, y };
      });
      return points.reduce((path, p, i, a) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const cpX1 = a[i - 1].x + (p.x - a[i - 1].x) / 3;
        const cpY1 = a[i - 1].y;
        const cpX2 = a[i - 1].x + (2 * (p.x - a[i - 1].x)) / 3;
        const cpY2 = p.y;
        return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
      }, "");
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-xs font-mono tracking-widest text-brand-primary animate-pulse">
        SYNCING LIVE ENTERPRISE BUSINESS METRICS...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans relative">
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h2>
          <p className="text-xs text-brand-muted mt-1.5">
            Real-time performance monitoring and sentiment tracking across all enterprise product lines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Date range selector" className="btn btn-sm bg-surface border border-gray-800 text-xs text-gray-300 hover:text-white rounded-lg px-4 cursor-pointer">
            📅 Last 30 Days
          </button>
          <button className="btn btn-sm bg-brand-primary text-black font-bold text-xs rounded-lg px-4 hover:bg-indigo-400 cursor-pointer flex items-center gap-1.5">
            Export CSV <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-brand-muted">
                <span className="text-xs font-semibold tracking-wide">{item.title}</span>
                <Icon size={16} className="text-gray-500" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-white">{item.value}</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                  item.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {item.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 id="trend-chart-title" className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              📈 Top Complaints over Time
            </h3>
            <div className="flex items-center gap-4 text-[11px] text-brand-muted font-medium">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-primary" /> UX Issues</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-600" /> Latency</span>
            </div>
          </div>

          <figure className="h-64 w-full relative pt-4">
            <svg role="img" aria-labelledby="trend-chart-title" aria-describedby="chart-accessible-desc" className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="600" y2="50" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
              <path d={smoothBezierPath('ux')} fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={smoothBezierPath('latency')} fill="none" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <figcaption id="chart-accessible-desc" className="sr-only">Line chart plotting indicators.</figcaption>
            <div className="flex justify-between text-[10px] text-gray-500 font-bold font-mono mt-3 px-1">
              {chartData.map((d, i) => <span key={i}>{d.label}</span>)}
            </div>
          </figure>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono mb-4">
            📊 Sentiment Distribution
          </h3>
          <div className="relative flex items-center justify-center my-auto">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#111827" strokeWidth="10" fill="transparent" />
              <circle cx="50" cy="50" r="40" stroke="#818CF8" strokeWidth="10" fill="transparent" strokeDasharray={sentiment.circumference} strokeDashoffset={sentiment.positiveOffset} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white tracking-tight">
                {liveMetrics ? `${Math.round(liveMetrics.sentiment_score)}%` : '78%'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-green-400 mt-0.5">Positive</span>
            </div>
          </div>
          <div className="space-y-2 pt-4 text-xs font-medium border-t border-gray-850/40">
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-primary" /> Positive</span><span className="text-white font-mono">{liveMetrics ? liveMetrics.sentiment_score : 65.2}%</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-400" /> Neutral</span><span className="text-white font-mono">24.8%</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-300" /> Negative</span><span className="text-white font-mono">10.0%</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono flex items-center gap-2">
              🚨 Urgent Feedbacks
            </h4>
            <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="overflow-x-auto text-[11px] w-full">
            <table aria-label="Alerts grid" className="table table-xs w-full border-none">
              <thead>
                <tr className="border-b border-gray-800 text-brand-muted font-bold text-left">
                  <th className="bg-transparent pl-0 py-2">Source</th>
                  <th className="bg-transparent py-2">Message Snippet</th>
                  <th className="bg-transparent py-2">Severity</th>
                  <th className="bg-transparent text-right pr-0 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {urgentFeedbacks.map((item) => (
                  <FeedbackRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
              🚀 Top Performing Products
            </h4>
            <span className="text-[9px] text-gray-500 font-bold">Sorted by Conversion</span>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {products.map((prod, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">{prod.name}</span>
                  <span className="text-brand-primary font-mono">
                    {prod.rate}{' '}
                    <span className={`text-[10px] font-bold ${prod.isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {prod.delta}
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
                  <div className={`bg-brand-primary ${prod.width} h-full rounded-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── NEW DYNAMIC PREDICTIVE FORECASTING WIDGET ─── */}
      <div className="rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono flex items-center gap-2">
            <BarChart3 size={14} className="text-brand-primary" /> Predictive Insights & Revenue Forecasting
          </h4>
          <span className="text-[9px] font-mono text-gray-500 font-bold">Target Horizon: 2 Quarters</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {forecastData.map((data, index) => (
            <div key={index} className="rounded-lg bg-[#0B0F19]/60 border border-gray-850/50 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-gray-400">{data.period}</span>
                <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                  +{data.growth_rate}% Projected Growth
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-mono tracking-wide text-gray-500 uppercase font-semibold">Predicted Value</p>
                  <p className="text-xl font-bold tracking-tight text-white mt-0.5">${data.predicted_revenue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-gray-600 font-semibold">Confidence Interval</p>
                  <p className="text-[11px] font-mono text-brand-muted mt-0.5">
                    ${data.confidence_bound_low.toLocaleString()} - ${data.confidence_bound_high.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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

    </div>
  );
};

export default Analytics;