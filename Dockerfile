FROM node:22-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
COPY package*.json ./
RUN npm ci --ignore-scripts

# Build
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./prisma/dev.db
RUN npx prisma generate
RUN npm run build
RUN node_modules/.bin/esbuild src/worker/index.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --outfile=.next/standalone/worker.js \
  --external:@libsql/client

# Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
