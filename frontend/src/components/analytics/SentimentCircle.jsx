import React from 'react';

const SentimentCircle = ({ sentiment, liveMetrics }) => {
  return (
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
  );
};

export default SentimentCircle;
