import axios from 'axios';
import type { SankeyData } from '@/types/sankey';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Sankey data
export const getSankeyData = async (): Promise<SankeyData> => {
  const response = await api.get('/sankey/data');
  return response.data;
};

export const updateSankeyData = async (data: SankeyData): Promise<SankeyData> => {
  const response = await api.put('/sankey/data', data);
  return response.data;
};

export const resetSankeyData = async (): Promise<{ data: SankeyData }> => {
  const response = await api.post('/sankey/reset');
  return response.data;
};