# Base image with Node.js
FROM node:20-slim AS base

# Install Python dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
# Use npm install instead of clean install to handle potential platform differences
RUN npm install

# ---- Build ----
FROM deps AS builder
COPY . .
# We need to build the Next.js app
RUN npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Update PATH to include virtual environment binaries
ENV PATH="/app/venv/bin:${PATH}"

# CACHE BUST: 2026-02-09-21:10 - Switch to venv install
# Create venv and install notebooklm-mcp-cli
RUN python3 -m venv /app/venv && \
    # Upgrade pip to ensure compatibility
    /app/venv/bin/pip install --upgrade pip && \
    # Install package
    /app/venv/bin/pip install --no-cache-dir notebooklm-mcp-cli && \
    # Create config directory
    mkdir -p /root/.notebooklm-mcp-cli/profiles/default && \
    # Create a script to initialize auth from environment variable
    echo '#!/bin/sh' > /usr/local/bin/init-nlm-auth && \
    echo 'if [ -n "$NOTEBOOKLM_COOKIES" ]; then' >> /usr/local/bin/init-nlm-auth && \
    echo '  mkdir -p /root/.notebooklm-mcp-cli/profiles/default' >> /usr/local/bin/init-nlm-auth && \
    echo '  echo "{\"cookies\": \"$NOTEBOOKLM_COOKIES\"}" > /root/.notebooklm-mcp-cli/profiles/default/auth.json' >> /usr/local/bin/init-nlm-auth && \
    echo 'fi' >> /usr/local/bin/init-nlm-auth && \
    chmod +x /usr/local/bin/init-nlm-auth

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start command: runs Next.js server
CMD ["npm", "start"]
