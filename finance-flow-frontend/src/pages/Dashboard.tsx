import { useEffect, useState } from 'react';
import { SankeyDiagram } from '@/components/common/SankeyDiagram';
import { getSankeyData } from '@/services/api';
import type { SankeyData } from '@/types/sankey';

export const Dashboard = () => {
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSankeyData();
        setSankeyData(data);
      } catch (err) {
        setError('Failed to load financial data');
        console.error('Error fetching Sankey data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 text-center">
        Finance Flow Dashboard
      </h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 border border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">
          Money Flow Visualization
        </h2>
        
        {loading && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="text-gray-300 text-sm sm:text-base">Loading financial data...</div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="text-red-400 text-sm sm:text-base text-center">{error}</div>
          </div>
        )}
        
        {sankeyData && (
          <div className="w-full">
            <SankeyDiagram 
              data={sankeyData}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
