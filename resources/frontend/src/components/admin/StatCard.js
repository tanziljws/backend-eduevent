import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, isLoading = false, compact = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
            <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-gray-200 rounded-lg`}></div>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className={`${compact ? 'w-14 h-6' : 'w-16 h-8'} bg-gray-200 rounded mb-2`}></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl border border-gray-200 ${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-all duration-300`}
    >
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
        <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className={`${compact ? 'text-xl' : 'text-3xl'} font-bold text-gray-800`}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </motion.div>
      </div>
      
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
};

export default StatCard;
