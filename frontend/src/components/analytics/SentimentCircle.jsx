import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SentimentCircle = ({ sentimentData }) => {
  // Safe default fallback structure for completely empty state to avoid hardcoded dummy arrays
  const defaultData = {
    dominant: { tier: "NEUTRAL", percentage: 0.0, color: "#94a3b8" },
    distribution: [
      { name: "Positive", value: 0.0, color: "#818cf8" },
      { name: "Neutral", value: 100.0, color: "#374151" }, // grey circle representing empty / no data
      { name: "Negative", value: 0.0, color: "#fb7185" }
    ]
  };

  const data = sentimentData || defaultData;
  const distribution = data.distribution || defaultData.distribution;
  const dominant = data.dominant || defaultData.dominant;

  const tierColor = dominant.color || "#94a3b8";
  const tierLabel = dominant.tier || "NEUTRAL";
  const percentage = dominant.percentage !== undefined ? dominant.percentage : 0.0;

  // Render a grey placeholder slice if total value is 0 or no active documents
  const hasData = distribution.some(item => item.value > 0);
  const chartData = hasData
    ? distribution.filter(item => item.value > 0)
    : [{ name: "Neutral", value: 100, color: "#374151" }];

  return (
    <div className="lg:col-span-4 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between min-h-[360px]">
      <h3 id="sentiment-circle-title" className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono mb-4">
        📊 Sentiment Distribution
      </h3>
      
      <figure className="relative flex items-center justify-center my-auto w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart role="img" aria-labelledby="sentiment-circle-title">
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={75}
              paddingAngle={hasData ? 2 : 0}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Absolute Centered Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tight">
            {percentage}%
          </span>
          <span
            className="text-[9px] uppercase font-bold tracking-widest mt-0.5 font-mono"
            style={{ color: tierColor }}
          >
            {tierLabel}
          </span>
        </div>
      </figure>

      {/* Dynamic bottom rows mapping the calculated percentages */}
      <div className="space-y-2 pt-4 text-xs font-medium border-t border-gray-850/40 mt-4">
        {distribution.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="text-white font-mono">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentCircle;
