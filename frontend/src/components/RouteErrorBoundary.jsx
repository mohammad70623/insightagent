import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

/**
 * RouteErrorBoundary
 * Displays a premium, styled error fallback page when any component in the route tree crashes.
 */
const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("RouteErrorBoundary caught:", error);

  // Extract message details if available
  const errorMessage = error instanceof Error 
    ? error.message 
    : (error?.message || error?.statusText || "An unexpected error occurred.");

  const errorStack = error instanceof Error ? error.stack : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] text-white p-6 font-sans">
      <div 
        style={{
          maxWidth: '520px',
          width: '100%',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.05)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Animated Warning Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 animate-pulse">
          <AlertOctagon size={36} />
        </div>
        
        <h1 className="text-xl font-black tracking-tight text-white mb-2 font-sans">
          UNEXPECTED RUNTIME EXCEPTION
        </h1>
        <p className="text-xs text-gray-400 mb-5">
          InsightAgent core caught a rendering or application crash. The exception detail is logged below.
        </p>
        
        {/* Error Details */}
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-800 bg-black/45 text-left font-mono">
          <div className="flex items-center justify-between bg-gray-900/60 px-4 py-2 text-[10px] text-gray-500 border-b border-gray-850">
            <span>REFERENCE ERROR LOG</span>
            <span className="text-red-400/80 font-bold">FATAL</span>
          </div>
          <div className="p-4 overflow-x-auto text-[11px] text-red-350 leading-relaxed max-h-48 scrollbar-thin">
            <div className="font-bold text-red-400 mb-1">{errorMessage}</div>
            {errorStack && (
              <pre className="text-gray-500 whitespace-pre text-[9px] mt-2 leading-normal">
                {errorStack}
              </pre>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 btn btn-sm bg-brand-primary text-black font-bold h-10 hover:bg-indigo-400 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] border-none"
          >
            <RefreshCw size={14} /> Sync & Reload
          </button>
          
          <button
            type="button"
            onClick={() => {
              // If in /app sub-route, navigating to app/dashboard is safer, else to main
              navigate('/app/dashboard');
              window.location.reload(); // Force refresh to clear states if needed
            }}
            className="flex-1 btn btn-sm bg-gray-800 hover:bg-gray-700 text-white font-semibold h-10 border border-gray-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Home size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
