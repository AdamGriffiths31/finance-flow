import { FinancesDataService } from '../services/financesDataService';
import { FileFinancesRepository } from '../repositories/FileFinancesRepository';
import { ConfigurationService } from '../services/ConfigurationService';
import { FileSystemService } from '../utils/FileSystemService';
import type { IFinancesRepository } from '../repositories/IFinancesRepository';
import { config } from '../config';
import { logger, Logger } from '../utils/logger';

/**
 * Factory for creating FinancesDataService instances with proper dependency injection
 * This centralizes the creation and wiring of all dependencies
 */
export class FinancesServiceFactory {
  private static serviceInstance: FinancesDataService | null = null;

  /**
   * Create a new FinancesDataService instance with all dependencies wired
   * @returns Fully configured FinancesDataService instance
   */
  static createService(): FinancesDataService {
    // Create dependencies
    const fileSystem = new FileSystemService();
    const configService = new ConfigurationService(config, fileSystem, logger);
    const repository = new FileFinancesRepository(fileSystem, configService, logger);
    
    // Create service
    return new FinancesDataService(repository, logger);
  }

  /**
   * Get a singleton instance of FinancesDataService
   * This maintains backward compatibility while using proper DI
   * @returns Singleton FinancesDataService instance
   */
  static getInstance(): FinancesDataService {
    if (!FinancesServiceFactory.serviceInstance) {
      FinancesServiceFactory.serviceInstance = FinancesServiceFactory.createService();
    }
    return FinancesServiceFactory.serviceInstance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    FinancesServiceFactory.serviceInstance = null;
  }

  /**
   * Create a service instance for testing with mock dependencies
   * @param mockRepository Mock repository for testing
   * @param mockLogger Mock logger for testing (optional)
   * @returns Test-configured FinancesDataService instance
   */
  static createTestService(
    mockRepository: IFinancesRepository,
    mockLogger?: Logger
  ): FinancesDataService {
    const defaultLogger: Logger = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    };
    
    return new FinancesDataService(mockRepository, mockLogger ?? defaultLogger);
  }
}