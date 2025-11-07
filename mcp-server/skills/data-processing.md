# Data Processing Skill

## Overview

In-environment data filtering, sorting, aggregation, and transformation to minimize token usage.

## Purpose

Replace multiple tool calls with native TypeScript processing:
- **Old**: filter_data() → sort_data() → aggregate_data() (3 tool calls, high latency)
- **New**: processData({ filters, sort, aggregate }) (1 function call, native speed)

## Core Concept

Process data **in the execution environment** instead of passing large datasets to the model.

**Example**: Reduce 10,000 rows to 5 relevant rows before returning to model.

## Usage Patterns

### 1. Simple Filtering

```typescript
import { filterData } from './tools/dataProcessor';

const products = [
  { name: 'Laptop', price: 1200, category: 'electronics' },
  { name: 'Phone', price: 800, category: 'electronics' },
  { name: 'Book', price: 20, category: 'books' }
];

const expensive = filterData(products, [
  { field: 'price', operator: 'gt', value: 100 }
]);
// Returns: Laptop, Phone (Books filtered out)
```

**Token Impact**: Returns 2 items instead of 3 (33% reduction)

### 2. Comprehensive Processing Pipeline

```typescript
import { processData } from './tools/dataProcessor';

const result = processData(salesData, {
  filters: [
    { field: 'region', operator: 'eq', value: 'North America' },
    { field: 'revenue', operator: 'gt', value: 10000 }
  ],
  sort: { field: 'revenue', order: 'desc' },
  limit: 10,
  saveAs: 'top-sales-2024'
});
```

**Token Impact**:
- Input: 10,000 rows × 100 tokens = 1M tokens
- Output: 10 rows × 100 tokens = 1k tokens
- Reduction: 99.9%

### 3. Data Aggregation

```typescript
import { aggregateData } from './tools/dataProcessor';

const aggregated = aggregateData(orders, {
  groupBy: 'region',
  aggregations: [
    { field: 'revenue', operation: 'sum', alias: 'total_revenue' },
    { field: 'orders', operation: 'count', alias: 'order_count' },
    { field: 'revenue', operation: 'avg', alias: 'avg_revenue' }
  ]
});

// Returns:
// [
//   { region: 'North America', total_revenue: 150000, order_count: 50, avg_revenue: 3000 },
//   { region: 'Europe', total_revenue: 120000, order_count: 40, avg_revenue: 3000 }
// ]
```

**Token Impact**: Reduces thousands of rows to summary statistics

### 4. Deduplication

```typescript
import { DataProcessor } from './tools/dataProcessor';

const unique = DataProcessor.deduplicate(customers, ['email']);
```

### 5. Custom Transformation

```typescript
import { DataProcessor } from './tools/dataProcessor';

const transformed = DataProcessor.transform(users, (user) => ({
  fullName: `${user.firstName} ${user.lastName}`,
  email: user.email.toLowerCase(),
  isActive: user.lastLogin > Date.now() - 30 * 24 * 60 * 60 * 1000
}));
```

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `gt` | Greater than | `{ field: 'age', operator: 'gt', value: 18 }` |
| `lt` | Less than | `{ field: 'price', operator: 'lt', value: 100 }` |
| `eq` | Equals | `{ field: 'status', operator: 'eq', value: 'active' }` |
| `contains` | String contains | `{ field: 'name', operator: 'contains', value: 'john' }` |
| `startsWith` | String starts with | `{ field: 'email', operator: 'startsWith', value: 'admin' }` |
| `endsWith` | String ends with | `{ field: 'email', operator: 'endsWith', value: '.com' }` |

## Aggregation Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `sum` | Sum of values | Total revenue |
| `avg` | Average of values | Average order value |
| `count` | Count of items | Number of orders |
| `min` | Minimum value | Lowest price |
| `max` | Maximum value | Highest price |

## Real-World Examples

### Example 1: E-commerce Sales Analysis

```typescript
// Process 50,000 orders to find top-selling products
const topProducts = processData(orders, {
  filters: [
    { field: 'date', operator: 'gt', value: '2024-01-01' },
    { field: 'status', operator: 'eq', value: 'completed' }
  ],
  aggregate: {
    groupBy: 'productId',
    aggregations: [
      { field: 'quantity', operation: 'sum', alias: 'total_sold' },
      { field: 'revenue', operation: 'sum', alias: 'total_revenue' }
    ]
  },
  sort: { field: 'total_revenue', order: 'desc' },
  limit: 20,
  saveAs: 'top-products-2024'
});

// Returns only top 20 products instead of all 50,000 orders
```

### Example 2: Customer Segmentation

```typescript
// Segment 100,000 customers by activity
const segments = [
  processData(customers, {
    filters: [
      { field: 'totalSpend', operator: 'gt', value: 1000 },
      { field: 'orderCount', operator: 'gt', value: 10 }
    ],
    limit: 100
  }), // VIP customers

  processData(customers, {
    filters: [
      { field: 'lastOrderDate', operator: 'lt', value: '2024-01-01' }
    ],
    limit: 100
  }) // Inactive customers
];
```

### Example 3: Log Analysis

```typescript
// Analyze 1M log entries
const errors = processData(logEntries, {
  filters: [
    { field: 'level', operator: 'eq', value: 'ERROR' },
    { field: 'timestamp', operator: 'gt', value: Date.now() - 24*60*60*1000 }
  ],
  aggregate: {
    groupBy: 'errorCode',
    aggregations: [
      { field: 'errorCode', operation: 'count', alias: 'occurrences' }
    ]
  },
  sort: { field: 'occurrences', order: 'desc' },
  limit: 10
});

// Returns top 10 errors instead of 1M log entries
```

## State Persistence

Save processed results for later use:

```typescript
const result = processData(largeDataset, {
  filters: [...],
  limit: 100,
  saveAs: 'processed-2024-q1'
});

// Later, load without reprocessing
import { StateManager } from './utils/state';
const saved = await StateManager.load('processed-2024-q1');
```

## Performance Tips

1. **Filter first**: Apply filters before sorting/aggregating
2. **Use limits**: Always set a reasonable limit
3. **Aggregate when possible**: Reduce rows to summary statistics
4. **Save intermediate results**: Use state persistence for large datasets
5. **Chain operations efficiently**: Combine filters instead of multiple calls

## Token Savings

| Scenario | Input Tokens | Output Tokens | Savings |
|----------|--------------|---------------|---------|
| Filter 10k rows → 10 rows | 1M | 1k | 99.9% |
| Aggregate 5k rows → 5 groups | 500k | 500 | 99.9% |
| Deduplicate 1k rows → 500 unique | 100k | 50k | 50% |

## Combining with Other Tools

### With Firecrawl

```typescript
// Crawl and process
const pages = await crawlWebsite('https://example.com', { maxPages: 100 });

const relevant = processData(pages.pages, {
  filters: [
    { field: 'content', operator: 'contains', value: 'TypeScript' }
  ],
  sort: { field: 'metadata.date', order: 'desc' },
  limit: 5
});
```

### With Search

```typescript
// Search and aggregate
const results = await search.query('AI tools');

const byDomain = aggregateData(results, {
  groupBy: 'domain',
  aggregations: [
    { field: 'domain', operation: 'count', alias: 'result_count' }
  ]
});
```

## Best Practices

1. **Process early**: Filter/aggregate as soon as possible
2. **Use native operations**: Leverage TypeScript instead of tool chains
3. **Set limits**: Always limit output size
4. **Save state**: For large processing jobs
5. **Think about tokens**: Every row returned costs tokens

## Common Patterns

### Pattern 1: Top N Analysis

```typescript
const topN = (data, field, n = 10) => processData(data, {
  sort: { field, order: 'desc' },
  limit: n
});
```

### Pattern 2: Date Range Filtering

```typescript
const dateRange = (data, field, start, end) => filterData(data, [
  { field, operator: 'gt', value: start },
  { field, operator: 'lt', value: end }
]);
```

### Pattern 3: Multi-Field Aggregation

```typescript
const summarize = (data, groupBy) => aggregateData(data, {
  groupBy,
  aggregations: [
    { field: 'value', operation: 'sum' },
    { field: 'value', operation: 'avg' },
    { field: 'value', operation: 'count' }
  ]
});
```

## See Also

- [Firecrawl Scraping Skill](./firecrawl-scraping.md)
- [State Management](../docs/STATE_MANAGEMENT.md)
