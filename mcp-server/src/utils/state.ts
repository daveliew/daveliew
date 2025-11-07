/**
 * State Persistence Utility
 *
 * Handles saving and loading intermediate results to files,
 * enabling long-running tasks to resume and track progress.
 *
 * This reduces token usage by storing large datasets outside
 * the model's context window.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const STATE_DIR = join(process.cwd(), '.data');

export interface StateMetadata {
  taskId: string;
  timestamp: number;
  description?: string;
  dataType?: string;
}

export class StateManager {
  /**
   * Save state to file with metadata
   */
  static async save<T>(
    taskId: string,
    data: T,
    metadata?: Partial<StateMetadata>
  ): Promise<void> {
    await mkdir(STATE_DIR, { recursive: true });

    const state = {
      metadata: {
        taskId,
        timestamp: Date.now(),
        ...metadata,
      },
      data,
    };

    const filePath = join(STATE_DIR, `${taskId}.json`);
    await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Load state from file
   */
  static async load<T>(taskId: string): Promise<T | null> {
    try {
      const filePath = join(STATE_DIR, `${taskId}.json`);
      const content = await readFile(filePath, 'utf-8');
      const state = JSON.parse(content);
      return state.data as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if state exists
   */
  static async exists(taskId: string): Promise<boolean> {
    try {
      const filePath = join(STATE_DIR, `${taskId}.json`);
      await readFile(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get metadata without loading full data (for large datasets)
   */
  static async getMetadata(taskId: string): Promise<StateMetadata | null> {
    try {
      const filePath = join(STATE_DIR, `${taskId}.json`);
      const content = await readFile(filePath, 'utf-8');
      const state = JSON.parse(content);
      return state.metadata;
    } catch {
      return null;
    }
  }
}
