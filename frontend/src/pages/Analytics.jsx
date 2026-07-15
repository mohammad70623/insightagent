import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { TrendingUp, AlertTriangle, Clock, ArrowUpRight, MessageSquare, Mail, MessageCircle, Upload, Trash2, Loader2, Database, FileText, CheckCircle2 } from 'lucide-react';

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
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState([]);
  const [searchMeta, setSearchMeta] = useState({ query: '', time: '' });
  const [loading, setLoading] = useState(true);

  // 6 Sliders Simulation states
  const [priceAdjuster, setPriceAdjuster] = useState(0);
  const [marketingBoost, setMarketingBoost] = useState(0);
  const [productInnovation, setProductInnovation] = useState(0);
  const [opEfficiency, setOpEfficiency] = useState(0);
  const [supportCapacity, setSupportCapacity] = useState(0);
  const [competitionThreat, setCompetitionThreat] = useState(0);
  const [insightText, setInsightText] = useState("Awaiting simulation variables...");
  const [loadingAI, setLoadingAI] = useState(false);

  // Ingestion & Vector Base States
  const [activeFiles, setActiveFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [pollingDocId, setPollingDocId] = useState(null);
  const [complaintsTimeline, setComplaintsTimeline] = useState([]);
  const [timelineCategories, setTimelineCategories] = useState([]);
  const [sentimentData, setSentimentData] = useState(null);
  const [urgentFeedbacks, setUrgentFeedbacks] = useState([]);
  const [reports, setReports] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, severity) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, severity }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const fetchComplaintsTimeline = async () => {
    try {
      const response = await api.get('/chat/analytics/complaints-timeline');
      if (response.data.success) {
        setComplaintsTimeline(response.data.data);
        setTimelineCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch complaints timeline:", error);
    }
  };

  const fetchSentimentDistribution = async () => {
    try {
      const response = await api.get('/chat/analytics/sentiment-distribution');
      if (response.data.success) {
        setSentimentData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sentiment distribution:", error);
    }
  };

  const fetchUrgentFeedbacks = async () => {
    try {
      const res = await api.get('/chat/analytics/urgent-feedbacks');
      const liveData = res.data?.feedbacks || res.data?.data || res.data || [];
      
      setUrgentFeedbacks(prev => {
        // Create a unique index of existing item IDs to avoid duplicates
        const existingIds = new Set(prev.map(item => item.id));
        const newUniqueItems = liveData.filter(item => item.id && !existingIds.has(item.id));
        
        // Trigger toast for new unique items
        newUniqueItems.forEach(item => {
          addToast(`🚨 EMERGENCY: ${item.message_snippet}`, item.severity);
        });
        
        return [...newUniqueItems, ...prev]; // Stack new critical tickets directly on top
      });
    } catch (err) {
      console.error("Error updating triage buffer:", err);
    }
  };

  const handleSendReply = async (emailId, recipient, subject, bodyText) => {
    try {
      // 1. Dispatch active SMTP payload to backend
      await api.post('/chat/analytics/send-reply', {
        to_email: recipient,
        subject: subject,
        reply_body: bodyText
      });
      
      // 2. Instantly remove the resolved mail from UI state so it disappears
      setUrgentFeedbacks(prev => prev.filter(item => item.id !== emailId));
      
      addToast("Reply successfully dispatched to the customer. This ticket is now resolved and has been cleared from your active queue.", "SUCCESS");
    } catch (err) {
      console.error("Outbound transmission failed:", err);
      addToast(`Outbound email transmission failed. Our mail gateway returned: ${err.response?.data?.detail || err.message}`, "ERROR");
    }
  };

  const fetchCompetitorMatrix = async () => {
    try {
      const response = await api.get('/chat/analytics/competitor-matrix');
      if (response.data.success) {
        setBenchmarks(response.data.matrix || []);
        setSearchMeta({
          query: response.data.scraping_query,
          time: response.data.scraped_at
        });
      }
    } catch (error) {
      console.error("Failed to fetch competitor matrix:", error);
    }
  };

  // Dynamic resolution of the active document
  const activeDocumentId = activeFiles.length > 0 ? (activeFiles[0].document_id || activeFiles[0].id) : null;

  const fetchTopProducts = async () => {
    try {
      const url = activeDocumentId 
        ? `/chat/analytics/top-products?doc_id=${activeDocumentId}`
        : '/chat/analytics/top-products';
      const response = await api.get(url);
      console.log("📡 TOP PRODUCTS RAW API RESPONSE:", response.data); // Debug trace
      const fetchedProducts = response.data?.products || (Array.isArray(response.data) ? response.data : []);
      setReports(fetchedProducts);
    } catch (error) {
      console.error("Failed to fetch top products:", error);
      setReports([]);
    }
  };

  useEffect(() => {
    if (activeDocumentId) {
      fetchTopProducts();
    } else {
      setReports([]);
    }
  }, [activeDocumentId]);

  useEffect(() => {
    api.get('/chat/analytics/top-products')
      .then(res => {
        console.log("📡 [FRONTEND DEBUG RAW RES]:", res);
        console.log("📦 [FRONTEND DEBUG DATA EMBED]:", res.data);
        
        // Fallback safe assignment
        const dataArray = res.data?.products || res.data || [];
        console.log("📊 [FINAL UNPACKED ARRAY STATE]:", dataArray);
        setReports(dataArray);
      })
      .catch(err => {
        console.error("❌ [API FETCH CRASH]:", err);
        setReports([]);
      });
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get('/chat/uploaded-files');
      setActiveFiles(response.data);
      
      const kpiRes = await api.get('/chat/analytics/kpi-summary');
      setKpiSummary(kpiRes.data);
    } catch (error) {
      console.error("Failed to fetch active vector base files", error);
    }

    // Call sub-fetches independently to prevent one crash from blocking others
    Promise.all([
      fetchComplaintsTimeline().catch(e => console.error(e)),
      fetchSentimentDistribution().catch(e => console.error(e)),
      fetchCompetitorMatrix().catch(e => console.error(e)),
      fetchUrgentFeedbacks().catch(e => console.error(e)),
      fetchTopProducts().catch(e => console.error(e))
    ]);
  };

  useEffect(() => {
    const fetchAnalyticsForecastAndBenchmarking = async () => {
      try {
        const [metricsRes, kpiRes] = await Promise.all([
          api.get('/chat/analytics/metrics'),
          api.get('/chat/analytics/kpi-summary')
        ]);
        
        setLiveMetrics(metricsRes.data);
        setKpiSummary(kpiRes.data);
      } catch (error) {
        console.error("Failed to fetch full enterprise analytical suite logs:", error);
      }
    };
    
    const initFetch = async () => {
      try {
        await Promise.all([
          fetchAnalyticsForecastAndBenchmarking(),
          fetchUploadedFiles(),
          fetchForecast(0, 0)
        ]);
      } catch (error) {
        console.error("Failed to complete initial analytical suite sync:", error);
      } finally {
        setLoading(false);
      }
    };

    initFetch();
  }, []);

  const fetchForecast = async (priceVal = 0, effVal = 0) => {
    setForecastLoading(true);
    try {
      const response = await api.post('/chat/analytics/forecast', {
        price_adjuster: priceVal,
        op_efficiency: effVal
      });
      setForecastData(response.data);
    } catch (error) {
      console.error("Failed to fetch predictive insights forecasting:", error);
      setForecastData({ status: "error", projected_revenue: 0, base_revenue: 50000, ai_insight: "Forecast unavailable — please check your connection and retry." });
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchLiveAISimulation = async () => {
    setLoadingAI(true);
    try {
      const response = await api.post("/predictive/simulate", {
        priceAdjuster: Number(priceAdjuster),
        marketingBoost: Number(marketingBoost),
        productInnovation: Number(productInnovation),
        opEfficiency: Number(opEfficiency),
        supportCapacity: Number(supportCapacity),
        competitionThreat: Number(competitionThreat)
      });
      setInsightText(response.data.aiMarkdownReport);
    } catch (error) {
      console.error("AI Live Sync failed", error);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchForecast(priceAdjuster, opEfficiency);
      fetchLiveAISimulation();
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [priceAdjuster, marketingBoost, productInnovation, opEfficiency, supportCapacity, competitionThreat]);

  useEffect(() => {
    fetchUrgentFeedbacks();
    
    // Set a clean 60-second interval pool for background checks
    const interval = setInterval(() => {
      fetchUrgentFeedbacks();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        addToast("File Too Large: Maximum allowed file size is 10 MB. Please compress your document and try again.", "ERROR");
        e.target.value = '';
        return false;
      }
      setUploadFile(file);
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
      console.error("DEBUG UPLOAD ERROR:", error);
      setUploading(false);
      const errorMsg = error.response?.data?.detail || error.message;
      if (errorMsg.includes("PAYWALL_LIMIT_REACHED")) {
        addToast("Subscription Ingestion Limit Reached! Please upgrade or renew your subscription tier on the Billing & Subscriptions page to upload more files.", "ERROR");
      } else {
        addToast(`Failed to upload document: ${errorMsg}`, "ERROR");
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
    if (!complaintsTimeline || complaintsTimeline.length === 0) {
      const offsets = [-12, -10, -8, -6, -4, -2, 0];
      return offsets.map(offset => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
        return { label };
      });
    }
    return complaintsTimeline.map(item => {
      const row = { label: item.date.toUpperCase() };
      timelineCategories.forEach(cat => {
        row[cat] = item[cat] || 0;
      });
      return row;
    });
  }, [complaintsTimeline, timelineCategories]);




  const smoothBezierPath = useMemo(() => {
    return (key) => {
      if (chartData.length === 0) return "";
      const svgWidth = 600;
      const svgHeight = 200;
      const padding = 20;
      const usableHeight = svgHeight - padding * 2;
      const allCategoryKeys = timelineCategories.length > 0 ? timelineCategories : [key];
      const allValues = chartData.flatMap(d => allCategoryKeys.map(k => d[k] || 0));
      const maxVal = Math.max(...allValues, 1);
      const minVal = 0;
      const valueRange = maxVal - minVal;
      const points = chartData.map((d, i) => {
        const x = (i * svgWidth) / (chartData.length - 1);
        const y = svgHeight - (padding + (((d[key] || 0) - minVal) / valueRange) * usableHeight);
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
  }, [chartData, timelineCategories]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-xs font-mono tracking-widest text-brand-primary animate-pulse">
       Loading Analytics Dashboard...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 text-slate-200">
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
        <TrendChart chartData={chartData} categories={timelineCategories} smoothBezierPath={smoothBezierPath} />
        <SentimentCircle sentimentData={sentimentData} />
      </div>

      <BenchmarkingMatrix searchMeta={searchMeta} benchmarks={benchmarks} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <UrgentFeedbacks urgentFeedbacks={urgentFeedbacks} onSendReply={handleSendReply} />
        <TopProducts reports={reports} />
      </div>

      <ForecastSimulator 
        forecastData={forecastData}
        forecastLoading={forecastLoading}
        priceAdjuster={priceAdjuster}
        setPriceAdjuster={setPriceAdjuster}
        marketingBoost={marketingBoost}
        setMarketingBoost={setMarketingBoost}
        productInnovation={productInnovation}
        setProductInnovation={setProductInnovation}
        opEfficiency={opEfficiency}
        setOpEfficiency={setOpEfficiency}
        supportCapacity={supportCapacity}
        setSupportCapacity={setSupportCapacity}
        competitionThreat={competitionThreat}
        setCompetitionThreat={setCompetitionThreat}
        insightText={insightText}
        loadingAI={loadingAI}
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
              <p className="text-[10px] text-gray-500/70 mt-0.5 font-mono">Maximum file size allowed is 10 MB.</p>
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

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 animate-slide-in text-xs backdrop-blur-md ${
              toast.severity === 'CRITICAL' 
                ? 'bg-red-950/80 border-red-500/40 text-red-200 font-mono' 
                : toast.severity === 'SUCCESS'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : toast.severity === 'ERROR'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-200 font-mono'
            }`}
          >
            {toast.severity === 'SUCCESS' ? (
              <CheckCircle2 className="flex-shrink-0 mt-0.5 text-emerald-400" size={14} />
            ) : toast.severity === 'ERROR' ? (
              <AlertTriangle className="flex-shrink-0 mt-0.5 text-rose-400" size={14} />
            ) : (
              <AlertTriangle className="flex-shrink-0 animate-bounce mt-0.5" size={14} />
            )}
            <div>
              <div className="font-bold uppercase tracking-wider text-[9px] mb-0.5 text-white">
                {toast.severity === 'SUCCESS' 
                  ? '✓ Action Complete' 
                  : toast.severity === 'ERROR' 
                  ? '✕ System Error' 
                  : `🚨 ${toast.severity} Threat Detected`}
              </div>
              <p className="leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white font-bold ml-auto pl-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;