/**
 * Data Processing Tool (Code-as-API)
 *
 * Demonstrates in-environment data processing to minimize token usage.
 * Instead of passing large datasets to the model, we filter/aggregate
 * locally using native TypeScript.
 *
 * Example: Reduce 10,000 rows to 5 relevant rows before returning.
 */

import { StateManager } from '../utils/state.js';
import { logger } from '../utils/logger.js';

export interface FilterOptions {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface AggregationOptions {
  groupBy: string;
  aggregations: {
    field: string;
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    alias?: string;
  }[];
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * In-environment data processor
 *
 * This replaces multiple tool calls with native processing:
 * - Old: filter_data() -> sort_data() -> aggregate_data() (3 tool calls)
 * - New: processData({ filters, sort, aggregate }) (1 function call)
 */
export class DataProcessor {
  /**
   * Filter dataset using native conditionals
   *
   * @example
   * ```ts
   * const filtered = DataProcessor.filter(data, [
   *   { field: 'price', operator: 'gt', value: 100 },
   *   { field: 'category', operator: 'eq', value: 'electronics' }
   * ]);
   * ```
   */
  static filter<T extends Record<string, any>>(
    data: T[],
    filters: FilterOptions[]
  ): T[] {
    return data.filter((item) => {
      return filters.every((filter) => {
        const fieldValue = item[filter.field];

        switch (filter.operator) {
          case 'gt':
            return fieldValue > filter.value;
          case 'lt':
            return fieldValue < filter.value;
          case 'eq':
            return fieldValue === filter.value;
          case 'contains':
            return String(fieldValue).includes(String(filter.value));
          case 'startsWith':
            return String(fieldValue).startsWith(String(filter.value));
          case 'endsWith':
            return String(fieldValue).endsWith(String(filter.value));
          default:
            return true;
        }
      });
    });
  }

  /**
   * Sort dataset using native Array.sort
   */
  static sort<T extends Record<string, any>>(
    data: T[],
    options: SortOptions
  ): T[] {
    return [...data].sort((a, b) => {
      const aVal = a[options.field];
      const bVal = b[options.field];

      if (aVal < bVal) return options.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return options.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Aggregate data using native reduce
   *
   * @example
   * ```ts
   * const aggregated = DataProcessor.aggregate(sales, {
   *   groupBy: 'region',
   *   aggregations: [
   *     { field: 'revenue', operation: 'sum', alias: 'total_revenue' },
   *     { field: 'orders', operation: 'count', alias: 'order_count' }
   *   ]
   * });
   * ```
   */
  static aggregate<T extends Record<string, any>>(
    data: T[],
    options: AggregationOptions
  ): Record<string, any>[] {
    const grouped = data.reduce(
      (acc, item) => {
        const key = item[options.groupBy];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );

    return Object.entries(grouped).map(([groupKey, groupItems]) => {
      const result: Record<string, any> = { [options.groupBy]: groupKey };

      options.aggregations.forEach((agg) => {
        const alias = agg.alias || `${agg.operation}_${agg.field}`;
        const values = groupItems.map((item) => item[agg.field]);

        switch (agg.operation) {
          case 'sum':
            result[alias] = values.reduce((sum, val) => sum + (val || 0), 0);
            break;
          case 'avg':
            result[alias] =
              values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
            break;
          case 'count':
            result[alias] = values.length;
            break;
          case 'min':
            result[alias] = Math.min(...values);
            break;
          case 'max':
            result[alias] = Math.max(...values);
            break;
        }
      });

      return result;
    });
  }

  /**
   * Comprehensive data processing pipeline
   *
   * Combines filter, sort, aggregate, and limit in ONE operation
   * instead of chaining multiple tool calls.
   */
  static process<T extends Record<string, any>>(
    data: T[],
    pipeline: {
      filters?: FilterOptions[];
      sort?: SortOptions;
      aggregate?: AggregationOptions;
      limit?: number;
      saveAs?: string; // State persistence
    }
  ): T[] | Record<string, any>[] {
    logger.debug(`Processing ${data.length} records`);

    let result: any[] = data;

    // Apply filters
    if (pipeline.filters && pipeline.filters.length > 0) {
      result = this.filter(result, pipeline.filters);
      logger.debug(`After filters: ${result.length} records`);
    }

    // Apply sorting
    if (pipeline.sort) {
      result = this.sort(result, pipeline.sort);
    }

    // Apply aggregation
    if (pipeline.aggregate) {
      result = this.aggregate(result, pipeline.aggregate);
      logger.debug(`After aggregation: ${result.length} groups`);
    }

    // Apply limit (reduce token usage)
    if (pipeline.limit) {
      result = result.slice(0, pipeline.limit);
      logger.debug(`After limit: ${result.length} records`);
    }

    // State persistence for large datasets
    if (pipeline.saveAs) {
      StateManager.save(pipeline.saveAs, result, {
        description: 'Processed dataset',
        dataType: 'processed-data',
      }).catch((err) => logger.error('Failed to save state:', err));
    }

    return result;
  }

  /**
   * Deduplicate data based on key field(s)
   */
  static deduplicate<T extends Record<string, any>>(
    data: T[],
    keyFields: string[]
  ): T[] {
    const seen = new Set<string>();

    return data.filter((item) => {
      const key = keyFields.map((field) => item[field]).join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Transform data using custom mapper function
   */
  static transform<T, U>(data: T[], mapper: (item: T, index: number) => U): U[] {
    return data.map(mapper);
  }
}

/**
 * Convenience functions (Code-as-API pattern)
 */
export function filterData<T extends Record<string, any>>(
  data: T[],
  filters: FilterOptions[]
): T[] {
  return DataProcessor.filter(data, filters);
}

export function aggregateData<T extends Record<string, any>>(
  data: T[],
  options: AggregationOptions
): Record<string, any>[] {
  return DataProcessor.aggregate(data, options);
}

export function processData<T extends Record<string, any>>(
  data: T[],
  pipeline: Parameters<typeof DataProcessor.process>[1]
): T[] | Record<string, any>[] {
  return DataProcessor.process(data, pipeline);
}
