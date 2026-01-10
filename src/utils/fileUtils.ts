/**
 * File utility functions for deepsweep
 * Handles file system operations and pattern matching
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Checks if a given path should be excluded based on exclusion patterns
 * @param filePath - Path to check
 * @param excludePatterns - Array of exclusion patterns
 * @returns true if should be excluded, false otherwise
 */
export function shouldExclude(filePath: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    // Check if path contains the pattern or basename matches
    if (filePath.includes(pattern) || path.basename(filePath) === pattern) {
      return true;
    }
  }
  return false;
}

/**
 * Finds files matching a pattern with optional depth limit
 * @param pattern - Glob pattern to match
 * @param maxDepth - Maximum depth to search (optional)
 * @param currentDir - Current directory to search in
 * @returns Array of matching file paths
 */
export async function findFiles(
  pattern: string,
  maxDepth?: number,
  currentDir: string = process.cwd()
): Promise<string[]> {
  const options: any = {
    cwd: currentDir,
    absolute: false,
    nodir: true
  };

  if (maxDepth !== undefined) {
    options.maxDepth = maxDepth;
  }

  try {
    const files = await glob(pattern, options);
    return files.map(file => path.relative(process.cwd(), path.resolve(currentDir, file)));
  } catch (error) {
    return [];
  }
}

/**
 * Finds directories matching a pattern with optional depth limit
 * @param pattern - Glob pattern to match
 * @param maxDepth - Maximum depth to search (optional)
 * @param currentDir - Current directory to search in
 * @returns Array of matching directory paths
 */
export async function findDirectories(
  pattern: string,
  maxDepth?: number,
  currentDir: string = process.cwd()
): Promise<string[]> {
  const directories: string[] = [];

  /**
   * Recursively search for directories
   */
  function searchDir(dir: string, currentDepth: number = 0): void {
    if (maxDepth !== undefined && currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (entry.isDirectory()) {
          // Check if directory name matches pattern
          if (matchesPattern(entry.name, pattern)) {
            directories.push(relativePath);
          }
          // Recursively search subdirectories
          searchDir(fullPath, currentDepth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return;
    }
  }

  searchDir(currentDir);
  return directories;
}

/**
 * Finds both files and directories matching a pattern
 * @param pattern - Glob pattern to match
 * @param maxDepth - Maximum depth to search (optional)
 * @param currentDir - Current directory to search in
 * @returns Array of matching paths
 */
export async function findItems(
  pattern: string,
  maxDepth?: number,
  currentDir: string = process.cwd()
): Promise<string[]> {
  const items: string[] = [];

  /**
   * Recursively search for items
   */
  function searchDir(dir: string, currentDepth: number = 0): void {
    if (maxDepth !== undefined && currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        // Check if name matches pattern
        if (matchesPattern(entry.name, pattern)) {
          items.push(relativePath);
        }

        // Recursively search subdirectories
        if (entry.isDirectory()) {
          searchDir(fullPath, currentDepth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return;
    }
  }

  searchDir(currentDir);
  return items;
}

/**
 * Simple pattern matching (converts glob to regex-like matching)
 * @param name - Name to check
 * @param pattern - Pattern to match against
 * @returns true if matches, false otherwise
 */
function matchesPattern(name: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(name);
}

/**
 * Deletes a file or directory
 * @param itemPath - Path to the item to delete
 * @returns true if successful, false otherwise
 */
export function deleteItem(itemPath: string): boolean {
  try {
    const fullPath = path.resolve(itemPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      return true;
    } else if (stat.isFile()) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a path exists and is a file
 * @param itemPath - Path to check
 * @returns true if exists and is a file
 */
export function isFile(itemPath: string): boolean {
  try {
    const stat = fs.statSync(itemPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Checks if a path exists and is a directory
 * @param itemPath - Path to check
 * @returns true if exists and is a directory
 */
export function isDirectory(itemPath: string): boolean {
  try {
    const stat = fs.statSync(itemPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

