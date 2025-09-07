import React from 'react';
import type { DateFilter } from '@/services/api';

interface DateFilterProps {
  selectedFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  className?: string;
}

const filterOptions = [
  { label: 'Past Year', value: { period: '1year' as const } },
  { label: 'All Time', value: { period: 'all' as const } },
];

export const DateFilterComponent: React.FC<DateFilterProps> = ({
  selectedFilter,
  onFilterChange,
  className = '',
}) => {

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex bg-gray-700 rounded-lg p-1">
        {filterOptions.map((option) => (
          <button
            key={option.value.period}
            onClick={() => onFilterChange(option.value)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              selectedFilter.period === option.value.period
                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};