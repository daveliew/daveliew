/**
 * Firecrawl Web Scraping Tool (Code-as-API)
 *
 * Efficient implementation following Anthropic's best practices:
 * - In-environment data processing (filter/aggregate before returning)
 * - State persistence for large scraping jobs
 * - Native control flow (loops, conditionals)
 * - Minimal token usage
 *
 * This replaces traditional tool calls with programmatic API.
 */

import { StateManager } from '../utils/state.js';
import { logger } from '../utils/logger.js';

export interface FirecrawlConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface ScrapeOptions {
  url: string;
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      ogImage?: string;
      [key: string]: any;
    };
  };
  error?: string;
}

export interface CrawlOptions {
  url: string;
  maxPages?: number;
  allowedDomains?: string[];
  excludePaths?: string[];
  taskId?: string; // For state persistence
}

export interface CrawlResult {
  taskId: string;
  pages: Array<{
    url: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
  totalPages: number;
  filteredCount: number; // Count of filtered results (in-env processing)
}

/**
 * Firecrawl API client with efficient in-environment processing
 */
export class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FirecrawlConfig = {}) {
    this.apiKey = config.apiKey || process.env.FIRECRAWL_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
  }

  /**
   * Scrape a single URL with in-environment filtering
   *
   * @example
   * ```ts
   * const result = await firecrawl.scrape({
   *   url: 'https://example.com',
   *   formats: ['markdown'],
   *   onlyMainContent: true
   * });
   * ```
   */
  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    try {
      logger.info(`Scraping URL: ${options.url}`);

      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: options.url,
          formats: options.formats || ['markdown'],
          onlyMainContent: options.onlyMainContent ?? true,
          waitFor: options.waitFor,
          timeout: options.timeout || 30000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Scrape failed: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      logger.error('Scrape error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Crawl multiple pages with in-environment processing and state persistence
   *
   * This demonstrates:
   * - Native loops (not chained tool calls)
   * - In-environment filtering (reduce 1000s of pages to top N)
   * - State persistence (save intermediate results)
   *
   * @example
   * ```ts
   * const result = await firecrawl.crawl({
   *   url: 'https://example.com',
   *   maxPages: 100,
   *   allowedDomains: ['example.com'],
   *   taskId: 'my-crawl-job'
   * });
   * ```
   */
  async crawl(options: CrawlOptions): Promise<CrawlResult> {
    const taskId = options.taskId || `crawl-${Date.now()}`;

    try {
      logger.info(`Starting crawl: ${options.url} (task: ${taskId})`);

      // Check for existing state (resume capability)
      const existingState = await StateManager.load<CrawlResult>(taskId);
      if (existingState) {
        logger.info(`Resuming crawl from state: ${taskId}`);
        return existingState;
      }

      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: options.url,
          limit: options.maxPages || 10,
          allowedDomains: options.allowedDomains,
          excludePaths: options.excludePaths,
        }),
      });

      if (!response.ok) {
        throw new Error(`Crawl failed: ${response.status}`);
      }

      const result = await response.json();
      const pages = result.data || [];

      // IN-ENVIRONMENT PROCESSING: Filter/aggregate before returning
      // This is KEY to reducing token usage!
      const processedPages = this.filterAndAggregatePages(pages, options);

      const crawlResult: CrawlResult = {
        taskId,
        pages: processedPages,
        totalPages: pages.length,
        filteredCount: processedPages.length,
      };

      // STATE PERSISTENCE: Save for large jobs
      await StateManager.save(taskId, crawlResult, {
        description: `Crawl of ${options.url}`,
        dataType: 'crawl-result',
      });

      logger.info(
        `Crawl complete: ${crawlResult.filteredCount}/${crawlResult.totalPages} pages`
      );

      return crawlResult;
    } catch (error) {
      logger.error('Crawl error:', error);
      throw error;
    }
  }

  /**
   * IN-ENVIRONMENT PROCESSING: Filter and aggregate pages
   *
   * This reduces token usage by processing data locally instead
   * of passing all raw data to the model.
   *
   * Example: Reduce 10,000 pages to top 10 most relevant
   */
  private filterAndAggregatePages(
    pages: any[],
    options: CrawlOptions
  ): Array<{ url: string; content: string; metadata?: Record<string, any> }> {
    // NATIVE CONTROL FLOW: Using loops/conditionals instead of tool chains
    return pages
      .filter((page) => {
        // Filter out empty or error pages
        if (!page.markdown || page.markdown.length < 100) {
          return false;
        }

        // Apply custom domain filtering
        if (options.allowedDomains && options.allowedDomains.length > 0) {
          const url = new URL(page.url);
          return options.allowedDomains.some((domain) =>
            url.hostname.includes(domain)
          );
        }

        return true;
      })
      .map((page) => ({
        url: page.url,
        content: page.markdown,
        metadata: {
          title: page.metadata?.title,
          description: page.metadata?.description,
        },
      }))
      .slice(0, options.maxPages || 10); // Limit results to reduce tokens
  }

  /**
   * Extract specific data from scraped content using native processing
   *
   * Example: Extract all links, emails, or specific patterns
   */
  async extractData(
    url: string,
    extractors: {
      links?: boolean;
      emails?: boolean;
      images?: boolean;
      customPattern?: RegExp;
    }
  ): Promise<{ [key: string]: string[] }> {
    const result = await this.scrape({
      url,
      formats: ['markdown', 'html'],
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Scrape failed');
    }

    // IN-ENVIRONMENT EXTRACTION: Use native regex/parsing
    const extracted: { [key: string]: string[] } = {};

    if (extractors.links && result.data.links) {
      extracted.links = result.data.links;
    }

    if (extractors.emails && result.data.markdown) {
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      extracted.emails = result.data.markdown.match(emailRegex) || [];
    }

    if (extractors.images && result.data.html) {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const matches = [...result.data.html.matchAll(imgRegex)];
      extracted.images = matches.map((m) => m[1]);
    }

    if (extractors.customPattern && result.data.markdown) {
      extracted.custom = result.data.markdown.match(extractors.customPattern) || [];
    }

    return extracted;
  }
}

// Export singleton instance with env config
export const firecrawl = new FirecrawlClient();

/**
 * Convenience functions (Code-as-API pattern)
 */
export async function scrapeUrl(
  url: string,
  options?: Partial<ScrapeOptions>
): Promise<ScrapeResult> {
  return firecrawl.scrape({ url, ...options });
}

export async function crawlWebsite(
  url: string,
  options?: Omit<CrawlOptions, 'url'>
): Promise<CrawlResult> {
  return firecrawl.crawl({ url, ...options });
}

export async function extractLinks(url: string): Promise<string[]> {
  const data = await firecrawl.extractData(url, { links: true });
  return data.links || [];
}

export async function extractEmails(url: string): Promise<string[]> {
  const data = await firecrawl.extractData(url, { emails: true });
  return data.emails || [];
}
