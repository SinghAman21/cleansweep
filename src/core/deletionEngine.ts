/**
 * Deletion Engine for cull
 * Core logic for collecting and processing deletions
 */

import { Config, DeletionResult } from '../types';
import { Logger } from '../utils/logger';
import {
  findFiles,
  findDirectories,
  findItems,
  shouldExclude,
  deleteItem,
  isFile,
  isDirectory
} from '../utils/fileUtils';
import { confirmDeletion, confirmProceed } from '../utils/prompts';

export class DeletionEngine {
  private config: Config;
  private logger: Logger;
  private itemsToDelete: string[] = [];
  private deletedItems: string[] = [];
  private failedDeletions: string[] = [];

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Collects all items (files/folders) that match the specified patterns
   * and stores them in the itemsToDelete array
   */
  async collectItemsToDelete(): Promise<void> {
    this.itemsToDelete = [];
    const allItems: string[] = [];

    // Process file patterns
    if (this.config.filesPattern) {
      const files = await findFiles(
        this.config.filesPattern,
        this.config.maxDepth
      );
      allItems.push(...files);
    }

    // Process folder patterns
    if (this.config.foldersPattern) {
      const dirs = await findDirectories(
        this.config.foldersPattern,
        this.config.maxDepth
      );
      allItems.push(...dirs);
    }

    // Process types pattern (can match both files and directories)
    if (this.config.typesPattern) {
      const items = await findItems(
        this.config.typesPattern,
        this.config.maxDepth
      );
      allItems.push(...items);
    }

    // Filter out excluded items and remove duplicates
    const uniqueItems = [...new Set(allItems)];
    for (const item of uniqueItems) {
      if (!shouldExclude(item, this.config.excludePatterns)) {
        this.itemsToDelete.push(item);
      }
    }

    // Sort for consistent output
    this.itemsToDelete.sort();
  }

  /**
   * Displays a preview of all items that will be deleted
   */
  displayPreview(): void {
    if (this.itemsToDelete.length === 0) {
      this.logger.log('No items found matching the specified patterns.', 'INFO');
      return;
    }

    this.logger.log(
      `Preview: Items that will be deleted (${this.itemsToDelete.length} items):`,
      'INFO'
    );

    if (this.config.outputFormat === 'json') {
      const items = this.itemsToDelete.map(path => ({ path }));
      console.log(JSON.stringify({ items }, null, 2));
    } else {
      for (const item of this.itemsToDelete) {
        console.log(`  - ${item}`);
      }
    }
  }

  /**
   * Deletes a single item (file or directory) with appropriate logging
   * @param item - Path of the item to delete
   */
  async deleteItem(item: string): Promise<void> {
    // Skip if dry run
    if (this.config.dryRun) {
      this.logger.log(`Would delete: ${item}`, 'INFO');
      this.deletedItems.push(item);
      return;
    }

    // Interactive confirmation
    if (this.config.interactive) {
      const confirmed = await confirmDeletion(item, this.config.force);
      if (!confirmed) {
        this.logger.log(`Skipped: ${item}`, 'INFO');
        return;
      }
    }

    // Perform deletion
    if (isDirectory(item)) {
      if (deleteItem(item)) {
        this.logger.log(`Deleted directory: ${item}`, 'INFO');
        this.deletedItems.push(item);
      } else {
        this.logger.log(`Failed to delete directory: ${item}`, 'ERROR');
        this.failedDeletions.push(item);
      }
    } else if (isFile(item)) {
      if (deleteItem(item)) {
        this.logger.log(`Deleted file: ${item}`, 'INFO');
        this.deletedItems.push(item);
      } else {
        this.logger.log(`Failed to delete file: ${item}`, 'ERROR');
        this.failedDeletions.push(item);
      }
    } else {
      this.logger.log(`Item not found or already deleted: ${item}`, 'WARNING');
    }
  }

  /**
   * Processes all collected items for deletion based on the current mode
   */
  async processDeletions(): Promise<void> {
    if (this.itemsToDelete.length === 0) {
      this.logger.log('No items to delete.', 'INFO');
      return;
    }

    // Show preview if requested
    if (this.config.preview) {
      this.displayPreview();
      if (!this.config.dryRun && !this.config.force) {
        const proceed = await confirmProceed();
        if (!proceed) {
          this.logger.log('Deletion cancelled by user.', 'INFO');
          return;
        }
      }
    }

    // Process each item
    for (const item of this.itemsToDelete) {
      await this.deleteItem(item);
    }
  }

  /**
   * Gets the deletion summary
   * @returns DeletionResult object with statistics
   */
  getSummary(): DeletionResult {
    return {
      totalItems: this.itemsToDelete.length,
      deleted: this.deletedItems.length,
      failed: this.failedDeletions.length,
      dryRun: this.config.dryRun,
      failedItems: this.failedDeletions.length > 0 ? this.failedDeletions : undefined
    };
  }

  /**
   * Prints a summary of the deletion operation
   */
  printSummary(): void {
    const summary = this.getSummary();

    if (this.config.outputFormat === 'json') {
      console.log(JSON.stringify({ summary }, null, 2));
    } else {
      this.logger.log('=== Deletion Summary ===', 'INFO');
      this.logger.log(`Total items found: ${summary.totalItems}`, 'INFO');
      if (summary.dryRun) {
        this.logger.log(`Items that would be deleted: ${summary.deleted}`, 'INFO');
      } else {
        this.logger.log(`Items successfully deleted: ${summary.deleted}`, 'INFO');
      }
      if (summary.failed > 0 && summary.failedItems) {
        this.logger.log(`Failed deletions: ${summary.failed}`, 'ERROR');
        for (const item of summary.failedItems) {
          this.logger.log(`  - ${item}`, 'ERROR');
        }
      }
    }
  }

  /**
   * Gets the exit code based on deletion results
   * @returns 0 for success, 1 for failures
   */
  getExitCode(): number {
    return this.failedDeletions.length > 0 ? 1 : 0;
  }
}

