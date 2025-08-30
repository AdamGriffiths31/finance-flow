import type { SankeyData } from '@/types/sankey';

export const sampleFinanceData: SankeyData = {
  nodes: [
    // Income sources
    { id: 'salary', name: 'Salary', category: 'income' },
    { id: 'freelance', name: 'Freelance', category: 'income' },
    { id: 'investments', name: 'Investments', category: 'income' },
    
    // Expense categories
    { id: 'housing', name: 'Housing', category: 'expense' },
    { id: 'food', name: 'Food', category: 'expense' },
    { id: 'transportation', name: 'Transport', category: 'expense' },
    { id: 'utilities', name: 'Utilities', category: 'expense' },
    { id: 'entertainment', name: 'Entertainment', category: 'expense' },
    { id: 'savings', name: 'Savings', category: 'savings' },
    { id: 'emergency', name: 'Emergency Fund', category: 'savings' },
  ],
  links: [
    // Income flows
    { source: 'salary', target: 'housing', value: 1200 },
    { source: 'salary', target: 'food', value: 600 },
    { source: 'salary', target: 'transportation', value: 300 },
    { source: 'salary', target: 'utilities', value: 200 },
    { source: 'salary', target: 'savings', value: 800 },
    
    { source: 'freelance', target: 'entertainment', value: 400 },
    { source: 'freelance', target: 'food', value: 200 },
    { source: 'freelance', target: 'emergency', value: 400 },
    
    { source: 'investments', target: 'savings', value: 300 },
    { source: 'investments', target: 'housing', value: 200 },
  ],
};