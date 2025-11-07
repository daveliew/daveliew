# Integration Guide

Complete guide for integrating the Efficient MCP Server with various clients.

## Table of Contents

1. [Claude Desktop Integration](#claude-desktop-integration)
2. [Cursor IDE Integration](#cursor-ide-integration)
3. [Custom Client Integration](#custom-client-integration)
4. [Docker Deployment](#docker-deployment)
5. [Testing and Validation](#testing-and-validation)

---

## Claude Desktop Integration

### Step 1: Build the Server

```bash
cd mcp-server
npm install
npm run build
```

### Step 2: Configure Claude Desktop

Locate your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the server configuration:

```json
{
  "mcpServers": {
    "efficient-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "FIRECRAWL_API_KEY": "your_api_key_here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop. The server should automatically connect.

### Step 4: Verify Connection

In Claude Desktop, type:
```
Can you list the available MCP tools?
```

You should see:
- `firecrawl_scrape`
- `firecrawl_crawl`
- `process_data`
- `search`

### Example Usage in Claude Desktop

```
Please scrape https://example.com and extract all the links.
```

Claude will use the `firecrawl_scrape` tool behind the scenes.

---

## Cursor IDE Integration

### Step 1: Install as MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### Step 2: Configure Cursor

Create or edit `.cursorrules` in your project:

```json
{
  "mcp": {
    "servers": [
      {
        "name": "efficient-mcp",
        "command": "node",
        "args": ["/absolute/path/to/mcp-server/dist/index.js"],
        "env": {
          "FIRECRAWL_API_KEY": "your_api_key_here"
        }
      }
    ]
  }
}
```

### Step 3: Use in Agent Mode

```bash
cursor --agent
```

### Example Usage in Cursor

In the AI chat:
```
@efficient-mcp scrape https://example.com and extract the main content
```

---

## Custom Client Integration

### Using the MCP SDK

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Create client
const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

// Connect to server
const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/mcp-server/dist/index.js'],
  env: {
    FIRECRAWL_API_KEY: 'your_api_key'
  }
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool({
  name: 'firecrawl_scrape',
  arguments: {
    url: 'https://example.com',
    formats: ['markdown']
  }
});

console.log('Result:', result);
```

### Direct Module Usage (Code-as-API)

For maximum efficiency, import modules directly:

```typescript
// Instead of MCP tool calls
import { scrapeUrl, crawlWebsite } from './mcp-server/src/tools/firecrawl.js';
import { processData } from './mcp-server/src/tools/dataProcessor.js';

// Use directly in your code
const content = await scrapeUrl('https://example.com');
const filtered = processData(data, {
  filters: [{ field: 'price', operator: 'gt', value: 100 }],
  limit: 10
});
```

---

## Docker Deployment

### Development Mode

```bash
cd mcp-server
docker-compose up mcp-server-dev
```

This starts the server with:
- Hot reload enabled
- Debug logging
- Source code mounted

### Production Mode

```bash
cd mcp-server

# Build production image
docker-compose build mcp-server

# Run in production
docker-compose up -d mcp-server
```

### Environment Configuration

Create `.env` file:

```bash
FIRECRAWL_API_KEY=your_api_key_here
LOG_LEVEL=info
NODE_ENV=production
```

### Connecting to Dockerized Server

When using Docker, update your client config:

```json
{
  "mcpServers": {
    "efficient-mcp": {
      "command": "docker",
      "args": [
        "compose",
        "-f", "/path/to/mcp-server/docker-compose.yml",
        "run", "--rm", "mcp-server"
      ]
    }
  }
}
```

---

## Testing and Validation

### Using MCP Inspector

```bash
cd mcp-server
npm run build
npm run inspector
```

This opens an interactive inspector where you can:
1. List available tools
2. Test tool calls
3. View request/response logs
4. Validate tool schemas

### Manual Testing

Create a test script:

```typescript
// test.ts
import { scrapeUrl } from './src/tools/firecrawl.js';

async function test() {
  const result = await scrapeUrl('https://example.com', {
    formats: ['markdown'],
    onlyMainContent: true
  });

  console.log('Success:', result.success);
  console.log('Content length:', result.data?.markdown?.length);
}

test().catch(console.error);
```

Run:
```bash
npx tsx test.ts
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { describe, it, expect } from 'vitest';
import { scrapeUrl, crawlWebsite } from '../src/tools/firecrawl.js';

describe('Firecrawl Integration', () => {
  it('should scrape a URL successfully', async () => {
    const result = await scrapeUrl('https://example.com');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should crawl multiple pages', async () => {
    const result = await crawlWebsite('https://example.com', {
      maxPages: 5
    });
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.pages.length).toBeLessThanOrEqual(5);
  });
});
```

Run tests:
```bash
npm test
```

---

## Troubleshooting

### Server Not Connecting

1. **Check server is built**:
   ```bash
   npm run build
   ls dist/index.js  # Should exist
   ```

2. **Test server directly**:
   ```bash
   node dist/index.js
   ```
   Should start without errors.

3. **Check logs**:
   - Claude Desktop: View Developer Tools console
   - Docker: `docker-compose logs -f`

### API Errors

1. **Verify API key**:
   ```bash
   echo $FIRECRAWL_API_KEY
   ```

2. **Test API directly**:
   ```bash
   curl https://api.firecrawl.dev/v1/scrape \
     -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com"}'
   ```

### High Token Usage

If you're experiencing high token usage:

1. **Use limits**: Always set `limit` parameter
   ```typescript
   processData(data, { limit: 10 })
   ```

2. **Filter early**: Apply filters before returning data
   ```typescript
   processData(data, {
     filters: [...],
     limit: 10
   })
   ```

3. **Use state persistence**: For large datasets
   ```typescript
   crawlWebsite(url, {
     taskId: 'my-task',
     maxPages: 100
   })
   ```

---

## Performance Optimization

### 1. Enable Caching

For repeated queries, implement caching:

```typescript
import { StateManager } from './utils/state.js';

async function cachedScrape(url: string) {
  const cacheKey = `scrape-${url}`;
  const cached = await StateManager.load(cacheKey);

  if (cached) return cached;

  const result = await scrapeUrl(url);
  await StateManager.save(cacheKey, result);

  return result;
}
```

### 2. Parallel Processing

Process multiple items in parallel:

```typescript
const urls = ['https://example1.com', 'https://example2.com'];

const results = await Promise.all(
  urls.map(url => scrapeUrl(url))
);
```

### 3. Batch Operations

Combine multiple operations:

```typescript
// Instead of multiple calls
const crawlResult = await crawlWebsite(url);
const processed = processData(crawlResult.pages, {
  filters: [...],
  limit: 10
});
```

---

## Advanced Configuration

### Custom Tool Registry

Add your own tools:

```typescript
import { toolRegistry } from './core/toolRegistry.js';

toolRegistry.register({
  name: 'my_custom_tool',
  description: 'My custom tool',
  category: 'custom',
  module: './tools/custom.js',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  }
});
```

### Environment-Specific Configuration

```typescript
// config/development.json
{
  "logLevel": "debug",
  "firecrawl": {
    "timeout": 60000
  }
}

// config/production.json
{
  "logLevel": "warn",
  "firecrawl": {
    "timeout": 30000
  }
}
```

Load based on environment:

```typescript
const config = await import(`./config/${process.env.NODE_ENV}.json`);
```

---

## Next Steps

- Read the [Skill Documentation](../skills/)
- Explore [Example Workflows](./EXAMPLES.md)
- Review [Best Practices](./BEST_PRACTICES.md)
- Join the community discussions

---

## Support

For issues:
- GitHub Issues: [your-repo/issues](https://github.com/your-repo/issues)
- Documentation: [./docs](./docs)
- MCP Discord: [discord.gg/mcp](https://discord.gg/mcp)
