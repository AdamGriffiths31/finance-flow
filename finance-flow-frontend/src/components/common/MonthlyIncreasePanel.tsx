import React from 'react';
import type { LineChartSeries } from '@/types/finances';

interface MonthlyIncreasePanelProps {
  data: LineChartSeries[];
  className?: string;
}

export const MonthlyIncreasePanel: React.FC<MonthlyIncreasePanelProps> = ({
  data,
  className = '',
}) => {
  if (!data.length || data[0].data.length < 2) {
    return (
      <div className={`text-center text-gray-400 ${className}`}>
        <p>Not enough data</p>
      </div>
    );
  }

  // Calculate monthly changes
  const monthlyChanges = [];
  
  for (let i = 1; i < data[0].data.length; i++) {
    const currentMonth = data[0].data[i].date;
    let totalIncrease = 0;
    
    data.forEach(series => {
      const currentValue = series.data[i]?.value || 0;
      const previousValue = series.data[i - 1]?.value || 0;
      totalIncrease += (currentValue - previousValue);
    });

    monthlyChanges.push({
      month: currentMonth.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      fullMonth: currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      increase: totalIncrease,
    });
  }

  // Get last 3 months
  const recentChanges = monthlyChanges.slice(-3);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value >= 0 ? '+' : '-'}£${(absValue / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}£${absValue.toFixed(0)}`;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {recentChanges.map((change, index) => (
          <div key={index} className="text-center">
            <div className="text-sm text-gray-400 mb-1">
              {change.fullMonth}
            </div>
            <div className={`text-2xl font-bold ${
              change.increase >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(change.increase)}
            </div>
            <div className="text-xs text-gray-500">
              {change.increase >= 0 ? 'increase' : 'decrease'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};