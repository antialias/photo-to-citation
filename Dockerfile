# Multi-stage build for Photo To Citation Next.js app

# Install dependencies only, no dev dependencies after build
FROM node:20-bookworm AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack install -g pnpm@9.15.4 \
    && pnpm install --frozen-lockfile

# Build the application
FROM node:20-bookworm AS builder
WORKDIR /app
RUN corepack install -g pnpm@9.15.4
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_APP_VERSION=""
ARG NEXT_PUBLIC_APP_COMMIT=""
ARG NEXT_PUBLIC_DEPLOY_TIME=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_COMMIT=$NEXT_PUBLIC_APP_COMMIT
ENV NEXT_PUBLIC_DEPLOY_TIME=$NEXT_PUBLIC_DEPLOY_TIME
RUN pnpm run build && pnpm prune --prod

# Runtime image
FROM node:20-bookworm AS runner
WORKDIR /app
RUN corepack install -g pnpm@9.15.4
ENV NODE_ENV=production
ENV PORT=3000
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_APP_VERSION=""
ARG NEXT_PUBLIC_APP_COMMIT=""
ARG NEXT_PUBLIC_DEPLOY_TIME=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_COMMIT=$NEXT_PUBLIC_APP_COMMIT
ENV NEXT_PUBLIC_DEPLOY_TIME=$NEXT_PUBLIC_DEPLOY_TIME
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.generated.json ./tsconfig.generated.json
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/public ./public
COPY --from=builder /app/forms ./forms
COPY --from=builder /app/dist/jobs ./dist/jobs
COPY --from=builder /app/src/lib ./src/lib
EXPOSE 3000
CMD ["pnpm", "start"]
