import type { FinancesData } from '../services/financesDataService';

/**
 * Repository interface for financial data operations
 * Defines the contract for data persistence layer
 */
export interface IFinancesRepository {
  /**
   * Read validated financial data
   * @returns Promise resolving to validated FinancesData
   * @throws ApiError if data cannot be read or is invalid
   */
  read(): Promise<FinancesData>;

  /**
   * Write financial data with validation
   * @param data Validated FinancesData to write
   * @throws ApiError if data cannot be written or is invalid
   */
  write(data: FinancesData): Promise<void>;

  /**
   * Read raw data without validation (for migration/debugging)
   * @returns Promise resolving to unknown data
   * @throws ApiError if file cannot be read
   */
  readRaw(): Promise<unknown>;

  /**
   * Check if data file exists
   * @returns Promise resolving to boolean indicating existence
   */
  exists(): Promise<boolean>;

  /**
   * Get the data file path for debugging/logging
   * @returns The absolute path to the data file
   */
  getFilePath(): string;
}