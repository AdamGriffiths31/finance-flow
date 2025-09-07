import { promises as fs, accessSync } from 'fs';
import * as lockfile from 'proper-lockfile';

/**
 * File system abstraction for testability and consistency
 */
export interface IFileSystemService {
  /**
   * Read file contents as UTF-8 string
   * @param filePath - Absolute path to the file to read
   * @returns Promise resolving to file contents
   */
  readFile(filePath: string): Promise<string>;
  
  /**
   * Write content to file as UTF-8
   * @param filePath - Absolute path to the file to write
   * @param content - Content to write to the file
   * @returns Promise that resolves when write is complete
   */
  writeFile(filePath: string, content: string): Promise<void>;
  
  /**
   * Check if file exists synchronously
   * @param filePath - Absolute path to check
   * @returns True if file exists, false otherwise
   */
  exists(filePath: string): boolean;
  
  /**
   * Create directory recursively
   * @param dirPath - Directory path to create
   * @returns Promise that resolves when directory is created
   */
  mkdir(dirPath: string): Promise<void>;
  
  /**
   * Lock file for exclusive access
   * @param filePath - Path to file to lock
   * @param options - Lock configuration options
   * @returns Promise resolving to release function
   */
  lock(filePath: string, options: lockfile.LockOptions): Promise<() => Promise<void>>;
  
  /**
   * Write file atomically using temporary file
   * @param filePath - Target file path
   * @param content - Content to write
   * @returns Promise that resolves when write is complete
   */
  atomicWrite(filePath: string, content: string): Promise<void>;
}

/**
 * Production file system service implementation
 */
export class FileSystemService implements IFileSystemService {
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf8');
  }

  exists(filePath: string): boolean {
    try {
      accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error instanceof Error && !error.message.includes('EEXIST')) {
        throw error;
      }
    }
  }

  async lock(filePath: string, options: lockfile.LockOptions): Promise<() => Promise<void>> {
    return lockfile.lock(filePath, options);
  }

  async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempFilePath = `${filePath}.tmp`;
    
    try {
      await fs.writeFile(tempFilePath, content, 'utf8');
      await fs.rename(tempFilePath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}

/**
 * Mock file system service for testing
 */
export class MockFileSystemService implements IFileSystemService {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();
  private locks: Set<string> = new Set();

  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      const error = new Error('ENOENT: no such file or directory') as Error & { code: string };
      error.code = 'ENOENT';
      throw error;
    }
    return content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  exists(filePath: string): boolean {
    return this.files.has(filePath);
  }

  async mkdir(dirPath: string): Promise<void> {
    this.directories.add(dirPath);
  }

  async lock(filePath: string, _options: lockfile.LockOptions): Promise<() => Promise<void>> {
    if (this.locks.has(filePath)) {
      throw new Error('EBUSY: resource busy or locked');
    }
    this.locks.add(filePath);
    
    return async (): Promise<void> => {
      this.locks.delete(filePath);
    };
  }

  async atomicWrite(filePath: string, content: string): Promise<void> {
    // Simulate atomic operation
    await this.writeFile(filePath, content);
  }

  // Test helper methods
  setFileContent(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
    this.locks.clear();
  }
}