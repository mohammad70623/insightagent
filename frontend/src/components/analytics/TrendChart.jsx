import React from 'react';

const colors = ["#818CF8", "#34D399", "#F59E0B", "#F87171", "#60A5FA", "#A78BFA", "#EC4899", "#14B8A6"];

const TrendChart = ({ chartData, categories = [], smoothBezierPath }) => {
  return (
    <div className="lg:col-span-8 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 id="trend-chart-title" className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
          📈 Top Complaints over Time
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-brand-muted font-medium">
          {categories.length === 0 ? (
            <span className="text-[10px] text-gray-500 font-mono">NO ACTIVE DISCOVERED INCIDENTS</span>
          ) : (
            categories.map((cat, idx) => {
              const color = colors[idx % colors.length];
              return (
                <span key={cat} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {cat}
                </span>
              );
            })
          )}
        </div>
      </div>

      <figure className="h-64 w-full relative pt-4">
        <svg role="img" aria-labelledby="trend-chart-title" aria-describedby="chart-accessible-desc" className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
          <line x1="0" y1="50" x2="600" y2="50" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="100" x2="600" y2="100" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="150" x2="600" y2="150" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="4 4" />
          {categories.map((cat, idx) => {
            const color = colors[idx % colors.length];
            const isDashed = idx % 2 === 1;
            return (
              <path
                key={cat}
                d={smoothBezierPath(cat)}
                fill="none"
                stroke={color}
                strokeWidth={isDashed ? "1.5" : "2.5"}
                strokeDasharray={isDashed ? "5 5" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
        <figcaption id="chart-accessible-desc" className="sr-only">Line chart plotting dynamic indicators.</figcaption>
        <div className="flex justify-between text-[10px] text-gray-500 font-bold font-mono mt-3 px-1">
          {chartData.map((d, i) => <span key={i}>{d.label}</span>)}
        </div>
      </figure>
    </div>
  );
};

export default TrendChart;
