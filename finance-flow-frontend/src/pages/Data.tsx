import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { getFinancesData, saveFinancesData } from '@/services/api';
import type { FinancesData, FinanceCategoryInfo, FinanceHistoryPoint } from '@/types/finances';

export const Data = () => {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFinancesData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveData = async () => {
    if (!data) return;

    try {
      setSaving(true);
      // Sort history by date before saving
      const sortedData = {
        ...data,
        history: [...data.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
      const result = await saveFinancesData(sortedData);
      setData(result);
      toast.success('Data saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = useCallback(() => {
    const newCategory: FinanceCategoryInfo = {
      name: 'New Category',
      color: '#6B7280',
    };

    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        categories: [...prevData.categories, newCategory],
        history: prevData.history.map(record => ({
          ...record,
          data: {
            ...record.data,
            [newCategory.name]: 0,
          },
        })),
      };
    });
  }, []);

  const updateCategory = useCallback((index: number, updatedCategory: FinanceCategoryInfo) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      const oldName = prevData.categories[index].name;
      const newCategories = [...prevData.categories];
      newCategories[index] = updatedCategory;

      // Only update history if name actually changed (performance optimization)
      if (oldName === updatedCategory.name) {
        return { ...prevData, categories: newCategories };
      }

      // Efficiently update history records with name change
      const newHistory = prevData.history.map(record => {
        if (!(oldName in record.data)) return record;
        
        const newData = { ...record.data };
        newData[updatedCategory.name] = newData[oldName];
        delete newData[oldName];
        return { ...record, data: newData };
      });

      return {
        ...prevData,
        categories: newCategories,
        history: newHistory,
      };
    });
  }, []);

  const removeCategory = useCallback((index: number) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      const categoryName = prevData.categories[index].name;
      const newCategories = prevData.categories.filter((_, i) => i !== index);
      
      // Remove from history records efficiently
      const newHistory = prevData.history.map(record => {
        const newData = { ...record.data };
        delete newData[categoryName];
        return { ...record, data: newData };
      });

      return {
        ...prevData,
        categories: newCategories,
        history: newHistory,
      };
    });
  }, []);

  const addHistoryRecord = useCallback(() => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      const newRecord: FinanceHistoryPoint = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        data: prevData.categories.reduce((acc, category) => {
          acc[category.name] = 0;
          return acc;
        }, {} as Record<string, number>),
      };

      return {
        ...prevData,
        history: [...prevData.history, newRecord],
      };
    });
  }, []);

  const updateHistoryRecord = useCallback((index: number, updatedRecord: FinanceHistoryPoint) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      const newHistory = [...prevData.history];
      newHistory[index] = updatedRecord;

      return {
        ...prevData,
        history: newHistory,
      };
    });
  }, []);

  const removeHistoryRecord = useCallback((index: number) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        history: prevData.history.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Memoize formatted last updated date to avoid unnecessary recalculations
  const formattedLastUpdated = useMemo(() => {
    if (!data?.lastUpdated) return '';
    return new Date(data.lastUpdated).toLocaleString();
  }, [data?.lastUpdated]);

  // Memoize category validation to avoid recreating objects
  const categoryInputs = useMemo(() => {
    if (!data) return [];
    return data.categories.map((category, index) => ({ category, index }));
  }, [data]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Data Management
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
          Data Management
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="text-center text-red-400">
            <p className="text-xl mb-4">⚠️ Error Loading Data</p>
            <p>{error || 'Failed to load data'}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-slate-600 text-slate-100 rounded-lg hover:bg-slate-500 transition-colors border border-slate-500"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Data Management
        </h1>
        <div className="flex gap-4">
          <button
            onClick={saveData}
            disabled={saving}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600/20 text-green-200 rounded-lg hover:bg-green-600/30 transition-colors border border-green-500/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Categories Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Categories</h2>
            <button
              onClick={addCategory}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600/20 text-blue-200 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30 text-sm sm:text-base"
            >
              Add Category
            </button>
          </div>
          
          <div className="space-y-3">
            {categoryInputs.map(({ category, index }) => (
              <div key={category.name || `new-category-${index}`} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-gray-700 rounded">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => updateCategory(index, { ...category, color: e.target.value })}
                    className="w-8 h-8 rounded border-0 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(index, { ...category, name: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 bg-gray-600 text-white rounded border-0 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <button
                  onClick={() => removeCategory(index)}
                  className="px-3 py-2 bg-red-600/20 text-red-200 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Data Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Historical Data</h2>
            <button
              onClick={addHistoryRecord}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600/20 text-blue-200 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-500/30 text-sm sm:text-base"
            >
              Add Record
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.history.map((record, recordIndex) => (
              <div key={recordIndex} className="p-4 bg-gray-700 rounded">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                  <input
                    type="date"
                    value={record.date}
                    onChange={(e) => updateHistoryRecord(recordIndex, { ...record, date: e.target.value })}
                    className="px-3 py-2 bg-gray-600 text-white rounded border-0 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                  <button
                    onClick={() => removeHistoryRecord(recordIndex)}
                    className="px-3 py-2 bg-red-600/20 text-red-200 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30 text-sm sm:text-base whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {data.categories.map((category) => (
                    <div key={category.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-300 w-32 truncate">{category.name}</span>
                      <input
                        type="number"
                        value={record.data[category.name] || 0}
                        onChange={(e) => {
                          const newData = { ...record.data };
                          newData[category.name] = parseInt(e.target.value) || 0;
                          updateHistoryRecord(recordIndex, { ...record, data: newData });
                        }}
                        className="flex-1 px-2 py-1 bg-gray-600 text-white rounded border-0 focus:ring-1 focus:ring-blue-500 text-sm min-w-0"
                        min="0"
                        step="100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        Last updated: {formattedLastUpdated}
      </div>
    </div>
  );
};