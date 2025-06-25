# Multi-stage build for Photo To Citation Next.js app

# Install dependencies only, no dev dependencies after build
FROM node:20-bookworm AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Build the application
FROM node:20-bookworm AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN npm run build && npm prune --production

# Runtime image
FROM node:20-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/migrations ./migrations
EXPOSE 3000
CMD ["npm", "start"]
