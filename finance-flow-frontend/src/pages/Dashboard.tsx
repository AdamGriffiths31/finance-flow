import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PieChart } from '@/components/common/PieChart';
import { LineChart } from '@/components/common/LineChart';
import { StackedAreaChart } from '@/components/common/StackedAreaChart';
import { MonthlyIncreasePanel } from '@/components/common/MonthlyIncreasePanel';
import { getFinancesBreakdown, getFinancesHistory } from '@/services/api';
import type { FinancesBreakdownData, FinancesHistoryData, LineChartSeries } from '@/types/finances';

export const Dashboard = () => {
  const [data, setData] = useState<FinancesBreakdownData | null>(null);
  const [historyData, setHistoryData] = useState<FinancesHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [breakdownResult, historyResult] = await Promise.all([
          getFinancesBreakdown(),
          getFinancesHistory()
        ]);
        setData(breakdownResult);
        setHistoryData(historyResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load finances data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoize currency formatter to avoid recreation on every render
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Memoize expensive data transformation for line chart
  const lineChartData = useMemo((): LineChartSeries[] => {
    if (!historyData) return [];
    
    return historyData.categories.map(category => ({
      name: category.name,
      color: category.color,
      data: historyData.history.map(point => ({
        date: new Date(point.date),
        value: point.data[category.name] || 0,
      })),
    }));
  }, [historyData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Dashboard Overview
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !historyData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Dashboard Overview
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="text-center text-red-400">
            <p className="text-xl mb-4">⚠️ Error Loading Data</p>
            <p>{error || 'Failed to load finances data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="grid grid-cols-3 gap-6">
        {/* Panel 1 - Finances Breakdown */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Finances Breakdown
          </h2>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-300">Total Assets</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(data.total)}
            </p>
          </div>
          <div className="flex justify-center">
            <PieChart
              data={data.breakdown}
              width={300}
              height={300}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Panel 2 & 3 Combined - Line Chart */}
        <div className="col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Finances Over Time
          </h2>
          <div className="flex justify-center">
            <LineChart
              data={lineChartData}
              width={700}
              height={350}
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Second Row - Growth Chart (2/3) + Panel (1/3) */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        {/* Panel 1 - Growth Chart (spans 2 columns) */}
        <div className="col-span-2 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Wealth Growth Over Time
          </h2>
          <div className="flex justify-center">
            <StackedAreaChart
              data={lineChartData}
              width={600}
              height={300}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Panel 2 - Monthly Increases */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Recent Growth
          </h2>
          <MonthlyIncreasePanel
            data={lineChartData}
            className="text-white"
          />
        </div>
      </div>
    </div>
  );
};