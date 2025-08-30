import { Router, Request, Response } from 'express';

const router = Router();

// Simple finance data - in a real app this would come from database
const sampleFinanceData = {
  nodes: [
    // Income
    { id: 'income', name: 'Monthly Income', category: 'income' },
    
    // Main categories
    { id: 'expenses', name: 'Expenses', category: 'expense' },
    { id: 'savings', name: 'Savings', category: 'savings' },
    
    // Specific expenses
    { id: 'rent', name: 'Rent', category: 'expense' },
    { id: 'food', name: 'Food', category: 'expense' },
    { id: 'other', name: 'Other', category: 'expense' },
  ],
  links: [
    // Main splits
    { source: 'income', target: 'expenses', value: 2500 },
    { source: 'income', target: 'savings', value: 1000 },
    
    // Expense breakdown
    { source: 'expenses', target: 'rent', value: 1200 },
    { source: 'expenses', target: 'food', value: 800 },
    { source: 'expenses', target: 'other', value: 500 },
  ],
};

router.get('/data', (_req: Request, res: Response) => {
  res.json(sampleFinanceData);
});

export default router;