import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import * as lockfile from 'proper-lockfile';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Secure path configuration
const getDataFilePath = (): string => {
  const dataDir = path.resolve(config.dataDir);
  const filePath = path.join(dataDir, 'finances-data.json');
  
  // Security check: ensure the file path is within the data directory
  const normalizedPath = path.resolve(filePath);
  if (!normalizedPath.startsWith(dataDir)) {
    throw new Error('Invalid file path: attempting to access files outside data directory');
  }
  
  return normalizedPath;
};

const DATA_FILE_PATH = getDataFilePath();

// Zod schemas for validation
const CategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
});

const HistoryRecordSchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime()) && 
               date.toISOString().startsWith(dateString);
      },
      'Invalid date value'
    ),
  data: z.record(z.string().min(1), z.number().min(0)),
});

const DateFilterSchema = z.object({
  from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format')
    .optional(),
  to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format')
    .optional(),
  period: z.enum(['3months', '1year', 'all']).optional(),
});

const FinancesDataSchema = z.object({
  categories: z.array(CategorySchema).min(1),
  history: z.array(HistoryRecordSchema).min(1),
  lastUpdated: z.string().optional(),
});

type FinancesData = z.infer<typeof FinancesDataSchema>;
type FinanceHistoryPoint = z.infer<typeof HistoryRecordSchema>;

// Ensure data directory exists
const ensureDataDirectory = async (): Promise<void> => {
  const dataDir = path.resolve(config.dataDir);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      logger.error('Failed to create data directory:', error);
      throw new Error('Failed to create data directory');
    }
  }
};

// Helper function to read data from JSON file with proper validation
const readFinancesData = async (): Promise<FinancesData> => {
  await ensureDataDirectory();
  
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return FinancesDataSchema.parse(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in data file');
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Data validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    // File doesn't exist or other read error
    throw new Error('Failed to read finances data');
  }
};

// Helper function to write data to JSON file with atomic file operations
const writeFinancesData = async (data: FinancesData): Promise<void> => {
  await ensureDataDirectory();
  
  const lockOptions = {
    stale: 30000, // 30 seconds for longer operations
    retries: {
      retries: 3,
      minTimeout: 200,
      maxTimeout: 2000,
      factor: 2,
    },
  };

  try {
    // Validate data before any file operations
    const validatedData = FinancesDataSchema.parse(data);
    validatedData.lastUpdated = new Date().toISOString();
    
    // Perform atomic write operation with proper locking
    const release = await lockfile.lock(DATA_FILE_PATH, lockOptions);
    try {
      // Write to temporary file first, then rename (atomic operation)
      const tempFilePath = `${DATA_FILE_PATH}.tmp`;
      const jsonString = JSON.stringify(validatedData, null, 2);
      
      await fs.writeFile(tempFilePath, jsonString, 'utf8');
      await fs.rename(tempFilePath, DATA_FILE_PATH);
      
    } catch (writeError) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(`${DATA_FILE_PATH}.tmp`);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temporary file:', cleanupError);
      }
      throw writeError;
    } finally {
      // Always release the lock
      await release();
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Data validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    if (error instanceof Error && error.message.includes('EBUSY')) {
      throw new Error('File is currently being used by another process. Please try again.');
    }
    throw new Error(`Failed to write finances data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to filter history data based on date parameters
const filterHistoryData = (history: FinanceHistoryPoint[], filters: { from?: string; to?: string; period?: '3months' | '1year' | 'all' }) => {
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

router.get('/breakdown', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await readFinancesData();
    
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
    const breakdown = data.categories.map((category) => ({
      category: category.name,
      value: latestRecord.data[category.name] || 0,
      color: category.color,
    }));
    
    const total = breakdown.reduce((sum: number, item) => sum + item.value, 0);
    
    res.json({
      breakdown,
      total,
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    logger.error('Error fetching breakdown data:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid filter parameters', 
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to fetch breakdown data' });
  }
});

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await readFinancesData();
    
    // Validate query parameters
    const filterParams = DateFilterSchema.parse(req.query);
    
    // Filter history data
    const filteredHistory = filterHistoryData(data.history, filterParams);
    
    res.json({
      history: filteredHistory,
      categories: data.categories,
    });
  } catch (error) {
    logger.error('Error fetching history data:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid filter parameters', 
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to fetch history data' });
  }
});

router.get('/data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await readFinancesData();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.put('/data', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the entire request body using Zod schema
    const validatedData = FinancesDataSchema.parse(req.body);
    
    await writeFinancesData(validatedData);
    res.json({ success: true, data: validatedData });
  } catch (error) {
    logger.error('Error saving data:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid data format', 
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to save data' });
  }
});

export default router;