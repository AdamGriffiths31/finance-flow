import React, { useState } from 'react';
import type { SankeyData } from '@/types/sankey';

interface EditLinkModalProps {
  sourceId: string;
  targetId: string;
  currentValue: number;
  data?: SankeyData | null;
  onEdit: (sourceId: string, targetId: string, newValue: number) => void;
  onClose: () => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ 
  sourceId, 
  targetId, 
  currentValue, 
  data, 
  onEdit, 
  onClose 
}) => {
  const [value, setValue] = useState(currentValue.toString());

  const sourceNode = data?.nodes.find(n => n.id === sourceId);
  const targetNode = data?.nodes.find(n => n.id === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onEdit(sourceId, targetId, numValue);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Edit Flow Amount
        </h3>
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <p className="text-sm text-gray-300">
            <span className="font-medium">{sourceNode?.name}</span> → <span className="font-medium">{targetNode?.name}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Flow Amount ($)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 500"
              min="0"
              step="0.01"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!value || isNaN(Number(value)) || Number(value) <= 0}
            >
              Update Amount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};