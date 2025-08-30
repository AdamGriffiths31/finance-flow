import React, { useState } from 'react';
import type { SankeyData } from '@/types/sankey';

interface EditNodeModalProps {
  nodeId: string;
  data?: SankeyData | null;
  onEdit: (nodeId: string, name: string, category: 'income' | 'expense' | 'savings') => void;
  onClose: () => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({ nodeId, data, onEdit, onClose }) => {
  const currentNode = data?.nodes.find(n => n.id === nodeId);
  
  // Type guard for validating category
  const isValidCategory = (value: string | undefined): value is 'income' | 'expense' | 'savings' => {
    return value === 'income' || value === 'expense' || value === 'savings';
  };
  
  const [nodeName, setNodeName] = useState(currentNode?.name || '');
  const [category, setCategory] = useState<'income' | 'expense' | 'savings'>(() => {
    const nodeCategory = currentNode?.category;
    return isValidCategory(nodeCategory) ? nodeCategory : 'expense';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeName.trim()) {
      onEdit(nodeId, nodeName.trim(), category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Edit Node</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Node Name
            </label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Freelance Income"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidCategory(value)) {
                  setCategory(value);
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
            </select>
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
            >
              Update Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};