# Base image with Node.js
FROM node:20-slim AS base

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM deps AS builder
COPY . .
# We need to build the Next.js app
RUN npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# CACHE BUST: 2026-02-09-20:03 - Force rebuild to clear Python package
# Install notebooklm-mcp (Node.js version) globally
# This version supports NOTEBOOKLM_COOKIES environment variable
RUN npm install -g notebooklm-mcp && \
    # Create a wrapper script that will call the correct package
    echo '#!/bin/sh' > /usr/local/bin/notebooklm-mcp-wrapper && \
    echo 'exec node $(npm root -g)/notebooklm-mcp/dist/index.js "$@"' >> /usr/local/bin/notebooklm-mcp-wrapper && \
    chmod +x /usr/local/bin/notebooklm-mcp-wrapper

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start command: runs Next.js server
CMD ["npm", "start"]
