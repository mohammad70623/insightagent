import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricsGrid = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="rounded-xl border border-gray-800/40 bg-surface p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-brand-muted">
              <span className="text-xs font-semibold tracking-wide">{item.title}</span>
              <Icon size={16} className="text-gray-500" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white">{item.value}</span>
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                item.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {item.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {item.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsGrid;
