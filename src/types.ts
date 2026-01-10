/**
 * Type definitions for deepsweep
 */

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export type OutputFormat = 'plain' | 'json';

export interface Config {
  dryRun: boolean;
  interactive: boolean;
  force: boolean;
  preview: boolean;
  logFile?: string;
  outputFormat: OutputFormat;
  maxDepth?: number;
  filesPattern?: string;
  foldersPattern?: string;
  typesPattern?: string;
  excludePatterns: string[];
}

export interface DeletionResult {
  totalItems: number;
  deleted: number;
  failed: number;
  dryRun: boolean;
  failedItems?: string[];
}

