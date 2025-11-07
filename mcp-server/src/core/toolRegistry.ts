/**
 * Tool Registry for Progressive Tool Discovery
 *
 * Implements lazy loading of tools to minimize context window usage.
 * Tools are only loaded when needed, not upfront.
 *
 * This is KEY to achieving 98.7% token reduction (from 150k to 2k tokens).
 */

import { logger } from '../utils/logger.js';

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  examples?: string[];
  module: string; // Path to the code module
}

/**
 * Tool Registry with progressive discovery
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition>;
  private loadedModules: Map<string, any>;

  constructor() {
    this.tools = new Map();
    this.loadedModules = new Map();
    this.registerDefaultTools();
  }

  /**
   * Register default tools
   *
   * Note: We only store METADATA here, not the actual tool code.
   * The code is loaded lazily when needed.
   */
  private registerDefaultTools(): void {
    // Firecrawl tools
    this.register({
      name: 'firecrawl_scrape',
      description: 'Scrape a single URL and extract content (markdown, HTML, links, etc.)',
      category: 'web-scraping',
      module: '../tools/firecrawl.js',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to scrape' },
          formats: {
            type: 'array',
            items: { enum: ['markdown', 'html', 'rawHtml', 'links', 'screenshot'] },
            description: 'Content formats to extract',
          },
          onlyMainContent: { type: 'boolean', description: 'Extract only main content' },
        },
        required: ['url'],
      },
      examples: [
        'Scrape https://example.com and extract markdown',
        'Get all links from a webpage',
      ],
    });

    this.register({
      name: 'firecrawl_crawl',
      description: 'Crawl multiple pages from a website with in-environment filtering',
      category: 'web-scraping',
      module: '../tools/firecrawl.js',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Starting URL to crawl' },
          maxPages: { type: 'number', description: 'Maximum pages to crawl' },
          allowedDomains: {
            type: 'array',
            items: { type: 'string' },
            description: 'Allowed domains to crawl',
          },
          taskId: { type: 'string', description: 'Task ID for state persistence' },
        },
        required: ['url'],
      },
      examples: ['Crawl example.com up to 100 pages', 'Crawl and save results for later'],
    });

    // Data processing tools
    this.register({
      name: 'process_data',
      description:
        'Process, filter, sort, and aggregate data in-environment (reduces token usage)',
      category: 'data-processing',
      module: '../tools/dataProcessor.js',
      inputSchema: {
        type: 'object',
        properties: {
          data: { type: 'array', description: 'Array of data objects to process' },
          filters: {
            type: 'array',
            description: 'Filter criteria',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                operator: { enum: ['gt', 'lt', 'eq', 'contains', 'startsWith'] },
                value: {},
              },
            },
          },
          sort: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              order: { enum: ['asc', 'desc'] },
            },
          },
          limit: { type: 'number', description: 'Limit results to N items' },
        },
        required: ['data'],
      },
      examples: [
        'Filter dataset where price > 100',
        'Sort and limit to top 10 results',
        'Aggregate sales by region',
      ],
    });

    // Search tools
    this.register({
      name: 'search',
      description: 'Search web or local sources with in-environment filtering',
      category: 'search',
      module: '../tools/search.js',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          source: { enum: ['web', 'local', 'all'], description: 'Search source' },
          limit: { type: 'number', description: 'Maximum results' },
          filters: {
            type: 'object',
            properties: {
              domains: { type: 'array', items: { type: 'string' } },
              excludeTerms: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['query'],
      },
      examples: [
        'Search for "TypeScript best practices"',
        'Search only GitHub and StackOverflow',
      ],
    });

    logger.info(`Registered ${this.tools.size} tools`);
  }

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * PROGRESSIVE DISCOVERY: Search tools by query
   *
   * This allows agents to discover tools on-demand instead of
   * loading all tool definitions upfront.
   */
  search(query: string, category?: string): ToolDefinition[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.tools.values()).filter((tool) => {
      // Filter by category if specified
      if (category && tool.category !== category) {
        return false;
      }

      // Search in name, description, and examples
      const searchText = [
        tool.name,
        tool.description,
        ...(tool.examples || []),
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });
  }

  /**
   * List all tools (with optional category filter)
   */
  list(category?: string): ToolDefinition[] {
    if (category) {
      return Array.from(this.tools.values()).filter(
        (tool) => tool.category === category
      );
    }
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List available categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.tools.forEach((tool) => categories.add(tool.category));
    return Array.from(categories);
  }

  /**
   * LAZY LOADING: Load tool module when needed
   *
   * This is KEY to reducing context window usage.
   * Modules are only loaded when actually called.
   */
  async loadTool(name: string): Promise<any> {
    // Check if already loaded
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.debug(`Loading tool module: ${name} from ${tool.module}`);

    // Dynamically import the module
    const module = await import(tool.module);

    this.loadedModules.set(name, module);
    return module;
  }

  /**
   * Execute a tool with given parameters
   *
   * This demonstrates the Code-as-API pattern:
   * Instead of passing tool calls through MCP, we execute
   * code directly and return only the result.
   */
  async execute(name: string, params: any): Promise<any> {
    const module = await this.loadTool(name);

    // Map tool names to module functions
    const functionMap: Record<string, string> = {
      firecrawl_scrape: 'scrapeUrl',
      firecrawl_crawl: 'crawlWebsite',
      process_data: 'processData',
      search: 'searchAll',
    };

    const functionName = functionMap[name];
    if (!functionName || !module[functionName]) {
      throw new Error(`Function not found: ${functionName} in ${name}`);
    }

    logger.info(`Executing tool: ${name}`);
    return await module[functionName](params);
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
