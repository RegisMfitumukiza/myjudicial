# ============================================
# MyJudicial Backend Dockerfile
# Node.js 20 + Prisma + Express
# ============================================

# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (sharp, bcryptjs)
RUN apk add --no-cache python3 make g++

# Copy package files first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build TypeScript (build script includes prisma generate)
RUN npm run build

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies (dumb-init for signal handling, curl for healthcheck)
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for production install
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and generated Prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

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
