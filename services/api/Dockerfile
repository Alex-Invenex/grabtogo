# Multi-stage build for API service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Development stage
FROM base AS dev
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl curl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl curl dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs api

# Copy built application
COPY --from=builder --chown=api:nodejs /app/dist ./dist
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/package*.json ./
COPY --from=builder --chown=api:nodejs /app/prisma ./prisma

# Create required directories
RUN mkdir -p /var/log/grabtogo /app/uploads && \
    chown -R api:nodejs /var/log/grabtogo /app/uploads

# Switch to app user
USER api

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/server.js"]