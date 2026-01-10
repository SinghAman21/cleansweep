/**
 * Logger utility for cull
 * Handles logging to console and log files with timestamps
 */

import * as fs from 'fs';
import * as path from 'path';
import { LogLevel, OutputFormat } from '../types';

export class Logger {
  private logFile?: string;
  private outputFormat: OutputFormat;

  constructor(logFile?: string, outputFormat: OutputFormat = 'plain') {
    this.logFile = logFile;
    this.outputFormat = outputFormat;
  }

  /**
   * Logs a message with timestamp to both console and log file (if specified)
   * @param message - Message to log
   * @param level - Log level (INFO, WARNING, ERROR)
   */
  log(message: string, level: LogLevel = 'INFO'): void {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    // Print to console
    if (this.outputFormat === 'json') {
      const jsonMessage = JSON.stringify({
        timestamp,
        level,
        message
      });
      console.log(jsonMessage);
    } else {
      console.log(formattedMessage);
    }

    // Write to log file if specified
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error(`Failed to write to log file: ${error}`);
      }
    }
  }

  /**
   * Initializes the log file with header information
   * @param config - Configuration object with all settings
   */
  initializeLogFile(config: {
    dryRun: boolean;
    interactive: boolean;
    force: boolean;
    filesPattern?: string;
    foldersPattern?: string;
    typesPattern?: string;
    excludePatterns: string[];
    maxDepth?: number;
  }): void {
    if (!this.logFile) return;

    try {
      const header = [
        '==========================================',
        `Deletion Log - ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
        '==========================================',
        `Dry Run: ${config.dryRun}`,
        `Interactive: ${config.interactive}`,
        `Force: ${config.force}`,
        ...(config.filesPattern ? [`Files Pattern: ${config.filesPattern}`] : []),
        ...(config.foldersPattern ? [`Folders Pattern: ${config.foldersPattern}`] : []),
        ...(config.typesPattern ? [`Types Pattern: ${config.typesPattern}`] : []),
        ...(config.excludePatterns.length > 0
          ? [`Exclude Patterns: ${config.excludePatterns.join(', ')}`]
          : []),
        ...(config.maxDepth ? [`Max Depth: ${config.maxDepth}`] : []),
        '==========================================',
        ''
      ].join('\n');

      fs.writeFileSync(this.logFile, header);
    } catch (error) {
      console.error(`Failed to initialize log file: ${error}`);
    }
  }
}

