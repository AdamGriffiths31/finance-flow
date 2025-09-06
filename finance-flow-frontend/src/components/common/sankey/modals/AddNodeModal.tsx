import React, { useState } from 'react';
import type { SankeyData } from '@/types/sankey';

interface AddNodeModalProps {
  data?: SankeyData | null;
  onAdd: (name: string, category: 'income' | 'expense' | 'savings', value?: number, connectTo?: { nodeId: string; amount: number; direction: 'from' | 'to' }) => void;
  onClose: () => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ data, onAdd, onClose }) => {
  // Type guard for validating category
  const isValidCategory = (value: string): value is 'income' | 'expense' | 'savings' => {
    return value === 'income' || value === 'expense' || value === 'savings';
  };

  const [nodeName, setNodeName] = useState('');
  const [category, setCategory] = useState<'income' | 'expense' | 'savings'>('expense');
  const [createConnection, setCreateConnection] = useState(true);
  const [connectToNode, setConnectToNode] = useState('');
  const [connectionAmount, setConnectionAmount] = useState('');

  const getConnectionDirection = () => {
    if (category === 'income') return 'to';
    return 'from';
  };

  const connectionDirection = getConnectionDirection();

  const getAvailableConnections = () => {
    if (!data) return [];
    
    if (category === 'income') {
      return data.nodes.filter(n => n.category === 'expense' || n.category === 'savings');
    } else if (category === 'expense') {
      return data.nodes.filter(n => n.category === 'income' || (n.category === 'expense' && n.id !== 'expenses'));
    } else {
      return data.nodes.filter(n => n.category === 'income');
    }
  };

  const availableNodes = getAvailableConnections();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeName.trim()) {
      let connectionInfo = undefined;
      
      if (createConnection && connectToNode && connectionAmount) {
        const amount = parseFloat(connectionAmount);
        if (!isNaN(amount) && amount > 0) {
          connectionInfo = { 
            nodeId: connectToNode, 
            amount, 
            direction: connectionDirection as 'from' | 'to'
          };
        }
      }
      
      onAdd(nodeName.trim(), category, undefined, connectionInfo);
      setNodeName('');
      setConnectToNode('');
      setConnectionAmount('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Add New Node</h3>
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
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={createConnection}
                onChange={(e) => setCreateConnection(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-300">Create initial connection</span>
            </label>
          </div>
          
          {createConnection && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Connect {connectionDirection === 'to' ? 'to' : 'from'}
                </label>
                <select
                  value={connectToNode}
                  onChange={(e) => setConnectToNode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select node...</option>
                  {availableNodes.map(node => (
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
                  value={connectionAmount}
                  onChange={(e) => setConnectionAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500"
                  min="0"
                  step="0.01"
                />
              </div>
            </>
          )}
          
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
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};