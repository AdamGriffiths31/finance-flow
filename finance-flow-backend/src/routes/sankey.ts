import { Router, Request, Response } from 'express';

const router = Router();

// Original finance data template
const originalFinanceData = {
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

// Current working data (starts as copy of original)
let sampleFinanceData = JSON.parse(JSON.stringify(originalFinanceData));

router.get('/data', (_req: Request, res: Response) => {
  res.json(sampleFinanceData);
});

router.put('/data', (req: Request, res: Response) => {
  try {
    const updatedData = req.body;
    
    // Basic validation
    if (!updatedData.nodes || !updatedData.links) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }
    
    // In a real app, you would save this to a database
    sampleFinanceData.nodes = updatedData.nodes;
    sampleFinanceData.links = updatedData.links;
    
    return res.json({ success: true, data: sampleFinanceData });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update data' });
  }
});

router.post('/reset', (_req: Request, res: Response) => {
  try {
    // Reset to original data
    sampleFinanceData = JSON.parse(JSON.stringify(originalFinanceData));
    return res.json({ success: true, data: sampleFinanceData });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset data' });
  }
});

export default router;
