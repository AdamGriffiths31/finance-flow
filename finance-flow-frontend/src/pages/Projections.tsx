import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ProjectionChart } from '@/components/common/ProjectionChart';
import { ProjectionControls } from '@/components/common/ProjectionControls';
import { useResponsiveChartSize } from '@/hooks/useResponsiveChartSize';
import { getProjectionsData } from '@/services/api';
import type { ProjectionData, ProjectionConfig, GrowthRate } from '@/types/finances';

export const Projections = () => {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ProjectionConfig>({
    calculationPeriodMonths: 12,
    projectionPeriodMonths: 12,
  });

  // Responsive chart dimensions
  const chartSize = useResponsiveChartSize({ maxWidth: 1000, aspectRatio: 2.5 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProjectionsData(config);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projections data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatPercent = useCallback((value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data) return null;

    const currentTotals = data.series.reduce((acc, series) => {
      const lastHistoricalPoint = [...series.data].reverse().find(point => !point.isProjected);
      return acc + (lastHistoricalPoint?.value || 0);
    }, 0);

    const projectedTotals = data.series.reduce((acc, series) => {
      const lastProjectedPoint = [...series.data].reverse().find(point => point.isProjected);
      return acc + (lastProjectedPoint?.value || 0);
    }, 0);

    const totalGrowth = projectedTotals - currentTotals;
    const totalGrowthPercent = currentTotals > 0 ? (totalGrowth / currentTotals) : 0;

    return {
      currentTotal: currentTotals,
      projectedTotal: projectedTotals,
      totalGrowth,
      totalGrowthPercent,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Financial Projections
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Financial Projections
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="text-center text-red-400">
            <p className="text-xl mb-4">⚠️ Error Loading Projections</p>
            <p>{error || 'Failed to load projections data'}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Financial Projections</h1>
        <p className="text-gray-300">
          Based on historical data from the last {config.calculationPeriodMonths} months, 
          projecting {config.projectionPeriodMonths} months into the future using linear growth.
        </p>
      </div>
      
      {/* Controls */}
      <ProjectionControls
        config={config}
        onChange={setConfig}
        className="mb-6 sm:mb-8"
      />

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Current Total</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summaryStats.currentTotal)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Projected Total</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summaryStats.projectedTotal)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Expected Growth</h3>
            <p className={`text-2xl font-bold ${summaryStats.totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summaryStats.totalGrowth >= 0 ? '+' : ''}{formatCurrency(summaryStats.totalGrowth)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Growth Percentage</h3>
            <p className={`text-2xl font-bold ${summaryStats.totalGrowthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summaryStats.totalGrowthPercent >= 0 ? '+' : ''}{formatPercent(summaryStats.totalGrowthPercent)}
            </p>
          </div>
        </div>
      )}

      {/* Main Chart - Hidden on small screens */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-700 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">
          Historical Data & Future Projections
        </h2>
        <div className="flex justify-center overflow-x-auto">
          <ProjectionChart
            data={data.series}
            width={chartSize.width}
            height={chartSize.height}
            className="flex-shrink-0 max-w-full"
          />
        </div>
      </div>

      {/* Growth Rates Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Category Growth Rates
          </h2>
          <div className="text-xs text-gray-400 text-right">
            <p>Based on {config.calculationPeriodMonths} months of data</p>
            <p>Median growth with outlier smoothing</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-300 font-medium">Category</th>
                <th className="pb-3 text-gray-300 font-medium text-right">Current Balance</th>
                <th className="pb-3 text-gray-300 font-medium text-right">Monthly Rate</th>
                <th className="pb-3 text-gray-300 font-medium text-right">Annual Rate</th>
                <th className="pb-3 text-gray-300 font-medium text-right">Projected Change</th>
                <th className="pb-3 text-gray-300 font-medium text-right">
                  Projected Balance
                  <div className="text-xs text-gray-500 font-normal mt-1">
                    in {config.projectionPeriodMonths} months
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.growthRates.map((rate: GrowthRate, index: number) => {
                const series = data.series.find(s => s.name === rate.category);
                const currentValue = [...(series?.data || [])].reverse().find(point => !point.isProjected)?.value || 0;
                const projectedValue = [...(series?.data || [])].reverse().find(point => point.isProjected)?.value || 0;
                const absoluteGrowth = projectedValue - currentValue;

                return (
                  <tr key={rate.category} className={index > 0 ? 'border-t border-gray-700' : ''}>
                    <td className="py-3 text-white font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: series?.color }}
                        />
                        {rate.category}
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {formatCurrency(currentValue)}
                    </td>
                    <td className={`py-3 text-right font-medium ${rate.monthlyRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rate.monthlyRate >= 0 ? '+' : ''}{formatPercent(rate.monthlyRate)}
                    </td>
                    <td className={`py-3 text-right font-medium ${rate.annualRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rate.annualRate >= 0 ? '+' : ''}{formatPercent(rate.annualRate)}
                    </td>
                    <td className={`py-3 text-right font-medium ${absoluteGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {absoluteGrowth >= 0 ? '+' : ''}{formatCurrency(absoluteGrowth)}
                    </td>
                    <td className="py-3 text-right text-white font-semibold">
                      {formatCurrency(projectedValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};