import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AnimatedValue = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Strip out commas to test if it's a pure numeric value
    const cleanStr = String(value).replace(/,/g, '');
    const num = parseFloat(cleanStr);
    
    if (!isNaN(num) && isFinite(num) && /^\d+(\.\d+)?$/.test(cleanStr)) {
      let start = 0;
      const end = num;
      if (start === end) {
        setDisplayValue(value);
        return;
      }
      
      const duration = 1000; // 1s animation duration
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function: easeOutQuad
        const easeProgress = progress * (2 - progress);
        const currentVal = start + (end - start) * easeProgress;
        
        if (cleanStr.includes('.')) {
          const decimals = cleanStr.split('.')[1].length;
          setDisplayValue(Number(currentVal.toFixed(decimals)).toLocaleString());
        } else {
          setDisplayValue(Math.floor(currentVal).toLocaleString());
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span className="text-2xl font-bold tracking-tight text-white transition-all duration-300">
      {displayValue}
    </span>
  );
};

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
              <AnimatedValue value={item.value} />
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
