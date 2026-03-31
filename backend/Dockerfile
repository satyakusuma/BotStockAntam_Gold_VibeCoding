# ─────────────────────────────────────────────
# Stage 1 — Install all dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ─────────────────────────────────────────────
# Stage 2 — Generate Prisma client
# ─────────────────────────────────────────────
FROM node:20-alpine AS prisma_gen
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# ─────────────────────────────────────────────
# Stage 3 — Production runtime
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Proper signal handling
RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Production node_modules
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Prisma client (generated)
COPY --from=prisma_gen --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# App source
COPY --chown=nodejs:nodejs prisma   ./prisma
COPY --chown=nodejs:nodejs src      ./src
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs entrypoint.sh ./entrypoint.sh

# Ensure LF line endings and executable bit
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

USER nodejs

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--", "/bin/sh", "entrypoint.sh"]
