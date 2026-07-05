import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { TrendingUp, AlertTriangle, Clock, ArrowUpRight, MessageSquare, Mail, MessageCircle, Upload, Trash2, Loader2, Database, FileText } from 'lucide-react';

import MetricsGrid from '../components/analytics/MetricsGrid';
import TrendChart from '../components/analytics/TrendChart';
import SentimentCircle from '../components/analytics/SentimentCircle';
import BenchmarkingMatrix from '../components/analytics/BenchmarkingMatrix';
import ForecastSimulator from '../components/analytics/ForecastSimulator';
import UrgentFeedbacks from '../components/analytics/UrgentFeedbacks';
import TopProducts from '../components/analytics/TopProducts';

const Analytics = () => {
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [kpiSummary, setKpiSummary] = useState(null);
  const [baseForecastData, setBaseForecastData] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [searchMeta, setSearchMeta] = useState({ query: '', time: '' });
  const [loading, setLoading] = useState(true);

  // What-If Simulation States
  const [priceMultiplier, setPriceMultiplier] = useState(0); // Range: -50% to +50%
  const [efficiencyMultiplier, setEfficiencyMultiplier] = useState(0); // Range: -20% to +20%

  // Ingestion & Vector Base States
  const [activeFiles, setActiveFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [pollingDocId, setPollingDocId] = useState(null);

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get('/chat/uploaded-files');
      setActiveFiles(response.data);
      
      const kpiRes = await api.get('/chat/analytics/kpi-summary');
      setKpiSummary(kpiRes.data);
    } catch (error) {
      console.error("Failed to fetch active vector base files", error);
    }
  };

  useEffect(() => {
    const fetchAnalyticsForecastAndBenchmarking = async () => {
      try {
        const [metricsRes, forecastRes, benchmarkingRes, kpiRes] = await Promise.all([
          api.get('/chat/analytics/metrics'),
          api.get('/chat/analytics/forecast'),
          api.get('/chat/analytics/benchmarking'),
          api.get('/chat/analytics/kpi-summary')
        ]);
        
        setLiveMetrics(metricsRes.data);
        setBaseForecastData(forecastRes.data.forecast_data);
        setBenchmarks(benchmarkingRes.data.benchmarks);
        setKpiSummary(kpiRes.data);
        setSearchMeta({
          query: benchmarkingRes.data.search_query_used,
          time: benchmarkingRes.data.last_scraped_at
        });
      } catch (error) {
        console.error("Failed to fetch full enterprise analytical suite logs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsForecastAndBenchmarking();
    fetchUploadedFiles();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const commitUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await api.post('/chat/index-payload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { document_id } = response.data;
      setPollingDocId(document_id);
    } catch (error) {
      console.error("Upload failed", error);
      setUploading(false);
      const errorMsg = error.response?.data?.detail || error.message;
      if (errorMsg.includes("PAYWALL_LIMIT_REACHED")) {
        alert("Subscription Ingestion Limit Reached! Please upgrade or renew your subscription tier on the Billing & Subscriptions page to upload more files.");
      } else {
        alert(`Failed to upload document: ${errorMsg}`);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (pollingDocId) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/chat/ingestion-status/${pollingDocId}`);
          const { status, progress } = response.data;
          
          setUploadProgress(progress);

          if (status === 'completed' || status === 'failed') {
            clearInterval(interval);
            setPollingDocId(null);
            setUploading(false);
            if (status === 'completed') {
              setUploadFile(null);
              // Reset file input value
              const fileInput = document.getElementById('vector-file-upload');
              if (fileInput) fileInput.value = '';
              fetchUploadedFiles();
            }
          }
        } catch (error) {
          console.error("Polling failed", error);
          clearInterval(interval);
          setPollingDocId(null);
          setUploading(false);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [pollingDocId]);

  const handleDeleteFile = async (documentId) => {
    try {
      await api.delete(`/chat/delete-file/${documentId}`);
      fetchUploadedFiles();
    } catch (error) {
      console.error("Failed to delete file", error);
    }
  };


  const metrics = useMemo(() => {
    if (!liveMetrics) return [];
    
    const totalInteractionsVal = kpiSummary && kpiSummary.total_interactions !== undefined
      ? kpiSummary.total_interactions.toLocaleString()
      : liveMetrics.total_interactions;

    const trendPct = kpiSummary && kpiSummary.trend_percentage
      ? kpiSummary.trend_percentage
      : '+12.4%';

    const avgSentimentVal = kpiSummary && kpiSummary.avg_sentiment_score !== undefined
      ? `${kpiSummary.avg_sentiment_score}%`
      : `${liveMetrics.sentiment_score}%`;

    const sentimentTrendPct = kpiSummary && kpiSummary.sentiment_trend
      ? kpiSummary.sentiment_trend
      : '+3.1%';

    const activeComplaintsVal = kpiSummary && kpiSummary.active_complaints !== undefined
      ? String(kpiSummary.active_complaints)
      : String(liveMetrics.active_complaints);

    const complaintsTrendPct = kpiSummary && kpiSummary.complaints_trend
      ? kpiSummary.complaints_trend
      : '-4.2%';

    const responseTimeVal = kpiSummary && kpiSummary.response_time !== undefined
      ? `${kpiSummary.response_time}s`
      : liveMetrics.response_time.endsWith('m')
      ? `${(parseFloat(liveMetrics.response_time) * 60).toFixed(0)}s`
      : liveMetrics.response_time;

    const latencyTrendPct = kpiSummary && kpiSummary.latency_trend
      ? kpiSummary.latency_trend
      : '+18.5%';

    return [
      { title: 'Total Interactions', value: totalInteractionsVal, change: trendPct, isPositive: true, icon: MessageSquare },
      { title: 'Avg. Sentiment Score', value: avgSentimentVal, change: sentimentTrendPct, isPositive: true, icon: TrendingUp },
      { title: 'Active Complaints', value: activeComplaintsVal, change: complaintsTrendPct, isPositive: false, icon: AlertTriangle },
      { title: 'Response Time', value: responseTimeVal, change: latencyTrendPct, isPositive: true, icon: Clock },
    ];
  }, [liveMetrics, kpiSummary]);

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

  // Dynamic Mathematical Simulation Pipe over Ingested Forecast Vectors
  const simulatedForecastData = useMemo(() => {
    const priceEffect = 1 + priceMultiplier / 100;
    const efficiencyEffect = 1 + efficiencyMultiplier / 100;
    const combinedGrowthDelta = (priceMultiplier * 0.4) + (efficiencyMultiplier * 0.6);

    return baseForecastData.map(data => {
      const simulatedRevenue = data.predicted_revenue * priceEffect * efficiencyEffect;
      const simulatedLow = data.confidence_bound_low * priceEffect * efficiencyEffect;
      const simulatedHigh = data.confidence_bound_high * priceEffect * efficiencyEffect;
      const simulatedGrowth = data.growth_rate + combinedGrowthDelta;

      return {
        ...data,
        predicted_revenue: Math.max(0, simulatedRevenue),
        confidence_bound_low: Math.max(0, simulatedLow),
        confidence_bound_high: Math.max(0, simulatedHigh),
        growth_rate: Number(simulatedGrowth.toFixed(1))
      };
    });
  }, [baseForecastData, priceMultiplier, efficiencyMultiplier]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-xs font-mono tracking-widest text-brand-primary animate-pulse">
        SYNCING LIVE ENTERPRISE BUSINESS METRICS...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans relative pb-20">
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

      <MetricsGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <TrendChart chartData={chartData} smoothBezierPath={smoothBezierPath} />
        <SentimentCircle sentiment={sentiment} liveMetrics={liveMetrics} />
      </div>

      <BenchmarkingMatrix searchMeta={searchMeta} benchmarks={benchmarks} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <UrgentFeedbacks urgentFeedbacks={urgentFeedbacks} />
        <TopProducts products={products} />
      </div>

      <ForecastSimulator 
        simulatedForecastData={simulatedForecastData}
        priceMultiplier={priceMultiplier}
        setPriceMultiplier={setPriceMultiplier}
        efficiencyMultiplier={efficiencyMultiplier}
        setEfficiencyMultiplier={setEfficiencyMultiplier}
      />

      {/* ─── INGESTION & VECTOR BASE INVENTORY WIDGET ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
          <div className="flex flex-col gap-4 border-b border-gray-850 pb-4 mb-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono flex items-center gap-2">
                <Database size={14} className="text-brand-primary" /> Active Vector Base
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Manage custom knowledge base documents for enterprise RAG indexing.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-[#0B0F19] rounded-xl p-4 border border-gray-850 flex-wrap">
              <input 
                id="vector-file-upload"
                type="file" 
                onChange={handleFileChange} 
                className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer flex-1 min-w-[250px]"
                disabled={uploading}
              />
              <button 
                onClick={commitUpload}
                disabled={!uploadFile || uploading}
                className="btn btn-sm bg-brand-primary text-black font-bold text-xs rounded-lg px-6 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap h-10"
              >
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Indexing {uploadProgress}%</>
                ) : (
                  <><Upload size={14} /> Commit to Vector DB</>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] w-full">
            <table aria-label="Vector Base Documents" className="table table-xs w-full border-none">
              <thead>
                <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase font-mono text-[10px]">
                  <th className="bg-transparent pl-0 py-3">Document Source</th>
                  <th className="bg-transparent py-3">Chunk/Character Count</th>
                  <th className="bg-transparent text-right pr-0 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeFiles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-gray-500 font-mono text-[10px]">No documents found in the vector base.</td>
                  </tr>
                ) : (
                  activeFiles.map((doc, idx) => (
                    <tr key={idx} className="border-b border-gray-850/30 last:border-none hover:bg-gray-900/10 transition-colors">
                      <td className="bg-transparent pl-0 py-3 font-semibold text-brand-primary flex items-center gap-2">
                        <FileText size={12} /> {doc.filename || 'Unknown Document'}
                      </td>
                      <td className="bg-transparent py-3 text-gray-300 font-mono">
                        {doc.text_preview ? `${doc.text_preview.length} chars snippet...` : 'Indexed'}
                      </td>
                      <td className="bg-transparent text-right pr-0 py-3">
                        <button 
                          onClick={() => handleDeleteFile(doc.document_id || doc.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Purge Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;