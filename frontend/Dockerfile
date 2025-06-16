# Base image with Node.js
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies 
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build the Next.js application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy built artifacts
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Set the API base URL for the frontend to connect to the backend service
# This is correctly set to http://backend:8000, assuming 'backend' is the service name in docker-compose
# and it exposes port 8000.
ENV NEXT_PUBLIC_API_BASE_URL=http://backend:8000
# Uncomment the following line if you want to enable a static export
# ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct user for running the application.
USER node

EXPOSE 3000

# CMD ["node", "server.js"]
# Adiciona um echo antes de iniciar o servidor Node.js
CMD ["sh", "-c", "echo 'INFO: Frontend acessível externamente em http://localhost:3001' && node server.js"]
