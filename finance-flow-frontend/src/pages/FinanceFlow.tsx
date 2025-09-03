import { useState } from 'react';
import { SankeyDiagram } from '@/components/common/sankey';
import type { SankeyData } from '@/types/sankey';

export const FinanceFlow = () => {
  const [updateCount, setUpdateCount] = useState(0);

  const handleDataChange = (newData: SankeyData) => {
    setUpdateCount(prev => prev + 1);
    console.log('Financial data updated:', newData);
  };

  const handleDataReset = () => {
    setUpdateCount(0);
    console.log('Data reset to original');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 text-center">
        Sankey Dashboard
      </h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white text-center flex-1">
            Interactive Money Flow
          </h2>
          {updateCount > 0 && (
            <div className="text-xs sm:text-sm text-green-400 bg-green-900 px-2 py-1 rounded">
              {updateCount} edit{updateCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        
        <div className="w-full">
          <SankeyDiagram 
            loadFromAPI={true}
            editable={true}
            showReset={true}
            onDataChange={handleDataChange}
            onDataReset={handleDataReset}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
