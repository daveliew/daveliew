# Usage Examples

Real-world examples demonstrating efficient MCP patterns.

## Table of Contents

1. [Web Scraping Workflows](#web-scraping-workflows)
2. [Data Processing Pipelines](#data-processing-pipelines)
3. [Combined Workflows](#combined-workflows)
4. [State Management](#state-management)
5. [Performance Optimization](#performance-optimization)

---

## Web Scraping Workflows

### Example 1: Blog Content Extraction

**Goal**: Extract recent blog posts and their metadata.

```typescript
import { crawlWebsite } from './tools/firecrawl.js';
import { processData } from './tools/dataProcessor.js';

async function extractBlogPosts(blogUrl: string) {
  // 1. Crawl blog (in-environment filtering)
  const crawlResult = await crawlWebsite(blogUrl, {
    maxPages: 50,
    allowedDomains: [new URL(blogUrl).hostname],
    taskId: 'blog-crawl'
  });

  // 2. Process posts (filter for recent, limit results)
  const recentPosts = processData(crawlResult.pages, {
    filters: [
      { field: 'content', operator: 'contains', value: 'TypeScript' }
    ],
    sort: { field: 'metadata.date', order: 'desc' },
    limit: 10,
    saveAs: 'recent-posts'
  });

  return recentPosts;
}

// Usage
const posts = await extractBlogPosts('https://blog.example.com');
console.log(`Extracted ${posts.length} posts`);
```

**Token Impact**:
- Traditional: 50 pages × 10k tokens = 500k tokens
- Efficient: 10 posts × 1k tokens = 10k tokens
- **Savings: 98%**

---

### Example 2: Competitive Analysis

**Goal**: Compare pricing across competitor websites.

```typescript
import { scrapeUrl } from './tools/firecrawl.js';
import { extractEmails } from './tools/firecrawl.js';

async function competitiveAnalysis(competitors: string[]) {
  // Scrape all competitors in parallel
  const results = await Promise.all(
    competitors.map(url => scrapeUrl(url, {
      formats: ['markdown'],
      onlyMainContent: true
    }))
  );

  // Extract pricing info locally (in-environment)
  const pricing = results.map((result, i) => {
    const content = result.data?.markdown || '';

    // Extract pricing using regex (in-environment processing)
    const priceMatch = content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    const prices = priceMatch?.map(p => parseFloat(p.replace(/[$,]/g, ''))) || [];

    return {
      url: competitors[i],
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  });

  return pricing;
}

// Usage
const competitors = [
  'https://competitor1.com/pricing',
  'https://competitor2.com/pricing',
  'https://competitor3.com/pricing'
];

const analysis = await competitiveAnalysis(competitors);
```

**Token Impact**:
- Traditional: Full HTML × 3 sites = 150k tokens
- Efficient: Pricing summary only = 500 tokens
- **Savings: 99.7%**

---

### Example 3: Documentation Scraping

**Goal**: Build searchable documentation index.

```typescript
import { crawlWebsite } from './tools/firecrawl.js';
import { StateManager } from './utils/state.js';

async function buildDocsIndex(docsUrl: string) {
  // 1. Crawl documentation
  const docs = await crawlWebsite(docsUrl, {
    maxPages: 500,
    allowedDomains: [new URL(docsUrl).hostname],
    taskId: 'docs-index'
  });

  // 2. Build search index (in-environment)
  const searchIndex = docs.pages.map(page => ({
    url: page.url,
    title: page.metadata?.title || '',
    keywords: extractKeywords(page.content),
    wordCount: page.content.split(/\s+/).length
  }));

  // 3. Save to state (avoid reprocessing)
  await StateManager.save('docs-search-index', searchIndex, {
    description: 'Documentation search index',
    dataType: 'search-index'
  });

  return searchIndex;
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction (in-environment)
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// Usage
const index = await buildDocsIndex('https://docs.example.com');
```

---

## Data Processing Pipelines

### Example 4: Sales Data Analysis

**Goal**: Analyze sales data to find top performers.

```typescript
import { processData, aggregateData } from './tools/dataProcessor.js';

interface SalesRecord {
  date: string;
  salesperson: string;
  region: string;
  product: string;
  revenue: number;
  quantity: number;
}

async function analyzeSales(salesData: SalesRecord[]) {
  // 1. Filter recent sales (Q1 2024)
  const recentSales = processData(salesData, {
    filters: [
      { field: 'date', operator: 'gt', value: '2024-01-01' },
      { field: 'date', operator: 'lt', value: '2024-04-01' }
    ]
  });

  // 2. Aggregate by salesperson
  const bySalesperson = aggregateData(recentSales, {
    groupBy: 'salesperson',
    aggregations: [
      { field: 'revenue', operation: 'sum', alias: 'total_revenue' },
      { field: 'quantity', operation: 'sum', alias: 'units_sold' },
      { field: 'revenue', operation: 'avg', alias: 'avg_deal_size' }
    ]
  });

  // 3. Find top performers
  const topPerformers = processData(bySalesperson, {
    sort: { field: 'total_revenue', order: 'desc' },
    limit: 10,
    saveAs: 'top-performers-q1-2024'
  });

  return topPerformers;
}

// Usage with 100,000 sales records
const salesData = await fetchSalesData(); // 100k records
const topPerformers = await analyzeSales(salesData);
// Returns only 10 records
```

**Token Impact**:
- Input: 100,000 records × 100 tokens = 10M tokens
- Output: 10 records × 100 tokens = 1k tokens
- **Savings: 99.99%**

---

### Example 5: Customer Segmentation

**Goal**: Segment customers by behavior.

```typescript
import { processData, DataProcessor } from './tools/dataProcessor.js';

interface Customer {
  id: string;
  email: string;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string;
  averageOrderValue: number;
}

async function segmentCustomers(customers: Customer[]) {
  // Define segments with in-environment filtering
  const segments = {
    vip: processData(customers, {
      filters: [
        { field: 'totalSpend', operator: 'gt', value: 5000 },
        { field: 'orderCount', operator: 'gt', value: 20 }
      ],
      limit: 100
    }),

    active: processData(customers, {
      filters: [
        { field: 'lastOrderDate', operator: 'gt', value: '2024-01-01' },
        { field: 'orderCount', operator: 'gt', value: 5 }
      ],
      limit: 500
    }),

    atRisk: processData(customers, {
      filters: [
        { field: 'lastOrderDate', operator: 'lt', value: '2023-06-01' },
        { field: 'totalSpend', operator: 'gt', value: 1000 }
      ],
      limit: 200
    }),

    new: processData(customers, {
      filters: [
        { field: 'orderCount', operator: 'lt', value: 3 }
      ],
      limit: 1000
    })
  };

  return segments;
}

// Usage
const allCustomers = await fetchCustomers(); // 50k customers
const segments = await segmentCustomers(allCustomers);
// Returns only relevant customers per segment
```

---

## Combined Workflows

### Example 6: Competitor Content + Pricing Analysis

**Goal**: Analyze competitors' content and pricing together.

```typescript
import { scrapeUrl } from './tools/firecrawl.js';
import { processData } from './tools/dataProcessor.js';

async function fullCompetitorAnalysis(competitors: string[]) {
  // 1. Scrape all competitor sites
  const scrapeResults = await Promise.all(
    competitors.map(url => scrapeUrl(url, {
      formats: ['markdown', 'links']
    }))
  );

  // 2. Extract data in-environment
  const competitorData = scrapeResults.map((result, i) => {
    const content = result.data?.markdown || '';
    const links = result.data?.links || [];

    return {
      url: competitors[i],
      pricing: extractPricing(content),
      features: extractFeatures(content),
      socialLinks: links.filter(link =>
        link.includes('twitter') || link.includes('linkedin')
      ),
      contentLength: content.length,
      keywordDensity: calculateKeywordDensity(content, ['pricing', 'features', 'support'])
    };
  });

  // 3. Process and compare
  const comparison = processData(competitorData, {
    sort: { field: 'pricing.minPrice', order: 'asc' },
    saveAs: 'competitor-analysis'
  });

  return comparison;
}

function extractPricing(content: string) {
  const priceMatch = content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
  const prices = priceMatch?.map(p => parseFloat(p.replace(/[$,]/g, ''))) || [];

  return {
    minPrice: Math.min(...prices) || 0,
    maxPrice: Math.max(...prices) || 0,
    avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length || 0
  };
}

function extractFeatures(content: string): string[] {
  const featurePattern = /(?:✓|✔|•|-)\s*([^.\n]+)/g;
  const matches = [...content.matchAll(featurePattern)];
  return matches.map(m => m[1].trim()).slice(0, 10);
}

function calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;

  return keywords.reduce((acc, keyword) => {
    const count = words.filter(w => w.includes(keyword)).length;
    acc[keyword] = (count / totalWords) * 100;
    return acc;
  }, {} as Record<string, number>);
}
```

---

### Example 7: Research Aggregation

**Goal**: Gather and summarize research from multiple sources.

```typescript
import { searchAll } from './tools/search.js';
import { crawlWebsite } from './tools/firecrawl.js';
import { processData } from './tools/dataProcessor.js';
import { StateManager } from './utils/state.js';

async function researchTopic(topic: string, maxSources: number = 10) {
  const taskId = `research-${topic.replace(/\s+/g, '-')}`;

  // Check if already researched
  const existing = await StateManager.load(taskId);
  if (existing) return existing;

  // 1. Search for sources
  const searchResults = await searchAll(topic, maxSources);

  // 2. Scrape top sources in parallel
  const sources = await Promise.all(
    searchResults.slice(0, 5).map(async (result) => {
      const scrapeResult = await scrapeUrl(result.url, {
        formats: ['markdown'],
        onlyMainContent: true
      });

      return {
        url: result.url,
        title: result.title,
        content: scrapeResult.data?.markdown || '',
        relevance: result.relevanceScore
      };
    })
  );

  // 3. Extract key information (in-environment)
  const insights = sources.map(source => ({
    url: source.url,
    title: source.title,
    keyPoints: extractKeyPoints(source.content),
    citations: extractCitations(source.content),
    wordCount: source.content.split(/\s+/).length
  }));

  // 4. Save research
  await StateManager.save(taskId, insights, {
    description: `Research on: ${topic}`,
    dataType: 'research-summary'
  });

  return insights;
}

function extractKeyPoints(content: string): string[] {
  // Extract sentences with key indicators
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const keyIndicators = ['important', 'key', 'critical', 'essential', 'must', 'should'];

  return sentences
    .filter(s => keyIndicators.some(indicator => s.toLowerCase().includes(indicator)))
    .slice(0, 5);
}

function extractCitations(content: string): string[] {
  // Extract cited sources, DOIs, etc.
  const doiPattern = /10\.\d{4,}\/[^\s]+/g;
  const urlPattern = /https?:\/\/[^\s)]+/g;

  return [
    ...(content.match(doiPattern) || []),
    ...(content.match(urlPattern) || [])
  ].slice(0, 10);
}
```

---

## State Management

### Example 8: Long-Running Data Pipeline

**Goal**: Process large dataset with checkpointing.

```typescript
import { StateManager } from './utils/state.js';
import { processData } from './tools/dataProcessor.js';

async function processLargeDataset(
  dataSource: string,
  chunkSize: number = 1000
) {
  const taskId = 'large-dataset-processing';

  // Check for existing progress
  const progress = await StateManager.load<{
    processedCount: number;
    results: any[];
  }>(`${taskId}-progress`);

  let processedCount = progress?.processedCount || 0;
  let allResults = progress?.results || [];

  while (true) {
    // Fetch next chunk
    const chunk = await fetchDataChunk(dataSource, processedCount, chunkSize);

    if (chunk.length === 0) break;

    // Process chunk
    const processed = processData(chunk, {
      filters: [
        { field: 'status', operator: 'eq', value: 'active' }
      ],
      limit: chunkSize
    });

    allResults.push(...processed);
    processedCount += chunk.length;

    // Save progress (state persistence)
    await StateManager.save(`${taskId}-progress`, {
      processedCount,
      results: allResults
    });

    console.log(`Processed ${processedCount} records...`);
  }

  // Save final results
  await StateManager.save(taskId, allResults);

  return allResults;
}

async function fetchDataChunk(
  source: string,
  offset: number,
  limit: number
): Promise<any[]> {
  // Mock implementation - replace with actual data source
  return [];
}
```

---

## Performance Optimization

### Example 9: Caching Strategy

**Goal**: Implement intelligent caching for repeated queries.

```typescript
import { StateManager } from './utils/state.js';
import { scrapeUrl } from './tools/firecrawl.js';

class CachedScraper {
  private cacheTimeout = 60 * 60 * 1000; // 1 hour

  async scrape(url: string, options: any = {}) {
    const cacheKey = this.getCacheKey(url, options);

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log('Cache hit:', url);
      return cached;
    }

    // Scrape and cache
    console.log('Cache miss, scraping:', url);
    const result = await scrapeUrl(url, options);

    await this.saveToCache(cacheKey, result);

    return result;
  }

  private getCacheKey(url: string, options: any): string {
    return `cache-${url}-${JSON.stringify(options)}`.replace(/[^a-zA-Z0-9-]/g, '_');
  }

  private async getFromCache(key: string) {
    const metadata = await StateManager.getMetadata(key);

    if (!metadata) return null;

    // Check if cache is still valid
    if (Date.now() - metadata.timestamp > this.cacheTimeout) {
      return null;
    }

    return StateManager.load(key);
  }

  private async saveToCache(key: string, data: any) {
    await StateManager.save(key, data, {
      description: 'Cached scrape result'
    });
  }
}

// Usage
const cachedScraper = new CachedScraper();
const result1 = await cachedScraper.scrape('https://example.com'); // Cache miss
const result2 = await cachedScraper.scrape('https://example.com'); // Cache hit!
```

---

### Example 10: Parallel Processing with Rate Limiting

**Goal**: Process multiple items with rate limiting.

```typescript
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    rateLimit?: number; // requests per second
  } = {}
): Promise<R[]> {
  const {
    concurrency = 5,
    rateLimit = 10
  } = options;

  const results: R[] = [];
  const delayBetweenRequests = 1000 / rateLimit;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        // Rate limiting delay
        await new Promise(resolve =>
          setTimeout(resolve, index * delayBetweenRequests)
        );

        return processor(item);
      })
    );

    results.push(...batchResults);

    console.log(`Processed ${results.length}/${items.length} items`);
  }

  return results;
}

// Usage: Scrape 100 URLs with rate limiting
const urls = [...]; // 100 URLs

const results = await processBatch(
  urls,
  url => scrapeUrl(url),
  {
    concurrency: 5,
    rateLimit: 10 // max 10 requests/second
  }
);
```

---

## Next Steps

- Review [Integration Guide](./INTEGRATION_GUIDE.md)
- Read [Best Practices](./BEST_PRACTICES.md)
- Explore [Skill Documentation](../skills/)
