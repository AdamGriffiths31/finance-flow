import React from 'react';
import type { ProjectionConfig } from '@/types/finances';

interface ProjectionControlsProps {
  config: ProjectionConfig;
  onChange: (config: ProjectionConfig) => void;
  className?: string;
}

export const ProjectionControls: React.FC<ProjectionControlsProps> = ({
  config,
  onChange,
  className = '',
}) => {
  const handleConfigChange = (updates: Partial<ProjectionConfig>) => {
    onChange({ ...config, ...updates });
  };

  const calculationPeriodOptions = [
    { value: 3, label: '3 months' },
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 18, label: '18 months' },
    { value: 24, label: '2 years' },
  ];

  const projectionPeriodOptions = [
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 18, label: '18 months' },
    { value: 24, label: '2 years' },
    { value: 36, label: '3 years' },
    { value: 60, label: '5 years' },
  ];


  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Projection Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calculation Period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Historical Period
          </label>
          <select
            value={config.calculationPeriodMonths}
            onChange={(e) => handleConfigChange({ 
              calculationPeriodMonths: parseInt(e.target.value) 
            })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {calculationPeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Time period used to calculate growth rates
          </p>
        </div>

        {/* Projection Period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Projection Period
          </label>
          <select
            value={config.projectionPeriodMonths}
            onChange={(e) => handleConfigChange({ 
              projectionPeriodMonths: parseInt(e.target.value) 
            })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {projectionPeriodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            How far into the future to project
          </p>
        </div>

      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>
          Projections use <strong>linear growth</strong>, applying growth rates at a constant rate over time.
        </p>
      </div>
    </div>
  );
};