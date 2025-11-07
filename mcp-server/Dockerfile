# Multi-stage build for efficient MCP server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create data directory for state persistence
RUN mkdir -p .data && chown -R node:node .data

# Use non-root user
USER node

# Expose MCP server (stdio transport - no network port needed)
# The server communicates via stdin/stdout

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Run the server
CMD ["node", "dist/index.js"]
