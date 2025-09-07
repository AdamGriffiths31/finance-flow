import * as path from 'path';
import { z } from 'zod';
import type { IFinancesRepository } from './IFinancesRepository';
import type { FinancesData } from '../services/financesDataService';
import { FinancesDataSchema } from '../services/financesDataService';
import type { IFileSystemService } from '../utils/FileSystemService';
import type { IConfigurationService } from '../services/ConfigurationService';
import { ApiError } from '../utils/errorHandler';
import { FILE_SYSTEM, ERROR_CODES } from '../constants';

/**
 * File-based implementation of the finances repository
 * Handles all file I/O operations with validation, locking, and atomic writes
 */
export class FileFinancesRepository implements IFinancesRepository {
  private readonly lockOptions = {
    stale: FILE_SYSTEM.LOCK_STALE_TIMEOUT_MS,
    retries: {
      retries: FILE_SYSTEM.LOCK_RETRY_COUNT,
      minTimeout: FILE_SYSTEM.LOCK_MIN_TIMEOUT_MS,
      maxTimeout: FILE_SYSTEM.LOCK_MAX_TIMEOUT_MS,
      factor: FILE_SYSTEM.LOCK_RETRY_FACTOR,
    },
  };

  constructor(
    private fileSystem: IFileSystemService,
    private configService: IConfigurationService,
    private logger: { 
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string, error?: unknown) => void;
    }
  ) {}

  async read(): Promise<FinancesData> {
    const filePath = this.configService.getDataFilePath();
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(filePath);
      await this.fileSystem.mkdir(dataDir);

      // Try to read the file
      const data = await this.fileSystem.readFile(filePath);
      const parsed = JSON.parse(data);
      return FinancesDataSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ApiError('Invalid data format', 500, ERROR_CODES.INVALID_FORMAT);
      }
      if (error instanceof z.ZodError) {
        throw new ApiError('Data validation failed', 500, ERROR_CODES.VALIDATION_ERROR, error.issues);
      }
      
      // If file doesn't exist, create default data
      if (error instanceof Error && error.message.includes('ENOENT')) {
        this.logger.info(`Data file not found, creating default: ${filePath}`);
        const defaultData: FinancesData = {
          categories: [],
          history: [],
          lastUpdated: new Date().toISOString(),
        };
        await this.write(defaultData);
        return defaultData;
      }

      throw new ApiError('Failed to read data', 500, ERROR_CODES.READ_ERROR);
    }
  }

  async write(data: FinancesData): Promise<void> {
    // Validate data before writing
    const validatedData = FinancesDataSchema.parse(data);
    const filePath = this.configService.getDataFilePath();

    // Use file locking to prevent race conditions
    let release: (() => Promise<void>) | null = null;
    
    try {
      release = await this.fileSystem.lock(filePath, this.lockOptions);

      // Ensure data directory exists
      const dataDir = path.dirname(filePath);
      await this.fileSystem.mkdir(dataDir);

      // Write atomically
      await this.fileSystem.atomicWrite(
        filePath, 
        JSON.stringify(validatedData, null, 2)
      );
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError('Data validation failed', 400, ERROR_CODES.VALIDATION_ERROR, error.issues);
      }
      if (error instanceof Error && error.message.includes('EBUSY')) {
        throw new ApiError('File is currently being used by another process. Please try again.', 409, ERROR_CODES.FILE_BUSY);
      }
      throw new ApiError('Failed to write data', 500, ERROR_CODES.WRITE_ERROR);
    } finally {
      // Always release the lock
      if (release) {
        try {
          await release();
        } catch (lockError) {
          this.logger.error('Error releasing file lock:', lockError);
        }
      }
    }
  }

  async readRaw(): Promise<unknown> {
    try {
      const filePath = this.configService.getDataFilePath();
      const data = await this.fileSystem.readFile(filePath);
      return JSON.parse(data);
    } catch (error) {
      throw new ApiError('Failed to read data', 500, ERROR_CODES.READ_ERROR);
    }
  }

  async exists(): Promise<boolean> {
    const filePath = this.configService.getDataFilePath();
    return this.fileSystem.exists(filePath);
  }

  getFilePath(): string {
    return this.configService.getDataFilePath();
  }
}

/**
 * Mock finances repository for testing
 */
export class MockFinancesRepository implements IFinancesRepository {
  private data: FinancesData | null = null;

  constructor(initialData?: FinancesData) {
    this.data = initialData || null;
  }

  async read(): Promise<FinancesData> {
    if (!this.data) {
      // Return default data if none set
      return {
        categories: [],
        history: [],
        lastUpdated: new Date().toISOString(),
      };
    }
    return this.data;
  }

  async write(data: FinancesData): Promise<void> {
    // Validate data before storing
    const validatedData = FinancesDataSchema.parse(data);
    this.data = validatedData;
  }

  async readRaw(): Promise<unknown> {
    return this.data;
  }

  async exists(): Promise<boolean> {
    return this.data !== null;
  }

  getFilePath(): string {
    return '/mock/finances-data.json';
  }

  // Test helper methods
  setData(data: FinancesData): void {
    this.data = data;
  }

  clear(): void {
    this.data = null;
  }
}