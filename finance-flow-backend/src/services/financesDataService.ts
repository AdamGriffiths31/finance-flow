import { promises as fs, accessSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import * as lockfile from 'proper-lockfile';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errorHandler';

// Zod schemas for validation - aligned with frontend expectations and actual data format
const FinanceCategoryInfoSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
});

const FinanceHistoryPointSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
  data: z.record(z.string().min(1), z.number().min(0)),
});

const FinancesDataSchema = z.object({
  categories: z.array(FinanceCategoryInfoSchema),
  history: z.array(FinanceHistoryPointSchema),
  lastUpdated: z.string().optional(),
});

type FinancesData = z.infer<typeof FinancesDataSchema>;
type FinanceCategory = z.infer<typeof FinanceCategoryInfoSchema>;
type FinanceHistoryPoint = z.infer<typeof FinanceHistoryPointSchema>;

export { FinancesData, FinanceCategory, FinanceHistoryPoint, FinancesDataSchema };

export class FinancesDataService {
  private static instance: FinancesDataService;
  private dataFilePath: string;

  private constructor() {
    this.dataFilePath = this.getDataFilePath();
  }

  static getInstance(): FinancesDataService {
    if (!FinancesDataService.instance) {
      FinancesDataService.instance = new FinancesDataService();
    }
    return FinancesDataService.instance;
  }

  private getDataFilePath(): string {
    const dataDir = path.resolve(config.dataDir);
    const fileName = `finances-data-${config.dataEnvironment}.json`;
    const filePath = path.join(dataDir, fileName);
    
    // Security check: ensure the file path is within the data directory
    const normalizedPath = path.resolve(filePath);
    if (!normalizedPath.startsWith(dataDir)) {
      throw new ApiError('Invalid file path: security violation', 500, 'SECURITY_ERROR');
    }
    
    // Fallback to default file if environment-specific file doesn't exist
    try {
      accessSync(normalizedPath);
      return normalizedPath;
    } catch (error) {
      logger.warn(`Environment-specific data file not found: ${fileName}, falling back to finances-data.json`);
      const fallbackPath = path.resolve(path.join(dataDir, 'finances-data.json'));
      
      // Security check: ensure the fallback file path is also within the data directory
      if (!fallbackPath.startsWith(dataDir)) {
        throw new ApiError('Invalid fallback file path: security violation', 500, 'SECURITY_ERROR');
      }
      
      return fallbackPath;
    }
  }

  async readFinancesData(): Promise<FinancesData> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFilePath);
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (error) {
        if (error instanceof Error && !error.message.includes('EEXIST')) {
          throw new ApiError('Failed to create data directory', 500, 'DIRECTORY_ERROR');
        }
      }

      // Try to read the file
      const data = await fs.readFile(this.dataFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return FinancesDataSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ApiError('Invalid data format', 500, 'INVALID_FORMAT');
      }
      if (error instanceof z.ZodError) {
        throw new ApiError('Data validation failed', 500, 'VALIDATION_ERROR', error.issues);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      
      // If file doesn't exist, create default data
      if (error instanceof Error && error.message.includes('ENOENT')) {
        logger.info(`Data file not found, creating default: ${this.dataFilePath}`);
        const defaultData: FinancesData = {
          categories: [],
          history: [],
          lastUpdated: new Date().toISOString(),
        };
        await this.writeFinancesData(defaultData);
        return defaultData;
      }

      throw new ApiError('Failed to read data', 500, 'READ_ERROR');
    }
  }

  async writeFinancesData(data: FinancesData): Promise<void> {
    // Validate data before writing
    const validatedData = FinancesDataSchema.parse(data);

    // Use file locking to prevent race conditions
    let release: (() => Promise<void>) | null = null;
    
    try {
      const lockOptions = {
        stale: 30000,
        retries: {
          retries: 3,
          minTimeout: 100,
          maxTimeout: 2000,
          factor: 2,
        },
      };

      release = await lockfile.lock(this.dataFilePath, lockOptions);

      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFilePath);
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (error) {
        if (error instanceof Error && !error.message.includes('EEXIST')) {
          throw new ApiError('Failed to create data directory', 500, 'DIRECTORY_ERROR');
        }
      }

      // Write to temporary file first, then rename for atomic operation
      const tempFilePath = `${this.dataFilePath}.tmp`;
      
      try {
        await fs.writeFile(
          tempFilePath, 
          JSON.stringify(validatedData, null, 2), 
          'utf8'
        );
        await fs.rename(tempFilePath, this.dataFilePath);
      } catch (writeError) {
        // Clean up temp file if it exists
        try {
          await fs.unlink(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }
        throw writeError;
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError('Data validation failed', 400, 'VALIDATION_ERROR', error.issues);
      }
      if (error instanceof Error && error.message.includes('EBUSY')) {
        throw new ApiError('File is currently being used by another process. Please try again.', 409, 'FILE_BUSY');
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to write data', 500, 'WRITE_ERROR');
    } finally {
      // Always release the lock
      if (release) {
        try {
          await release();
        } catch (lockError) {
          logger.error('Error releasing file lock:', lockError);
        }
      }
    }
  }

  async readUnvalidatedData(): Promise<unknown> {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new ApiError('Failed to read data', 500, 'READ_ERROR');
    }
  }

  public getDataFilePathPublic(): string {
    return this.dataFilePath;
  }
}