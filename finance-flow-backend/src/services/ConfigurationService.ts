import * as path from 'path';
import { z } from 'zod';
import { ApiError } from '../utils/errorHandler';
import type { IFileSystemService } from '../utils/FileSystemService';

const ConfigurationSchema = z.object({
  dataDir: z.string().min(1, 'Data directory must be specified'),
  dataEnvironment: z.string().min(1, 'Data environment must be specified'),
});

export interface IConfigurationService {
  /**
   * Get the resolved data file path
   * @returns The absolute path to the data file
   */
  getDataFilePath(): string;
  
  /**
   * Validate configuration object against schema
   * @param config - Configuration object to validate
   * @returns Validated configuration with dataDir and dataEnvironment
   * @throws {ApiError} When validation fails
   */
  validateConfiguration(config: unknown): { dataDir: string; dataEnvironment: string };
}

/**
 * Service responsible for configuration management and path resolution
 */
export class ConfigurationService implements IConfigurationService {
  private dataFilePath: string | null = null;
  private validatedConfig: { dataDir: string; dataEnvironment: string };

  constructor(
    config: { dataDir: string; dataEnvironment: string },
    private fileSystem: IFileSystemService,
    private logger: { warn: (message: string) => void }
  ) {
    this.validatedConfig = this.validateConfiguration(config);
  }

  validateConfiguration(config: unknown): { dataDir: string; dataEnvironment: string } {
    try {
      return ConfigurationSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError('Configuration validation failed', 500, 'CONFIG_ERROR', error.issues);
      }
      throw error;
    }
  }

  getDataFilePath(): string {
    if (this.dataFilePath === null) {
      this.dataFilePath = this.resolveDataFilePath(this.validatedConfig);
    }
    return this.dataFilePath;
  }

  private resolveDataFilePath(config: { dataDir: string; dataEnvironment: string }): string {
    const dataDir = path.resolve(config.dataDir);
    const fileName = `finances-data-${config.dataEnvironment}.json`;
    const filePath = path.join(dataDir, fileName);
    
    // Security check: ensure the file path is within the data directory
    const normalizedPath = path.resolve(filePath);
    if (!normalizedPath.startsWith(dataDir)) {
      throw new ApiError('Invalid file path: security violation', 500, 'SECURITY_ERROR');
    }
    
    // Fallback to default file if environment-specific file doesn't exist
    if (!this.fileSystem.exists(normalizedPath)) {
      this.logger.warn(`Environment-specific data file not found: ${fileName}, falling back to finances-data.json`);
      const fallbackPath = path.resolve(path.join(dataDir, 'finances-data.json'));
      
      // Security check: ensure the fallback file path is also within the data directory
      if (!fallbackPath.startsWith(dataDir)) {
        throw new ApiError('Invalid fallback file path: security violation', 500, 'SECURITY_ERROR');
      }
      
      return fallbackPath;
    }
    
    return normalizedPath;
  }
}

/**
 * Mock configuration service for testing
 */
export class MockConfigurationService implements IConfigurationService {
  constructor(private mockFilePath: string = '/mock/data/finances-data.json') {}

  getDataFilePath(): string {
    return this.mockFilePath;
  }

  validateConfiguration(config: unknown): { dataDir: string; dataEnvironment: string } {
    return ConfigurationSchema.parse(config);
  }
}