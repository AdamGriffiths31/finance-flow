import React, { useState } from 'react';
import type { SankeyData } from '@/types/sankey';

interface AddLinkModalProps {
  sourceNodeId: string;
  data?: SankeyData | null;
  onAdd: (sourceId: string, targetId: string, value: number) => void;
  onClose: () => void;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({ sourceNodeId, data, onAdd, onClose }) => {
  const [targetNodeId, setTargetNodeId] = useState('');
  const [value, setValue] = useState('');

  const sourceNode = data?.nodes.find(n => n.id === sourceNodeId);
  const availableTargets = data?.nodes.filter(n => 
    n.id !== sourceNodeId && 
    !data.links.some(link => link.source === sourceNodeId && link.target === n.id)
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (targetNodeId && !isNaN(numValue) && numValue > 0) {
      onAdd(sourceNodeId, targetNodeId, numValue);
      setValue('');
      setTargetNodeId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Create Link from "{sourceNode?.name}"
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Node
            </label>
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select target node...</option>
              {availableTargets.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.category})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Flow Amount (£)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 500"
              min="0"
              step="0.01"
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
              disabled={!targetNodeId || !value}
            >
              Create Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};