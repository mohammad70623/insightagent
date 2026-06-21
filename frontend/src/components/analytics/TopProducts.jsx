import React from 'react';

const TopProducts = ({ products }) => {
  return (
    <div className="md:col-span-5 rounded-xl border border-gray-800/40 bg-surface p-6 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-brand-muted font-mono">
          🚀 Top Performing Products
        </h4>
        <span className="text-[9px] text-gray-500 font-bold">Sorted by Conversion</span>
      </div>
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {products.map((prod, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white">{prod.name}</span>
              <span className="text-brand-primary font-mono">
                {prod.rate}{' '}
                <span className={`text-[10px] font-bold ${prod.isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {prod.delta}
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
              <div className={`bg-brand-primary ${prod.width} h-full rounded-full transition-all duration-500`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
