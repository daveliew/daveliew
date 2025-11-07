/**
 * Search Tool (Code-as-API)
 *
 * Demonstrates progressive tool discovery and in-environment processing.
 * Provides search capabilities across multiple sources with local filtering.
 */

import { logger } from '../utils/logger.js';

export interface SearchOptions {
  query: string;
  source?: 'web' | 'local' | 'all';
  limit?: number;
  filters?: {
    dateRange?: { start: Date; end: Date };
    domains?: string[];
    excludeTerms?: string[];
  };
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
  source: 'web' | 'local';
  metadata?: Record<string, any>;
}

/**
 * Multi-source search client with in-environment ranking
 */
export class SearchClient {
  /**
   * Search with in-environment filtering and ranking
   *
   * @example
   * ```ts
   * const results = await search.query('typescript best practices', {
   *   limit: 5,
   *   filters: {
   *     domains: ['github.com', 'stackoverflow.com']
   *   }
   * });
   * ```
   */
  async query(options: SearchOptions): Promise<SearchResult[]> {
    logger.info(`Searching: "${options.query}"`);

    let results: SearchResult[] = [];

    // Fetch from appropriate sources
    if (options.source === 'web' || options.source === 'all' || !options.source) {
      const webResults = await this.searchWeb(options.query);
      results.push(...webResults);
    }

    if (options.source === 'local' || options.source === 'all') {
      const localResults = await this.searchLocal(options.query);
      results.push(...localResults);
    }

    // IN-ENVIRONMENT PROCESSING: Filter and rank locally
    results = this.filterAndRank(results, options);

    // Limit results to reduce token usage
    const limit = options.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Search the web (mock implementation - replace with real API)
   */
  private async searchWeb(query: string): Promise<SearchResult[]> {
    // Mock implementation - replace with actual web search API
    // (e.g., Google Custom Search, Brave Search, SerpAPI)
    logger.debug('Performing web search (mock)');

    return [
      {
        title: `Web result for: ${query}`,
        url: 'https://example.com',
        snippet: 'Mock web search result',
        source: 'web',
        relevanceScore: 0.8,
      },
    ];
  }

  /**
   * Search local content (files, documents, etc.)
   */
  private async searchLocal(query: string): Promise<SearchResult[]> {
    // Mock implementation - could search local files, databases, etc.
    logger.debug('Performing local search (mock)');

    return [
      {
        title: `Local result for: ${query}`,
        url: 'file:///path/to/file',
        snippet: 'Mock local search result',
        source: 'local',
        relevanceScore: 0.7,
      },
    ];
  }

  /**
   * IN-ENVIRONMENT FILTERING AND RANKING
   *
   * This is KEY to reducing token usage:
   * - Apply filters using native conditionals
   * - Rank by relevance using native scoring
   * - Return only top N results
   */
  private filterAndRank(
    results: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    let filtered = [...results];

    // Apply domain filter
    if (options.filters?.domains && options.filters.domains.length > 0) {
      filtered = filtered.filter((result) => {
        try {
          const url = new URL(result.url);
          return options.filters!.domains!.some((domain) =>
            url.hostname.includes(domain)
          );
        } catch {
          return false;
        }
      });
    }

    // Apply exclude terms filter
    if (options.filters?.excludeTerms && options.filters.excludeTerms.length > 0) {
      filtered = filtered.filter((result) => {
        const text = `${result.title} ${result.snippet}`.toLowerCase();
        return !options.filters!.excludeTerms!.some((term) =>
          text.includes(term.toLowerCase())
        );
      });
    }

    // Rank by relevance score
    filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return filtered;
  }

  /**
   * Extract key information from search results
   *
   * Example: Extract all unique domains, authors, or dates
   */
  extractMetadata(results: SearchResult[]): {
    domains: string[];
    sources: string[];
    avgRelevance: number;
  } {
    const domains = new Set<string>();

    results.forEach((result) => {
      try {
        const url = new URL(result.url);
        domains.add(url.hostname);
      } catch {
        // Invalid URL, skip
      }
    });

    const sources = [...new Set(results.map((r) => r.source))];
    const avgRelevance =
      results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) /
      results.length;

    return {
      domains: Array.from(domains),
      sources,
      avgRelevance,
    };
  }
}

// Export singleton instance
export const search = new SearchClient();

/**
 * Convenience functions (Code-as-API pattern)
 */
export async function searchWeb(
  query: string,
  limit?: number
): Promise<SearchResult[]> {
  return search.query({ query, source: 'web', limit });
}

export async function searchLocal(
  query: string,
  limit?: number
): Promise<SearchResult[]> {
  return search.query({ query, source: 'local', limit });
}

export async function searchAll(
  query: string,
  limit?: number
): Promise<SearchResult[]> {
  return search.query({ query, source: 'all', limit });
}
