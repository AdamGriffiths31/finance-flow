import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { handleError } from '../utils/errorHandler';
import { FinancesDataService, FinanceCategory, FinanceHistoryPoint, FinancesDataSchema } from '../services/financesDataService';

const router = Router();
const dataService = FinancesDataService.getInstance();


const DateFilterSchema = z.object({
  from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format')
    .optional(),
  to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format')
    .optional(),
  period: z.enum(['3months', '1year', 'all']).optional(),
});




// Helper function to filter history data based on date parameters
const filterHistoryData = (history: FinanceHistoryPoint[], filters: { from?: string; to?: string; period?: '3months' | '1year' | 'all' }): FinanceHistoryPoint[] => {
  if (!filters.from && !filters.to && !filters.period) {
    return history;
  }

  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (filters.period) {
    const now = new Date();
    toDate = now;
    
    switch (filters.period) {
      case '3months':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '1year':
        fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
        return history;
    }
  } else {
    if (filters.from) {
      fromDate = new Date(filters.from);
    }
    if (filters.to) {
      toDate = new Date(filters.to);
    }
  }

  return history.filter(record => {
    const recordDate = new Date(record.date);
    if (fromDate && recordDate < fromDate) return false;
    if (toDate && recordDate > toDate) return false;
    return true;
  });
};

router.get('/breakdown', async (req: Request & { id?: string }, res: Response): Promise<void> => {
  try {
    const data = await dataService.readFinancesData();
    
    // Validate query parameters
    const filterParams = DateFilterSchema.parse(req.query);
    
    // Filter history data
    const filteredHistory = filterHistoryData(data.history, filterParams);
    
    if (filteredHistory.length === 0) {
      res.status(404).json({ error: 'No financial data available for the selected period' });
      return;
    }
    
    const latestRecord = filteredHistory[filteredHistory.length - 1];
    
    // Create breakdown from latest record in filtered data
    const breakdown = data.categories.map((category: FinanceCategory) => ({
      category: category.name,
      value: latestRecord.data[category.name] || 0,
      color: category.color,
    }));
    
    const total = breakdown.reduce((sum: number, item: { category: string; value: number; color: string }) => sum + item.value, 0);
    
    res.json({
      breakdown,
      total,
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    handleError(error, res, 'fetchBreakdownData', req.id);
  }
});

router.get('/history', async (req: Request & { id?: string }, res: Response): Promise<void> => {
  try {
    const data = await dataService.readFinancesData();
    
    // Validate query parameters
    const filterParams = DateFilterSchema.parse(req.query);
    
    // Filter history data
    const filteredHistory = filterHistoryData(data.history, filterParams);
    
    res.json({
      history: filteredHistory,
      categories: data.categories,
    });
  } catch (error) {
    handleError(error, res, 'fetchHistoryData', req.id);
  }
});

router.get('/data', async (req: Request & { id?: string }, res: Response): Promise<void> => {
  try {
    const data = await dataService.readFinancesData();
    res.json(data);
  } catch (error) {
    handleError(error, res, 'fetchData', req.id);
  }
});

router.put('/data', async (req: Request & { id?: string }, res: Response): Promise<void> => {
  try {
    // Validate the entire request body using Zod schema
    const validatedData = FinancesDataSchema.parse(req.body);
    
    await dataService.writeFinancesData(validatedData);
    res.json({ success: true, data: validatedData });
  } catch (error) {
    handleError(error, res, 'saveData', req.id);
  }
});

export default router;