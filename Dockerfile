# Simplified Dockerfile for RAG-Based AI Consultant
# No Python dependencies needed - pure Node.js with fetch API

FROM node:20-slim AS base

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM deps AS builder
COPY . .
RUN npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]
