import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Server, Key, Globe, Clock, ChevronDown, ChevronUp, Terminal, Send, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { api } from '../services/api';

const STATUS_BADGES = {
  RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  QUEUE: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
};

export default function Support() {
  // Ticket Form States
  const [category, setCategory] = useState('Document Ingestion & Processing Failure');
  const [priority, setPriority] = useState('P3 - General Guidance');
  const [diagnostics, setDiagnostics] = useState('');
  const [tickets, setTickets] = useState([]);

  const fetchMyTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setTickets(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  // AI Agent Terminal States
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! Ask me any question about the platform or setup for instant guidance.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(true);
  const chatEndRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!diagnostics.trim()) return;

    try {
      const response = await api.post('/tickets/submit', {
        category,
        urgency: priority.split(' - ')[0],
        description: diagnostics
      });
      setDiagnostics('');
      fetchMyTickets();
      alert(`Request ${response.data.id} submitted successfully!`);
    } catch (error) {
      console.error("Failed to submit request", error);
      alert("Failed to submit support request. Please try again.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputMessage('');

    try {
      const response = await api.post('/ai-support/chat', { message: userMsg });
      setChatMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error("AI Support Chat failed", error);
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: "⚠️ Failed to communicate with AI Support. Please try again." }
      ]);
    }
  };

  const faqs = [
    {
      q: "How do I resolve a 401 Unauthorized handshake on local state nodes?",
      a: "Ensure your local session key is scrubbed of literal quotes. The system automatically cleans strings using string-regex filtering before dispatching."
    },
    {
      q: "What are the exact thresholds of the What-If simulation engine?",
      a: "It extracts base annual revenue from the last ingested ledger structure, dynamically scaling mathematical deltas via user slider arrays."
    },
    {
      q: "How are Tavily web scrapers balanced under high request volumes?",
      a: "Network requests run asynchronously through our isolated Multi-Key architecture, eliminating rate limits via 4 parallel API pipelines."
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8 text-slate-200">
      
      {/* 🌟 1. HERO HEADER SECTION */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Developer Support & Systems Concierge
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Open an enterprise SLA ticket, track system reliability, or debug ingestion pipelines with our localized support agent.
        </p>
        <div className="h-px bg-slate-800/60 w-full mt-4" />
      </div>

      {/* 📊 2. SYSTEM STATUS RADAR PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        
        {/* CARD 1: Core RAG Engine */}
        <div className="flex flex-col justify-between p-5 bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all w-full min-h-[140px] text-left">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-indigo-400 border border-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-slate-200 tracking-tight leading-tight">Core RAG Engine</h4>
              <span className="text-xs text-slate-500 mt-1">Vector Index Active</span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 bg-emerald-955/20 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Operational</span>
          </div>
        </div>

        {/* CARD 2: Groq Multi-Key Router */}
        <div className="flex flex-col justify-between p-5 bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all w-full min-h-[140px] text-left">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-indigo-400 border border-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-slate-200 tracking-tight leading-tight">Groq Multi-Key Router</h4>
              <span className="text-xs text-slate-500 mt-1">Balanced load routing</span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 bg-emerald-955/20 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Operational (24k TPM)</span>
          </div>
        </div>

        {/* CARD 3: Tavily Competitor Scraper */}
        <div className="flex flex-col justify-between p-5 bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all w-full min-h-[140px] text-left">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-indigo-400 border border-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-slate-200 tracking-tight leading-tight">Tavily Competitor Scraper</h4>
              <span className="text-xs text-slate-500 mt-1">Live web search query cell</span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 bg-emerald-955/20 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Operational</span>
          </div>
        </div>

        {/* CARD 4: SLA Response Time */}
        <div className="flex flex-col justify-between p-5 bg-[#0B0F19]/60 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all w-full min-h-[140px] text-left">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-indigo-400 border border-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold text-slate-200 tracking-tight leading-tight">SLA Response Time</h4>
              <span className="text-xs text-slate-500 mt-1">On-call response window</span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2 bg-emerald-955/20 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">&lt; 15 Mins</span>
          </div>
        </div>

      </div>

      {/* 📐 3. MIDDLE SECTION: DUAL-PANEL WRAPPER (FORM + CHAT ASSISTANT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        {/* 🎫 SUBMIT FORM BLOCK */}
        <div className="lg:col-span-7 w-full bg-[#0B0F19]/60 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Submit a Support Request</h2>
            <p className="text-xs text-slate-400">Describe your issue below. Our operations team will analyze the sequence and provide an enterprise solution.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            {/* Issue Classification Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono mb-1.5">
                What are you having trouble with?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#131926] border border-slate-800 text-xs rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
              >
                <option value="Document Ingestion & Processing Failure">Document Ingestion & Processing Failure</option>
                <option value="Competitor & SWOT Report Generation Issue">Competitor & SWOT Report Generation Issue</option>
                <option value="Billing, Invoicing & Subscription Upgrades">Billing, Invoicing & Subscription Upgrades</option>
                <option value="Predictive Simulator & Sliders Unresponsive">Predictive Simulator & Sliders Unresponsive</option>
              </select>
            </div>

            {/* Severity Level inline radio-button badges */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono mb-1.5">
                How urgently do you need this resolved?
              </label>
              <div className="grid grid-cols-3 gap-2 w-full">
                {['P3 - General Guidance', 'P2 - Production Impairment', 'P1 - Mission Critical SLA Breach'].map((lvl) => {
                  const displayMap = {
                    'P3 - General Guidance': { title: 'Low', sub: 'General Question / Guidance' },
                    'P2 - Production Impairment': { title: 'Medium', sub: 'Feature or Report Loading Slowly' },
                    'P1 - Mission Critical SLA Breach': { title: 'High', sub: 'Complete Blocker / Cannot Process Documents' }
                  };
                  const disp = displayMap[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`px-2 py-3 text-[10px] sm:text-xs md:text-sm text-center font-medium border rounded-lg transition-all cursor-pointer ${
                        priority === lvl
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                          : 'bg-[#131926] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {disp.title}
                      <span className="block text-[8px] text-slate-500 font-normal mt-0.5">{disp.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed System Diagnostics Textarea */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono mb-1.5">
                Issue Description & Details
              </label>
              <textarea
                value={diagnostics}
                onChange={(e) => setDiagnostics(e.target.value)}
                rows={4}
                placeholder="Please describe what happened, or paste any error message you saw on your screen here..."
                className="w-full bg-[#131926] border border-slate-800 text-xs rounded-lg p-3 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-md font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* 🤖 AI SUPPORT ASSISTANT CHAT BLOCK */}
        <div className="lg:col-span-5 w-full h-[450px] flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Terminal Titlebar */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-400" />
              <span className="text-[11px] font-mono text-slate-300 font-bold">AI Support Assistant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-slate-500">ONLINE</span>
            </div>
          </div>

          {/* Terminal Feed */}
          <div className="w-full flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3 bg-[#05070f] scrollbar-thin scrollbar-thumb-slate-800">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`max-w-[85%] rounded px-3 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.sender === 'system'
                      ? 'bg-slate-950 text-indigo-400 border border-indigo-950 rounded-bl-none'
                      : 'bg-[#121624] text-slate-300 border border-slate-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Terminal Input */}
          <form onSubmit={handleSendMessage} className="bg-slate-955 p-2.5 border-t border-slate-800/80 flex items-center gap-2 w-full">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-[#0d101a] border border-slate-800 rounded text-xs px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-indigo-500/60 min-w-0"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors active:scale-95 cursor-pointer flex-shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>

      </div>

      {/* 📐 4. BOTTOM SECTION: DUAL-PANEL WRAPPER (INCIDENT LEDGER + FAQ ACCORDION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start mt-8">
        
        {/* 📊 ENTERPRISE INCIDENT LEDGER */}
        <div className="lg:col-span-7 w-full bg-slate-900/20 border border-slate-800/60 rounded-2xl p-4 overflow-x-auto shadow-xl">
          <h3 className="text-sm font-semibold text-white mb-4 px-2">Enterprise Incident Ledger</h3>
          <table className="w-full text-left text-xs text-slate-400 min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-800 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2 px-2">Ticket ID</th>
                <th>Category</th>
                <th>Opened Date</th>
                <th>Urgency</th>
                <th className="px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tkt, idx) => (
                <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-900/10 transition-colors">
                  <td className="py-3 px-2 font-mono text-indigo-400 font-bold">{tkt.id}</td>
                  <td className="py-3 text-slate-200 pr-4">
                    <div>{tkt.category}</div>
                    {tkt.status === "RESOLVED" && tkt.admin_reply && (
                      <div className="mt-2 p-2 bg-emerald-955/30 border border-emerald-800/40 rounded text-[11px] text-emerald-300 max-w-md">
                        <span className="font-bold uppercase text-[9px] tracking-wider text-emerald-400 block mb-0.5">Official Solution:</span>
                        {tkt.admin_reply}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-slate-500">{tkt.created_at ? new Date(tkt.created_at).toISOString().split('T')[0] : ''}</td>
                  <td className="py-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      tkt.urgency === 'P1' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      tkt.urgency === 'P2' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {tkt.urgency}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider ${STATUS_BADGES[tkt.status] || STATUS_BADGES.QUEUE}`}>
                      ● {tkt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📚 TECHNICAL FAQ ACCORDION */}
        <div className="lg:col-span-5 w-full bg-[#0B0F19]/60 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-white mb-2">Technical FAQ Accordion</h3>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-[#111624]/40 w-full">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800/20 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} />}
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 border-t border-slate-800/40 text-xs text-slate-400 font-mono leading-relaxed bg-[#0d101a]/30 w-full">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
