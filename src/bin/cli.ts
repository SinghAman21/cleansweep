#!/usr/bin/env node

/**
 * cull CLI Entry Point
 * Command-line interface for the cull deletion tool
 */

import { Command } from 'commander';
import { Config } from '../types';
import { Logger } from '../utils/logger';
import { DeletionEngine } from '../core/deletionEngine';

/**
 * Main function to run the CLI
 */
async function main() {
  const program = new Command();

  program
    .name('cull')
    .description('A powerful command-line tool for safely deleting files and folders')
    .version('1.0.0')
    .option('-fi, --files <pattern>', 'Specify file patterns to delete (e.g., "*.tmp", "*.log")')
    .option('-fo, --folders <pattern>', 'Specify folder patterns to delete (e.g., "temp", "cache")')
    .option('-ty, --types <pattern>', 'Specify multiple types of files/directories to delete')
    .option('-ex, --exclude <pattern>', 'Exclude patterns or folders from deletion (can be used multiple times)', (val: string, prev: string[]) => {
      prev.push(val);
      return prev;
    }, [] as string[])
    .option('-d, --depth <number>', 'Limit the search depth in directory structure', parseInt)
    .option('-dr, --dry-run', 'Simulate deletion without actually deleting anything', false)
    .option('-in, --interactive', 'Prompt for confirmation before each deletion', false)
    .option('-pr, --preview', 'Display list of items that will be deleted', false)
    .option('-f, --force', 'Bypass safety checks and interactive warnings', false)
    .option('-lg, --log <file>', 'Generate a log file with timestamps of deletions')
    .option('-fm, --format <format>', 'Output format: plain, json (default: plain)', 'plain')
    .addHelpText('after', `
Examples:
  npx cull --files "*.tmp" --folders "temp" --exclude "important" --log deletion_log.txt --dry-run
  npx cull -fi "*.tmp" -fo "temp" -ex "important" -lg deletion_log.txt -dr
  npx cull --types "*.log" --depth 2 --interactive
  npx cull -ty "*.log" -d 2 -in
  npx cull --files "*.tmp" --preview
  npx cull -fi "*.tmp" -pr
  npx cull --folders "cache" --force --log cleanup.log
  npx cull -fo "cache" -f -lg cleanup.log
    `);

  program.parse(process.argv);
  const options = program.opts();

  // Build configuration
  const config: Config = {
    dryRun: options.dryRun || false,
    interactive: options.interactive || false,
    force: options.force || false,
    preview: options.preview || false,
    logFile: options.log,
    outputFormat: options.format === 'json' ? 'json' : 'plain',
    maxDepth: options.depth,
    filesPattern: options.files,
    foldersPattern: options.folders,
    typesPattern: options.types,
    excludePatterns: options.exclude || []
  };

  // Validate that at least one pattern is specified
  if (!config.filesPattern && !config.foldersPattern && !config.typesPattern) {
    console.error('Error: At least one of --files, --folders, or --types must be specified');
    program.help();
    process.exit(1);
  }

  // Validate output format
  if (config.outputFormat !== 'plain' && config.outputFormat !== 'json') {
    console.error("Error: --format must be 'plain' or 'json'");
    process.exit(1);
  }

  // Validate depth if provided
  if (config.maxDepth !== undefined && (isNaN(config.maxDepth) || config.maxDepth < 1)) {
    console.error('Error: --depth must be a positive number');
    process.exit(1);
  }

  // Initialize logger
  const logger = new Logger(config.logFile, config.outputFormat);

  // Initialize log file
  logger.initializeLogFile({
    dryRun: config.dryRun,
    interactive: config.interactive,
    force: config.force,
    filesPattern: config.filesPattern,
    foldersPattern: config.foldersPattern,
    typesPattern: config.typesPattern,
    excludePatterns: config.excludePatterns,
    maxDepth: config.maxDepth
  });

  // Log start of operation
  logger.log('Starting deletion operation...', 'INFO');

  try {
    // Create deletion engine
    const engine = new DeletionEngine(config, logger);

    // Collect items to delete
    await engine.collectItemsToDelete();

    // Process deletions
    await engine.processDeletions();

    // Print summary
    engine.printSummary();

    // Exit with appropriate code
    process.exit(engine.getExitCode());
  } catch (error) {
    logger.log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

