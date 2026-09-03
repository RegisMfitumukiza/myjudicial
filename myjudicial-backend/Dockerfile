# ============================================
# MyJudicial Backend Dockerfile
# Node.js 20 + Prisma + Express
# ============================================

# --- Build stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Generate the Prisma client AFTER the source copy so any stale generated
# client present in the build context (e.g. leftover src/generated/ on a
# machine that previously built locally) can NEVER shadow the fresh one.
# This is the last write to src/generated/ before tsc, so it always matches
# the schema snapshot being compiled.
RUN npx prisma generate

# Build TypeScript only
RUN npx tsc

# --- Production stage ---
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies (dumb-init for signal handling, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init curl openssl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 nodejs

# Copy package files for production install
COPY package*.json ./
COPY prisma ./prisma/
# Prisma 7 keeps no url in schema.prisma (datasource block) — the URL is
# resolved from env via prisma.config.ts, required for migrate/stuate commands
# at deploy time.
# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
# (Prisma client is pre-generated and compiled into dist/generated/prisma/)
COPY --from=builder /app/dist ./dist

# Create logs and uploads directories
RUN mkdir -p /app/logs /app/uploads

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/interfaces/http/server.js"]
