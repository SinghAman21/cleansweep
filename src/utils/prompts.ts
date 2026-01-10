/**
 * Interactive prompt utilities for cull
 * Handles user confirmation prompts
 */

import * as readline from 'readline';

/**
 * Creates a readline interface for user input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts the user for confirmation before deleting an item
 * @param item - Path of the item to delete
 * @param force - If true, always returns true without prompting
 * @returns Promise that resolves to true if confirmed, false otherwise
 */
export function confirmDeletion(item: string, force: boolean = false): Promise<boolean> {
  return new Promise((resolve) => {
    if (force) {
      resolve(true);
      return;
    }

    const rl = createReadlineInterface();
    rl.question(`Delete '${item}'? [y/N]: `, (answer) => {
      rl.close();
      const response = answer.trim().toLowerCase();
      resolve(response === 'y' || response === 'yes');
    });
  });
}

/**
 * Prompts the user to proceed with deletion after preview
 * @returns Promise that resolves to true if confirmed, false otherwise
 */
export function confirmProceed(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question('Proceed with deletion? [y/N]: ', (answer) => {
      rl.close();
      const response = answer.trim().toLowerCase();
      resolve(response === 'y' || response === 'yes');
    });
  });
}

