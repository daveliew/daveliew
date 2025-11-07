# Firecrawl Web Scraping Skill

## Overview

Efficient web scraping using Firecrawl API with in-environment processing and state persistence.

## Purpose

- Scrape web content with minimal token usage
- Extract specific data (links, emails, images) locally
- Crawl multiple pages with state persistence
- Process large datasets in-environment before returning to model

## Prerequisites

- Firecrawl API key (get from [firecrawl.dev](https://firecrawl.dev))
- Set `FIRECRAWL_API_KEY` environment variable

## Usage Patterns

### 1. Simple URL Scraping

```typescript
import { scrapeUrl } from './tools/firecrawl';

const result = await scrapeUrl('https://example.com', {
  formats: ['markdown'],
  onlyMainContent: true
});

console.log(result.data?.markdown);
```

**Token Impact**: Returns only requested formats (~1-2k tokens vs full HTML ~50k tokens)

### 2. Multi-Page Crawling

```typescript
import { crawlWebsite } from './tools/firecrawl';

const crawlResult = await crawlWebsite('https://blog.example.com', {
  maxPages: 100,
  allowedDomains: ['blog.example.com'],
  taskId: 'blog-crawl-2024'
});

// Result is automatically filtered and saved to .data/blog-crawl-2024.json
console.log(`Crawled ${crawlResult.filteredCount} pages`);
```

**Token Impact**:
- Before: 100 pages × 10k tokens = 1M tokens
- After: Top 10 relevant pages × 1k tokens = 10k tokens
- Reduction: 99%

### 3. Data Extraction

```typescript
import { firecrawl } from './tools/firecrawl';

// Extract all links from a page
const links = await firecrawl.extractData('https://example.com', {
  links: true
});

// Extract emails
const emails = await firecrawl.extractData('https://example.com', {
  emails: true
});

// Custom pattern extraction
const phoneNumbers = await firecrawl.extractData('https://example.com', {
  customPattern: /\d{3}-\d{3}-\d{4}/g
});
```

**Token Impact**: Returns only extracted data, not full page content

### 4. Resumable Long-Running Jobs

```typescript
// Start a large crawl
const result = await crawlWebsite('https://docs.example.com', {
  maxPages: 1000,
  taskId: 'docs-crawl'
});

// Later, resume from saved state
import { StateManager } from './utils/state';
const savedResult = await StateManager.load('docs-crawl');
```

## In-Environment Processing Examples

### Example 1: Filter Crawled Pages

```typescript
// Crawl returns only pages matching criteria (processed locally)
const result = await crawlWebsite('https://example.com', {
  maxPages: 100,
  allowedDomains: ['example.com'],
  // Internal filtering removes:
  // - Empty pages (< 100 chars)
  // - Error pages
  // - Pages from excluded domains
});
```

### Example 2: Extract Specific Information

```typescript
// OLD: Return all content, model extracts emails (high token cost)
const page = await scrapeUrl('https://example.com');
// Model: "Extract emails from this content..." (processes 50k tokens)

// NEW: Extract emails in-environment (low token cost)
const emails = await extractEmails('https://example.com');
// Returns: ["contact@example.com", "support@example.com"] (minimal tokens)
```

## State Persistence

All crawl operations support automatic state persistence:

```typescript
// Crawl saves state automatically
await crawlWebsite('https://example.com', {
  taskId: 'my-crawl'
});

// Check if state exists
const exists = await StateManager.exists('my-crawl');

// Load state
const data = await StateManager.load('my-crawl');

// Get metadata without loading full data
const metadata = await StateManager.getMetadata('my-crawl');
```

State files are saved in `.data/` directory as JSON.

## Error Handling

```typescript
const result = await scrapeUrl('https://example.com');

if (!result.success) {
  console.error('Scrape failed:', result.error);
  // Handle error
} else {
  // Process result.data
}
```

## Performance Tips

1. **Use `onlyMainContent: true`**: Removes navigation, footer, ads (50-70% token reduction)
2. **Specify formats**: Only request formats you need (markdown vs html vs all)
3. **Set `maxPages` appropriately**: Don't crawl more than necessary
4. **Use state persistence**: For large crawls, save progress
5. **Filter in-environment**: Process data locally before returning

## Token Savings Examples

| Operation | Traditional | Efficient | Savings |
|-----------|-------------|-----------|---------|
| Scrape 1 page | 50k tokens | 2k tokens | 96% |
| Crawl 100 pages | 5M tokens | 20k tokens | 99.6% |
| Extract links | 50k tokens | 500 tokens | 99% |

## Common Patterns

### Blog Content Extraction

```typescript
const posts = await crawlWebsite('https://blog.example.com', {
  maxPages: 50,
  allowedDomains: ['blog.example.com']
});

// Process posts in-environment
const recentPosts = posts.pages
  .filter(p => p.metadata?.date > '2024-01-01')
  .slice(0, 5);
```

### Documentation Scraping

```typescript
const docs = await crawlWebsite('https://docs.example.com', {
  maxPages: 200,
  allowedDomains: ['docs.example.com'],
  taskId: 'docs-snapshot'
});

// Build search index locally
const searchIndex = buildSearchIndex(docs.pages);
```

### Contact Information Extraction

```typescript
const emails = await extractEmails('https://example.com/contact');
const links = await extractLinks('https://example.com/team');
```

## Integration with Other Tools

### Combine with Data Processing

```typescript
import { processData } from './tools/dataProcessor';

// Crawl and process
const crawlResult = await crawlWebsite('https://example.com');

const processed = processData(crawlResult.pages, {
  filters: [
    { field: 'content', operator: 'contains', value: 'TypeScript' }
  ],
  limit: 10
});
```

## Troubleshooting

### Issue: API Rate Limits

```typescript
// Add delays between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await scrapeUrl(url);
await delay(1000);
```

### Issue: Large Memory Usage

Use state persistence for large crawls:

```typescript
// Save intermediate results
await crawlWebsite(url, {
  maxPages: 1000,
  taskId: 'large-crawl' // Automatically saves to disk
});
```

## Best Practices

1. Always set a `taskId` for crawls > 10 pages
2. Use `allowedDomains` to prevent off-site crawling
3. Process data in-environment before returning
4. Handle errors gracefully
5. Use appropriate `maxPages` limits
6. Consider privacy - don't send sensitive data to model context

## See Also

- [Data Processing Skill](./data-processing.md)
- [State Management](../docs/STATE_MANAGEMENT.md)
- [Firecrawl API Documentation](https://docs.firecrawl.dev)
