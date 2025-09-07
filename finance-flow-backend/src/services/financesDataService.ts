import { z } from 'zod';
import type { IFinancesRepository } from '../repositories/IFinancesRepository';
import { ApiError } from '../utils/errorHandler';
import { VALIDATION, ERROR_CODES } from '../constants';

// Zod schemas for validation - aligned with frontend expectations and actual data format
const FinanceCategoryInfoSchema = z.object({
  name: z.string().min(VALIDATION.CATEGORY_NAME_MIN_LENGTH).max(VALIDATION.CATEGORY_NAME_MAX_LENGTH),
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

export { FinancesData, FinanceCategory, FinanceHistoryPoint, FinancesDataSchema, FinanceCategoryInfoSchema, FinanceHistoryPointSchema };

/**
 * Service layer for finances data operations
 * Handles business logic and delegates persistence to repository
 */
export class FinancesDataService {
  constructor(
    private repository: IFinancesRepository,
    private logger: { 
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string, error?: unknown) => void;
    }
  ) {}

  /**
   * Read validated financial data
   * @returns Promise resolving to validated FinancesData
   */
  async readFinancesData(): Promise<FinancesData> {
    return this.repository.read();
  }

  /**
   * Write validated financial data
   * @param data FinancesData to write
   */
  async writeFinancesData(data: FinancesData): Promise<void> {
    return this.repository.write(data);
  }

  /**
   * Read raw data without validation (for migration/debugging)
   * @returns Promise resolving to unknown data
   */
  async readUnvalidatedData(): Promise<unknown> {
    return this.repository.readRaw();
  }

  /**
   * Get the data file path for debugging/logging
   * @returns The absolute path to the data file
   */
  public getDataFilePath(): string {
    return this.repository.getFilePath();
  }

  /**
   * Check if data file exists
   * @returns Promise resolving to boolean indicating existence
   */
  async dataExists(): Promise<boolean> {
    return this.repository.exists();
  }

  // Business logic methods can be added here as needed
  // For example:
  
  /**
   * Add a new category to the finances data
   * @param category - The category to add with name and color properties
   * @throws {ApiError} When category already exists or validation fails
   * @example
   * ```typescript
   * await service.addCategory({ name: "Groceries", color: "#FF5733" });
   * ```
   */
  async addCategory(category: FinanceCategory): Promise<void> {
    const data = await this.readFinancesData();
    
    // Check if category already exists
    const existingCategory = data.categories.find(c => c.name === category.name);
    if (existingCategory) {
      throw new ApiError('Category already exists', 400, ERROR_CODES.DUPLICATE_CATEGORY);
    }

    data.categories.push(category);
    data.lastUpdated = new Date().toISOString();
    
    await this.writeFinancesData(data);
    this.logger.info(`Added new category: ${category.name}`);
  }

  /**
   * Update an existing category
   * @param categoryName - The name of the category to update
   * @param updates - Partial category object with properties to update
   * @throws {ApiError} When category is not found or validation fails
   * @example
   * ```typescript
   * await service.updateCategory("Groceries", { color: "#00FF00" });
   * ```
   */
  async updateCategory(categoryName: string, updates: Partial<FinanceCategory>): Promise<void> {
    const data = await this.readFinancesData();
    
    const categoryIndex = data.categories.findIndex(c => c.name === categoryName);
    if (categoryIndex === -1) {
      throw new ApiError('Category not found', 404, ERROR_CODES.CATEGORY_NOT_FOUND);
    }

    data.categories[categoryIndex] = { ...data.categories[categoryIndex], ...updates };
    data.lastUpdated = new Date().toISOString();
    
    await this.writeFinancesData(data);
    this.logger.info(`Updated category: ${categoryName}`);
  }

  /**
   * Remove a category from the finances data
   * Also removes all associated data from historical records
   * @param categoryName - The name of the category to remove
   * @throws {ApiError} When category is not found
   * @example
   * ```typescript
   * await service.removeCategory("OldCategory");
   * ```
   */
  async removeCategory(categoryName: string): Promise<void> {
    const data = await this.readFinancesData();
    
    const initialLength = data.categories.length;
    data.categories = data.categories.filter(c => c.name !== categoryName);
    
    if (data.categories.length === initialLength) {
      throw new ApiError('Category not found', 404, ERROR_CODES.CATEGORY_NOT_FOUND);
    }

    // Remove category data from history as well
    data.history.forEach(historyPoint => {
      delete historyPoint.data[categoryName];
    });

    data.lastUpdated = new Date().toISOString();
    
    await this.writeFinancesData(data);
    this.logger.info(`Removed category: ${categoryName}`);
  }

  /**
   * Add a new history point to the finances data
   * If a history point for the same date exists, it will be updated
   * @param historyPoint - The history point containing date and financial data
   * @throws {ApiError} When validation fails
   * @example
   * ```typescript
   * await service.addHistoryPoint({
   *   date: "2024-01-15",
   *   data: { "Groceries": 500, "Rent": 1200 }
   * });
   * ```
   */
  async addHistoryPoint(historyPoint: FinanceHistoryPoint): Promise<void> {
    const data = await this.readFinancesData();
    
    // Check if a history point for this date already exists
    const existingPointIndex = data.history.findIndex(p => p.date === historyPoint.date);
    if (existingPointIndex !== -1) {
      // Update existing point
      data.history[existingPointIndex] = historyPoint;
      this.logger.info(`Updated history point for date: ${historyPoint.date}`);
    } else {
      // Add new point and sort by date
      data.history.push(historyPoint);
      data.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      this.logger.info(`Added new history point for date: ${historyPoint.date}`);
    }

    data.lastUpdated = new Date().toISOString();
    await this.writeFinancesData(data);
  }
}