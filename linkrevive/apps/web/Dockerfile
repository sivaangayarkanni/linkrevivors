FROM node:20-alpine AS builder

WORKDIR /app

# Copy root files for monorepo
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copy all source code
COPY . .

# Build the web app
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
