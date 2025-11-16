import React from 'react';
import { motion } from 'framer-motion';

const BarChart = ({ data, title, color = 'blue', height = 280, isLoading = false, minYMax, useMultipleOf50 = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 100 + 20}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create complete 12-month data array
  const createCompleteMonthData = (inputData) => {
    const completeData = [];
    for (let month = 1; month <= 12; month++) {
      const existingData = inputData.find(item => parseInt(item.month) === month);
      completeData.push({
        month: month,
        month_name: monthNames[month - 1],
        count: existingData ? existingData.count : 0
      });
    }
    return completeData;
  };

  // Helper to format tick values - always show whole numbers
  const formatTick = (value) => {
    return Math.round(value);
  };

  // Normalize numeric values and compute a nice max for axis
  const processedData = createCompleteMonthData(data || []).map(item => ({
    ...item,
    count: Number(item.count) || 0,
  }));
  const rawMax = Math.max(...processedData.map(item => item.count || 0), 0);
  
  let maxValue, ticks;
  
  if (useMultipleOf50) {
    // Round up to nearest 50 for cleaner Y-axis
    const padded = rawMax * 1.25; // 25% headroom
    const niceMax = rawMax === 0 ? 50 : Math.ceil(padded / 50) * 50;
    maxValue = Math.max(50, niceMax, Number.isFinite(minYMax) ? minYMax : 0);
    
    // Create ticks with 50 intervals
    const tickStep = 50;
    const numTicks = Math.floor(maxValue / tickStep) + 1;
    ticks = Array.from({ length: numTicks }, (_, i) => maxValue - (i * tickStep)).filter(t => t >= 0);
  } else {
    // Original logic: Add headroom and round up to a clean multiple
    const base = rawMax <= 20 ? 5 : 10;
    const padded = rawMax * 1.25; // 25% headroom
    const niceMax = rawMax === 0 ? base : Math.ceil(padded / base) * base;
    maxValue = Math.max(base, niceMax, Number.isFinite(minYMax) ? minYMax : 0) || 1;
    
    // Calculate tick step and round to whole number
    const tickStep = Math.ceil(maxValue / 4);
    ticks = [
      maxValue,
      Math.max(0, maxValue - tickStep),
      Math.max(0, maxValue - 2 * tickStep),
      Math.max(0, maxValue - 3 * tickStep),
      0
    ];
  }
  
  const colorClasses = {
    blue: 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500',
    green: 'bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500',
    yellow: 'bg-gradient-to-t from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500',
    purple: 'bg-gradient-to-t from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500',
    red: 'bg-gradient-to-t from-red-500 to-red-400 hover:from-red-600 hover:to-red-500'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-500">
          Total: {processedData.reduce((sum, item) => sum + (item.count || 0), 0)}
        </div>
      </div>
      
      <div className="relative bg-gray-50 rounded-lg p-3 pl-5 sm:p-4 sm:pl-8 overflow-visible" style={{ height: `${height}px` }}>
        {/* Grid lines */}
        <div className="absolute inset-4 flex flex-col justify-between pointer-events-none z-0">
          {ticks.map((_, i) => (
            <div key={i} className="border-t border-gray-200 border-dashed opacity-30"></div>
          ))}
        </div>
        
        {/* Bars wrapper shares the exact plot area with grid lines */}
        <div className="absolute inset-4 flex items-end gap-0.5 sm:gap-1 px-1.5 sm:px-2 z-10 overflow-visible">
          {processedData.map((item, index) => {
            const count = item.count || 0;
            const barHeightPercent = maxValue > 0 ? Math.max(0, Math.min(100, (count / maxValue) * 100)) : 0;
            
            return (
              <div key={index} className="flex-1 h-full flex flex-col items-center justify-end relative group min-w-0">
                <div
                  className={`w-full ${count > 0 ? colorClasses[color] : 'bg-gray-200'} rounded-t transition-all duration-200 relative cursor-pointer`}
                  style={{ 
                    height: `${barHeightPercent}%`,
                    maxWidth: '24px'
                  }}
                >
                  {/* Value label on top of bar - only show if count > 0 */}
                  {count > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 + 0.4 }}
                      className="hidden sm:block absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] text-xs font-bold text-gray-800 bg-white px-1.5 py-0.5 rounded shadow-sm border z-10 min-w-max"
                    >
                      {count}
                    </motion.div>
                  )}
                  {/* Hover tooltip */}
                  <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                    <div className="font-medium">{item.month_name}</div>
                    <div className="text-gray-300">{count} {title.includes('Peserta') ? 'peserta' : 'events'}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.02 + 0.8 }}
                  className="mt-2 text-[10px] sm:text-xs text-gray-600 font-medium text-center leading-tight rotate-45 sm:rotate-0 origin-top-left sm:origin-center"
                >
                  {item.month_name}
                </motion.div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels aligned to grid lines at 0%, 25%, 50%, 75%, 100% (top equals maxValue) */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] sm:text-xs text-gray-500 -ml-4 sm:-ml-8 py-3 sm:py-4">
          {ticks.map((t, i) => (
            <span key={i} className="bg-white px-0.5 sm:px-1 rounded">{formatTick(t)}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarChart;
