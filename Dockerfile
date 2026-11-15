# ==========================================
# Multi-Stage Dockerfile for English Speaking App
# ==========================================

# 1. Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci || npm install

COPY client/ ./
RUN npm run build

# 2. Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci || npm install

COPY server/ ./
RUN npm run build

# 3. Production Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_URL=*

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend into public directory for Express to serve
COPY --from=client-builder /app/client/dist ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
