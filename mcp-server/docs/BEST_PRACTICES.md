# Best Practices for Efficient MCP Development

Guidelines based on Anthropic's efficiency patterns and real-world experience.

## Core Principles

### 1. Code-as-API Pattern

**DO**: Expose tools as importable modules
```typescript
// ✅ Good: Direct function import
import { scrapeUrl } from './tools/firecrawl';
const result = await scrapeUrl('https://example.com');
```

**DON'T**: Rely solely on tool calls
```typescript
// ❌ Avoid: Traditional tool call (higher latency)
await tool_call('firecrawl_scrape', { url: 'https://example.com' });
```

**Why**: Direct imports reduce token usage by ~98% and eliminate tool call overhead.

---

### 2. In-Environment Processing

**DO**: Filter/aggregate data locally before returning
```typescript
// ✅ Good: Process 10k rows → return 5
const filtered = processData(largeDataset, {
  filters: [{ field: 'score', operator: 'gt', value: 90 }],
  limit: 5
});
// Returns 5 rows (~500 tokens)
```

**DON'T**: Pass raw data to model
```typescript
// ❌ Avoid: Return all 10k rows
return largeDataset; // ~1M tokens!
```

**Why**: Processing locally reduces token usage by 99.9% for large datasets.

---

### 3. Progressive Tool Discovery

**DO**: Load tools lazily when needed
```typescript
// ✅ Good: Lazy loading
const module = await toolRegistry.loadTool('firecrawl_scrape');
// Tool code loaded only when needed
```

**DON'T**: Load all tools upfront
```typescript
// ❌ Avoid: Importing everything
import * as tools from './tools';
// All ~50k tokens loaded into context
```

**Why**: Lazy loading reduces initial context from 150k to 2k tokens.

---

### 4. State Persistence

**DO**: Save intermediate results for long tasks
```typescript
// ✅ Good: Save progress
await StateManager.save('large-task', intermediateResults);
// Can resume later
```

**DON'T**: Keep everything in memory
```typescript
// ❌ Avoid: Hold large datasets in memory
let hugeArray = []; // Out of memory!
```

**Why**: State persistence enables resumability and reduces memory usage.

---

### 5. Native Control Flow

**DO**: Use loops and conditionals
```typescript
// ✅ Good: Native loop
for (const item of items) {
  if (item.score > 90) {
    await processItem(item);
  }
}
```

**DON'T**: Chain tool calls
```typescript
// ❌ Avoid: Multiple tool calls in sequence
await tool('filter', items);
await tool('process', filtered);
await tool('save', processed);
```

**Why**: Native control flow is 50% faster and uses fewer tokens.

---

## Data Processing Best Practices

### Always Set Limits

```typescript
// ✅ Always limit results
processData(data, { limit: 10 });

// ❌ Never return unlimited data
processData(data);
```

### Filter Early

```typescript
// ✅ Filter before sort/aggregate
processData(data, {
  filters: [...],    // First
  sort: {...},       // Second
  aggregate: {...},  // Third
  limit: 10         // Last
});

// ❌ Don't process everything
const sorted = sort(data);  // Processes all rows
const filtered = filter(sorted);  // Too late!
```

### Use Appropriate Aggregations

```typescript
// ✅ Aggregate to reduce data
aggregateData(sales, {
  groupBy: 'region',
  aggregations: [
    { field: 'revenue', operation: 'sum' }
  ]
});
// Returns summary (10 regions vs 10k sales)

// ❌ Return all details
return sales;  // 10k rows
```

---

## Web Scraping Best Practices

### Extract Only What You Need

```typescript
// ✅ Specify formats
await scrapeUrl(url, {
  formats: ['markdown'],  // Only markdown
  onlyMainContent: true   // Skip navigation, footer
});

// ❌ Extract everything
await scrapeUrl(url, {
  formats: ['markdown', 'html', 'rawHtml', 'links', 'screenshot']
});
```

### Use Crawl Limits

```typescript
// ✅ Set reasonable limits
await crawlWebsite(url, {
  maxPages: 10,
  allowedDomains: ['example.com']
});

// ❌ Unlimited crawling
await crawlWebsite(url);  // Might crawl thousands of pages!
```

### Persist Large Crawls

```typescript
// ✅ Save state for large jobs
await crawlWebsite(url, {
  maxPages: 1000,
  taskId: 'my-crawl'  // Saves automatically
});

// ❌ Hold in memory
const pages = await crawlWebsite(url, { maxPages: 1000 });
```

---

## Performance Optimization

### Use Parallel Processing

```typescript
// ✅ Process in parallel
const results = await Promise.all(
  urls.map(url => scrapeUrl(url))
);

// ❌ Sequential processing
for (const url of urls) {
  await scrapeUrl(url);  // Slow!
}
```

### Implement Caching

```typescript
// ✅ Cache frequently accessed data
const cached = await StateManager.load(cacheKey);
if (cached) return cached;

const fresh = await fetchData();
await StateManager.save(cacheKey, fresh);

// ❌ Fetch every time
return await fetchData();
```

### Rate Limit External APIs

```typescript
// ✅ Add delays
for (const url of urls) {
  await scrapeUrl(url);
  await delay(100);  // 100ms between requests
}

// ❌ Hammer the API
await Promise.all(urls.map(url => scrapeUrl(url)));
```

---

## Error Handling

### Always Handle Errors

```typescript
// ✅ Proper error handling
try {
  const result = await scrapeUrl(url);
  if (!result.success) {
    logger.error('Scrape failed:', result.error);
    return defaultValue;
  }
  return result.data;
} catch (error) {
  logger.error('Unexpected error:', error);
  return defaultValue;
}

// ❌ No error handling
const result = await scrapeUrl(url);
return result.data;  // Might crash!
```

### Validate Inputs

```typescript
// ✅ Validate inputs
function scrapeUrl(url: string) {
  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL');
  }
  // ...
}

// ❌ Assume valid inputs
function scrapeUrl(url: string) {
  return fetch(url);  // Might fail silently
}
```

### Provide Fallbacks

```typescript
// ✅ Fallback values
const data = await StateManager.load(key) || defaultValue;

// ❌ No fallback
const data = await StateManager.load(key);
// Might be null!
```

---

## Privacy and Security

### Process Sensitive Data Locally

```typescript
// ✅ Filter PII before returning
const users = processData(allUsers, {
  transform: user => ({
    id: user.id,
    // email: user.email,  ← Excluded
    totalSpend: user.totalSpend
  })
});

// ❌ Return PII
return allUsers;  // Includes emails, SSNs, etc.
```

### Use Environment Variables

```typescript
// ✅ Environment variables
const apiKey = process.env.FIRECRAWL_API_KEY;

// ❌ Hardcoded secrets
const apiKey = 'sk-1234567890';  // Never!
```

### Validate URLs

```typescript
// ✅ Validate and sanitize
function scrapeUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS allowed');
  }
  // ...
}

// ❌ Accept any URL
function scrapeUrl(url: string) {
  return fetch(url);
}
```

---

## Testing

### Write Integration Tests

```typescript
// ✅ Test real scenarios
it('should scrape and filter data', async () => {
  const result = await scrapeUrl('https://example.com');
  expect(result.success).toBe(true);

  const filtered = processData([result.data], {
    filters: [{ field: 'content', operator: 'contains', value: 'test' }]
  });
  expect(filtered.length).toBeGreaterThan(0);
});
```

### Mock External APIs

```typescript
// ✅ Mock in tests
vi.mock('./tools/firecrawl', () => ({
  scrapeUrl: vi.fn(() => Promise.resolve({
    success: true,
    data: { markdown: 'test content' }
  }))
}));

// ❌ Hit real APIs in tests
// Tests will be slow and flaky!
```

### Test Error Cases

```typescript
// ✅ Test error handling
it('should handle scrape failures', async () => {
  const result = await scrapeUrl('https://invalid-url');
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

---

## Documentation

### Document Token Impact

```typescript
/**
 * Scrape URL with minimal token usage
 *
 * Token impact:
 * - Full HTML: ~50k tokens
 * - Markdown only: ~2k tokens (96% reduction)
 *
 * @param url - URL to scrape
 * @param options - Scrape options
 */
async function scrapeUrl(url: string, options?: ScrapeOptions) {
  // ...
}
```

### Provide Examples

```typescript
/**
 * Process data with filters
 *
 * @example
 * ```ts
 * const filtered = processData(data, {
 *   filters: [{ field: 'price', operator: 'gt', value: 100 }],
 *   limit: 10
 * });
 * ```
 */
function processData(data: any[], options: ProcessOptions) {
  // ...
}
```

### Explain Trade-offs

```typescript
/**
 * Crawl website
 *
 * Trade-offs:
 * - More pages = better coverage, but higher cost
 * - Fewer pages = lower cost, but might miss content
 *
 * Recommendation: Start with maxPages: 10, increase if needed
 */
async function crawlWebsite(url: string, options: CrawlOptions) {
  // ...
}
```

---

## Monitoring and Logging

### Use Appropriate Log Levels

```typescript
// ✅ Appropriate levels
logger.debug('Processing item:', item);  // Development only
logger.info('Task completed');           // Production info
logger.warn('API rate limit approaching');  // Warnings
logger.error('Failed to process:', error);  // Errors

// ❌ Wrong levels
logger.info('Debug info:', debugData);  // Too verbose
logger.error('Task completed');  // Not an error!
```

### Track Performance

```typescript
// ✅ Track metrics
const start = Date.now();
const result = await processData(data);
const duration = Date.now() - start;
logger.info(`Processed ${data.length} items in ${duration}ms`);

// ❌ No metrics
await processData(data);
```

### Monitor Token Usage

```typescript
// ✅ Estimate token usage
const tokenEstimate = JSON.stringify(result).length / 4;
logger.info(`Response size: ~${tokenEstimate} tokens`);

// ❌ No token tracking
return result;
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not Setting Limits

```typescript
// This can return 1M tokens!
const allData = await crawlWebsite(url);
```

**Solution**: Always set limits
```typescript
const data = await crawlWebsite(url, { maxPages: 10 });
```

---

### ❌ Pitfall 2: Processing in Model Context

```typescript
// Model processes 10k rows (expensive!)
"Here are 10k rows of data. Find the top 10."
```

**Solution**: Process locally
```typescript
const top10 = processData(data, { limit: 10 });
// Model only sees 10 rows
```

---

### ❌ Pitfall 3: No Error Handling

```typescript
const result = await scrapeUrl(url);
return result.data;  // Crashes if scrape failed!
```

**Solution**: Handle errors
```typescript
const result = await scrapeUrl(url);
if (!result.success) return null;
return result.data;
```

---

### ❌ Pitfall 4: Synchronous Processing

```typescript
for (const url of urls) {
  await scrapeUrl(url);  // Slow!
}
```

**Solution**: Process in parallel
```typescript
await Promise.all(urls.map(url => scrapeUrl(url)));
```

---

### ❌ Pitfall 5: No Caching

```typescript
// Scrapes same URL multiple times
await scrapeUrl('https://example.com');
await scrapeUrl('https://example.com');
```

**Solution**: Implement caching
```typescript
const cached = await getFromCache(url);
if (cached) return cached;
const result = await scrapeUrl(url);
await saveToCache(url, result);
```

---

## Checklist for New Tools

When creating a new tool, ensure:

- [ ] Implements Code-as-API pattern (exported functions)
- [ ] Uses in-environment processing (filters, limits)
- [ ] Supports state persistence (for large operations)
- [ ] Has proper error handling
- [ ] Includes TypeScript types
- [ ] Has usage examples
- [ ] Documents token impact
- [ ] Includes tests
- [ ] Validates inputs
- [ ] Logs appropriately
- [ ] Handles privacy (no PII in results)
- [ ] Sets reasonable defaults
- [ ] Uses native control flow
- [ ] Supports caching (if applicable)

---

## Performance Targets

Based on Anthropic's guidelines:

| Metric | Target | Method |
|--------|--------|--------|
| Token reduction | 95%+ | In-environment processing |
| Latency reduction | 50%+ | Native control flow |
| Context window | <5k tokens | Progressive discovery |
| Cache hit rate | 80%+ | Smart caching |
| Error rate | <1% | Proper error handling |

---

## Resources

- [Anthropic's MCP Guide](https://www.anthropic.com/news/model-context-protocol)
- [MCP Documentation](https://modelcontextprotocol.io)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## Getting Help

If you're unsure about a pattern:

1. Check the [examples](./EXAMPLES.md)
2. Review [skill documentation](../skills/)
3. Ask in GitHub discussions
4. File an issue

Remember: **When in doubt, optimize for token reduction first!**
