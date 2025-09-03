import axios from 'axios';
import type { SankeyData } from '@/types/sankey';
import type { FinancesBreakdownData, FinancesHistoryData, FinancesData } from '@/types/finances';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhance error messages for better user experience
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.code === 'ECONNREFUSED') {
      error.message = 'Unable to connect to server. Please check if the backend is running.';
    } else if (error.code === 'NETWORK_ERROR') {
      error.message = 'Network error. Please check your internet connection.';
    }
    return Promise.reject(error);
  }
);

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

// Finances data
export const getFinancesBreakdown = async (): Promise<FinancesBreakdownData> => {
  const response = await api.get('/finances/breakdown');
  return response.data;
};

export const getFinancesHistory = async (): Promise<FinancesHistoryData> => {
  const response = await api.get('/finances/history');
  return response.data;
};

export const getFinancesData = async (): Promise<FinancesData> => {
  const response = await api.get('/finances/data');
  return response.data;
};

export const saveFinancesData = async (data: FinancesData): Promise<FinancesData> => {
  const response = await api.put('/finances/data', data);
  // Handle different response structures safely
  return response.data?.data || response.data;
};