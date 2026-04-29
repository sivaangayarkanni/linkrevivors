FROM node:20-alpine AS builder

WORKDIR /app

# Copy root files for monorepo
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (no lockfile, so use --no-frozen-lockfile)
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copy all source code
COPY . .

# Generate Prisma client and build
RUN pnpm --filter api prisma generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy shared package
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
