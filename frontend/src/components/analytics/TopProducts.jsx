import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function TopProducts({ reports: propReports }) {
  const [internalReports, setInternalReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const isControlled = propReports !== undefined;
  const reports = isControlled ? propReports : internalReports;
  const activeLoading = isControlled ? false : loading;

  const sortedReports = Array.isArray(reports) 
    ? [...reports].sort((a, b) => {
        const aVal = a.conversion !== undefined ? a.conversion : (a.conversion_rate || '0');
        const bVal = b.conversion !== undefined ? b.conversion : (b.conversion_rate || '0');
        return parseFloat(String(bVal).replace('%', '')) - parseFloat(String(aVal).replace('%', ''));
      })
    : [];

  // 1. DIRECT API INGESTION WITH CUSTOM EVENT-BASED TRIGGER
  useEffect(() => {
    if (isControlled) return;

    const fetchTopProductsDirectly = () => {
      setLoading(true);
      console.log("🚀 [Atomic Fetch] Pulling latest data from /api/v1/chat/analytics/top-products");
      
      api.get('/chat/analytics/top-products')
        .then(res => {
          // Safely unpack the inner products array from the dictionary response object
          const targetProducts = res.data?.products || res.data || [];
          setInternalReports(targetProducts);
        })
        .catch(err => {
          console.error(err);
          setInternalReports([]);
        })
        .finally(() => {
          setLoading(false);
        });
    };

   
    fetchTopProductsDirectly();
    
    
    window.addEventListener('focus', fetchTopProductsDirectly);
    window.addEventListener('storage', fetchTopProductsDirectly); 
    window.addEventListener('reportUploaded', fetchTopProductsDirectly); 

    return () => {
      window.removeEventListener('focus', fetchTopProductsDirectly);
      window.removeEventListener('storage', fetchTopProductsDirectly);
      window.removeEventListener('reportUploaded', fetchTopProductsDirectly);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, propReports]); 

  return (
    <div className="md:col-span-5 bg-[#0B0F19]/60 backdrop-blur border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col h-auto w-full min-h-[250px]">
      
      {/* 1. HEADER ROW - THIS MUST ALWAYS BE VISIBLE */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          🚀 Top Performing Products
        </h3>
        <span className="text-[10px] md:text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-md tracking-wide">
          Sorted by Conversion ⚡
        </span>
      </div>

      {/* 2. INNER DYNAMIC CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {activeLoading ? (
          /* LOADING SPINNER IN CONTEXT */
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : Array.isArray(sortedReports) && sortedReports.length > 0 ? (
          /* RENDER DATA VIEWS & CHARTS */
          <div className="w-full space-y-4 animate-fade-in max-h-[350px] overflow-y-auto pr-1">
            {sortedReports.map((item, index) => {
              // Direct console logger to reveal exactly what keys are dropping from the network stream
              console.log(`📦 [Item Trace #${index}] Structure:`, item);

              // Support every possible variant naming convention dynamically
              const displayName = item.name || item.product_name || item.title || "Processed Item";
              const displayConversion = item.conversion !== undefined ? Number(item.conversion) : (Number(item.conversion_rate) || 0);
              const displayGrowth = item.growth !== undefined ? Number(item.growth) : (Number(item.growth_rate) || Number(item.change) || 0);

              return (
                <div key={index} className="flex flex-col w-full text-left">
                  <div className="flex justify-between items-center mb-1 text-xs md:text-sm">
                    <span className="text-slate-200 font-medium">{displayName}</span>
                    <div className="flex gap-3 font-semibold text-xs">
                      <span className="text-indigo-400">{displayConversion}%</span>
                      <span className="text-emerald-400">+{displayGrowth}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${displayConversion}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* RENDER EMPTY STATE TEXT ONLY WITH CLEAN SPACING */
          <div className="w-full flex flex-col items-center justify-center py-8 text-center max-w-xs mx-auto space-y-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl shadow-inner">
              <img 
                src="https://img.icons8.com/fluency/48/combo-chart.png" 
                alt="Analytics Icon" 
                className="w-10 h-10 opacity-75"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-normal px-2">
              No reports uploaded yet. Please upload a performance document in the sidebar to see your analytics dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}