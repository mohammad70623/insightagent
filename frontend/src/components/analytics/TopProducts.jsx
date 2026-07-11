import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function TopProducts() {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. DIRECT API INGESTION WITH NO PARENT DEPENDENCY
  useEffect(() => {
    const fetchTopProductsDirectly = async () => {
      try {
        setLoading(true);
        console.log("🚀 [Atomic Fetch] Attempting to pull directly from /api/v1/chat/analytics/top-products");
        
        const response = await api.get('/chat/analytics/top-products');
        console.log("📡 [Atomic Fetch Success] Raw Payload Received:", response.data);

        // Extract using strict structural unpackers
        const dataPayload = response.data?.products || response.data?.top_products || response.data?.data || response.data;
        
        if (Array.isArray(dataPayload)) {
          setProductsList(dataPayload);
        } else {
          console.error("❌ Expected array but received:", dataPayload);
          setProductsList([]);
        }
      } catch (error) {
        console.error("❌ Dynamic data link failed:", error);
        setProductsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProductsDirectly();
    
    // Optional: Poll or refresh data when window refocuses or local storage changes
    window.addEventListener('focus', fetchTopProductsDirectly);
    return () => window.removeEventListener('focus', fetchTopProductsDirectly);
  }, []);

  if (loading) {
    return (
      <div className="md:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="md:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 h-full flex flex-col justify-between">
      {/* Structural Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          🚀 Top Performing Products
        </h3>
        <span className="text-xs text-slate-500 font-medium">Sorted by Conversion</span>
      </div>

      {/* Render Dynamic Rows or Explicit Fallback */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Strict Universal Dynamic Data Resolver */}
        {productsList && productsList.length > 0 ? (
          <div className="w-full space-y-4">
            {productsList.map((item, index) => {
              // Direct console logger to reveal exactly what keys are dropping from the network stream
              console.log(`📦 [Item Trace #${index}] Structure:`, item);

              // Support every possible variant naming convention dynamically
              const displayName = item.name || item.product_name || item.title || "Processed Item";
              const displayConversion = item.conversion !== undefined ? item.conversion : (item.conversion_rate || 0);
              const displayGrowth = item.growth !== undefined ? item.growth : (item.growth_rate || item.change || 0);

              return (
                <div key={index} className="flex flex-col w-full">
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
          <div className="flex flex-col items-center justify-center text-center py-6">
            <span className="text-2xl text-amber-500 mb-2">⚡</span>
            <p className="text-xs text-slate-400 font-normal max-w-xs mx-auto leading-relaxed">
              No reports uploaded yet. Please upload a performance document in the sidebar to see your analytics dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
