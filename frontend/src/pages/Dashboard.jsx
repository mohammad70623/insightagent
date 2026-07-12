import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import CriticalRiskAlerts from '../components/analytics/CriticalRiskAlerts';
import InfrastructureHealth from '../components/analytics/InfrastructureHealth';
import { UploadCloud, MessageSquare, Settings2, MoreVertical, Database, X, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate(); 
  const { profilePicRef } = useOutletContext() || {};
  const [showTip, setShowTip] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [mitigations, setMitigations] = useState([]);
  const [isScanningAlerts, setIsScanningAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState({
    has_uploaded_data: false,
    has_processed_data: false,
    has_explored_insights: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [userName, setUserName] = useState('Admin');

  // Transition and onboarding states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'completed'

  useEffect(() => {
    const handleOnboardingComplete = () => {
      // Force the LiveStreamEngine to show success logs first
      setCurrentStep('completed');
      setIsAnalyzing(true);
      setOnboardingStep(2); // Keep checklist visible with step 2 completed during 6s transition

      // Hard minimum 6-second delay, then force flip everything
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep('idle'); // Reset engine to dark skeleton
        setOnboardingStep(3);   // FORCE flip left panel to RECENT DATA INVENTORY TABLE
      }, 6000);
    };

    const fetchLiveAnomalies = async () => {
      try {
        setIsScanningAlerts(true);
        const response = await api.get('/chat/analytics/anomalies');
        setRiskAlerts(response.data.alerts || []);
        setMitigations(response.data.mitigations || []);
      } catch (error) {
        console.error("Failed to fetch live business anomalies:", error);
      } finally {
        setIsScanningAlerts(false);
        setLoading(false);
      }
    };

    const fetchOnboardingAndInventory = async () => {
      try {
        const response = await api.get('/user/onboarding-status');
        setOnboardingStatus(response.data);
        
        const { has_uploaded_data, has_processed_data, has_explored_insights } = response.data;
        
        if (has_uploaded_data && has_processed_data && has_explored_insights) {
          setOnboardingStep(3);
          setIsProcessing(false);
          setIsAnalyzing(false);
          setCurrentStep('idle');
        } else if (has_uploaded_data && !has_processed_data) {
          setOnboardingStep(2);
          setIsProcessing(true);
          setIsAnalyzing(true);
          setCurrentStep('processing');
        } else if (has_uploaded_data && has_processed_data) {
          // Ingestion pipeline finished! Trigger the master transition controller.
          handleOnboardingComplete();
        } else {
          setOnboardingStep(1);
          setIsProcessing(false);
          setIsAnalyzing(false);
          setCurrentStep('idle');
        }
      } catch (error) {
        console.error("Failed to fetch onboarding progress or inventory:", error);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/profile/me');
        if (response.data) {
          const name = response.data.name || response.data.email?.split('@')[0] || 'Admin';
          setUserName(name);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchLiveAnomalies();
    fetchOnboardingAndInventory();
    fetchUserProfile();
  }, []);

  // Fetch uploaded files once onboarding Step 3 is activated
  useEffect(() => {
    if (onboardingStep === 3) {
      const fetchInventory = async () => {
        try {
          setLoadingFiles(true);
          const filesResponse = await api.get('/chat/uploaded-files');
          setUploadedFiles(filesResponse.data);
        } catch (error) {
          console.error("Failed to fetch inventory:", error);
        } finally {
          setLoadingFiles(false);
        }
      };
      fetchInventory();
    }
  }, [onboardingStep]);

  const handleAnalyzeClick = async (documentId) => {
    if (!documentId) return;

    // Store active document_id in localStorage so that other components (like SWOT assistant)
    // know which document is currently selected/analyzed.
    localStorage.setItem("active_document_id", documentId);

    // 1. Trigger active processing layout states immediately
    setIsAnalyzing(true);
    setCurrentStep('processing');
    setRiskAlerts([]); // Clear previous table rows instantly during new scan
    setMitigations([]); // Clear mitigations as well

    try {
      const rawToken = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!rawToken) {
        console.error("Missing credentials for risk telemetry validation.");
        setCurrentStep('idle');
        setIsAnalyzing(false);
        return;
      }
      
      // Scrub any trailing or wrapping quotation marks from local storage string
      const cleanToken = rawToken.replace(/^["']|["']$/g, '');

      // Resolve backend origin dynamically from VITE_API_BASE_URL
      const baseApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
      const backendOrigin = baseApiUrl.includes("/api/v1") 
        ? baseApiUrl.replace("/api/v1", "") 
        : baseApiUrl;
      const targetUrl = `${backendOrigin}/api/analyze`;

      // 2. Fire the real API call to the RAG Anomaly Detection Core backend via axios
      const response = await axios.post(targetUrl, { document_id: documentId }, {
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.data) throw new Error('RAG Analysis Execution Failed');

      const data = response.data;
      // Expected incoming JSON structure: { success: true, alerts: [...], mitigations: [...] }

      // 3. Flash the green success state indicator on the LIVE_STREAM_ENGINE
      setCurrentStep('completed');
      
      // 4. Commit the dynamic, variable-length AI-predicted risk array and mitigations to state
      setRiskAlerts(data.alerts || []);
      setMitigations(data.mitigations || []);

    } catch (error) {
      console.error("Full-Stack API Integration Error:", error.response?.data || error);
      setCurrentStep('idle');
    } finally {
      // 5. Provide a smooth 1.5-second visual delay for the success state before resetting the stream engine to standby
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep('idle');
        setOnboardingStep(3); // Unlocks standard workspace dashboard layout view
      }, 1500);
    }
  };

  const handleAccountSettingsClick = () => {
    if (profilePicRef && profilePicRef.current) {
      profilePicRef.current.click();
    } else {
      navigate('/app/admin');
    }
  };

  const isAllCompleted = onboardingStatus.has_uploaded_data && onboardingStatus.has_processed_data && onboardingStatus.has_explored_insights;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in font-sans">
      
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome to InsightAgent, {userName}!
          </h2>
          <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
            Get started by uploading your first business document. Analytics and intelligence reports are ready in seconds.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/app/upload')} 
            className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <UploadCloud size={15} /> Upload Dataset
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/app/chat')} 
            className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <MessageSquare size={15} /> New AI Chat
          </button>
          
          <button 
            type="button"
            onClick={handleAccountSettingsClick} 
            className="btn btn-sm bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 gap-2 font-semibold capitalize rounded-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Settings2 size={15} /> Account Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {onboardingStep === 3 ? (
          <div className="lg:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-8 shadow-xl flex flex-col justify-between transition-all duration-500 ease-in-out min-h-[300px]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-4 font-mono flex items-center gap-2">
                <FileText size={16} className="text-brand-primary" /> Recent Data Inventory Table
              </h3>
              {/* Business-Friendly & Clear Subtitle */}
              <p className="text-sm text-slate-400 font-normal leading-relaxed mt-1">
                Below are the uploaded documents currently processed and ready for analysis.
              </p>

              <div className="overflow-x-auto text-xs w-full flex-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {loadingFiles ? (
                  <div className="text-gray-500 font-mono text-[11px] py-4 animate-pulse">Synchronizing vector index status...</div>
                ) : uploadedFiles.length === 0 ? (
                  <div className="text-gray-500 font-mono text-[11px] py-4">No data files found in your inventory. Get started by uploading one!</div>
                ) : (
                  <table aria-label="Uploaded data inventory grid" className="table table-xs w-full border-none">
                    <thead>
                      <tr className="border-b border-gray-800 text-brand-muted font-bold text-left uppercase text-[10px] font-mono">
                        <th scope="col" className="bg-transparent pl-0 py-2">Document ID</th>
                        <th scope="col" className="bg-transparent py-2">Filename</th>
                        <th scope="col" className="bg-transparent text-right pr-0 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((file) => (
                        <tr key={file.document_id} className="border-b border-gray-850/40 last:border-none">
                          <td className="bg-transparent pl-0 font-mono text-gray-500 py-3 truncate max-w-[120px]" title={file.document_id}>
                            {file.document_id}
                          </td>
                          <td className="bg-transparent text-gray-300 font-medium py-3 truncate max-w-[200px]" title={file.filename}>
                            {file.filename}
                          </td>
                          <td className="bg-transparent text-right pr-0 py-3">
                            <button
                              type="button"
                              onClick={() => handleAnalyzeClick(file.document_id)}
                              className="text-brand-primary hover:text-brand-primary/80 hover:underline text-[11px] font-bold cursor-pointer"
                              disabled={isAnalyzing}
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 rounded-xl border border-gray-800/40 bg-surface p-8 shadow-xl flex flex-col justify-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-6 font-mono">
              Onboarding Checklist
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 border-l-2 border-brand-primary pl-4 transition-all">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  onboardingStatus.has_uploaded_data
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                } font-mono text-sm font-black shadow-[0_0_12px_rgba(129,140,248,0.15)]`}>
                  {onboardingStatus.has_uploaded_data ? <CheckCircle size={16} className="text-emerald-400" /> : '1'}
                </div>
                <div>
                  <h4 className={`text-sm font-bold tracking-wide ${onboardingStatus.has_uploaded_data ? 'text-gray-500 line-through font-normal' : 'text-white'}`}>Upload Data</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${onboardingStatus.has_uploaded_data ? 'text-gray-600' : 'text-brand-muted'}`}>
                    Ingest CSV or JSON files via the native secure Ingest Engine.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-l-2 border-transparent pl-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  onboardingStatus.has_processed_data
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-800 bg-[#0B0F19] text-gray-500 font-mono text-sm font-bold'
                }`}>
                  {onboardingStatus.has_processed_data ? <CheckCircle size={16} className="text-emerald-400" /> : '2'}
                </div>
                <div>
                  <h4 className={`text-sm font-bold tracking-wide ${onboardingStatus.has_processed_data ? 'text-gray-500 line-through font-normal' : 'text-gray-400'}`}>Automated AI Processing</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${onboardingStatus.has_processed_data ? 'text-gray-600' : 'text-gray-600'}`}>
                    InsightAgent's RAG and deep LLMs automatically tag, analyze, and index your ingested feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-l-2 border-transparent pl-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  onboardingStatus.has_explored_insights
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-800 bg-[#0B0F19] text-gray-500 font-mono text-sm font-bold'
                }`}>
                  {onboardingStatus.has_explored_insights ? <CheckCircle size={16} className="text-emerald-400" /> : '3'}
                </div>
                <div>
                  <h4 className={`text-sm font-bold tracking-wide ${onboardingStatus.has_explored_insights ? 'text-gray-500 line-through font-normal' : 'text-gray-400'}`}>Explore Insights</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${onboardingStatus.has_explored_insights ? 'text-gray-600' : 'text-gray-600'}`}>
                    Access the core interactive analytics canvas and trigger conversation models with data blocks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-5 relative flex min-h-[260px] items-center justify-center rounded-xl border border-gray-800/40 bg-surface p-6 overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="relative w-full max-w-sm rounded-lg border border-gray-800/80 bg-[#111625] p-4 shadow-2xl backdrop-blur-sm transition-all duration-500">
            <div className="flex items-center justify-between border-b border-gray-850 pb-2 mb-4">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase font-bold">LIVE_STREAM_ENGINE</span>
            </div>
            
            <div className="space-y-4">
              {/* Dynamic Database Icon Glow Container */}
              <div className="h-24 w-full rounded border border-gray-800/40 bg-gray-950/40 flex items-center justify-center transition-all duration-500">
                <Database 
                  size={36} 
                  className={`transition-all duration-500 ${
                    currentStep === 'uploading'
                      ? "text-blue-400 animate-pulse drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]"
                      : currentStep === 'processing'
                      ? "text-cyan-400 animate-pulse drop-shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                      : currentStep === 'completed'
                      ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]"
                      : "text-gray-650 animate-pulse"
                  }`} 
                />
              </div>
              
              {/* Terminal Logs */}
              <div className="font-mono text-[10px] space-y-1.5 p-3 rounded bg-black/40 border border-gray-900/60 text-gray-400 min-h-[50px] flex flex-col justify-center transition-all duration-500">
                {currentStep === 'idle' && (
                  <>
                    <div className="text-gray-400 font-semibold">[IDLE]: System operational. Awaiting next user request.</div>
                    <div className="text-gray-655">[SYSTEM]: Security gateway and background sync active.</div>
                  </>
                )}
                {currentStep === 'uploading' && (
                  <>
                    <div className="text-blue-400 animate-pulse font-semibold">[INGESTION]: Ingesting raw enterprise dataset...</div>
                    <div className="text-gray-500">[SYSTEM]: Stream writing blocks to secure storage.</div>
                  </>
                )}
                {currentStep === 'processing' && (
                  <>
                    <div className="text-cyan-400 animate-pulse font-semibold">[QDRANT]: Vectorizing text chunks & upserting...</div>
                    <div className="text-cyan-500/80">[LLAMA3]: Initiating RAG agentic workflow reasoning.</div>
                  </>
                )}
                {currentStep === 'completed' && (
                  <>
                    <div className="text-emerald-400 font-semibold">[SUCCESS]: Multi-agent core pipeline initialized.</div>
                    <div className="text-emerald-500/70">[SYSTEM]: Unlocking full-stack Workspace Core Inventory...</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        <CriticalRiskAlerts 
          riskAlerts={riskAlerts} 
          mitigationPlans={mitigations}
          isAnalyzing={isAnalyzing || isScanningAlerts} 
          currentStep={currentStep} 
        />

        <InfrastructureHealth 
          riskAlerts={riskAlerts} 
          isAnalyzing={isAnalyzing || isScanningAlerts} 
          currentStep={currentStep} 
        />

      </div>

      {showTip && (
        <div className="flex items-center justify-between rounded-xl border border-gray-800/50 bg-surface px-6 py-3 text-xs text-brand-muted shadow-md transition-all animate-fade-in">
          <span className="flex items-center gap-2 leading-relaxed">
            ✨ <strong>Tip:</strong> Use the global search bar at the top to instantly find and analyze documents across your entire workspace.
          </span>
          <button onClick={() => setShowTip(false)} type="button" className="text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none" aria-label="Dismiss tip">
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;