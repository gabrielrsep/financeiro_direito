# Build stage
FROM node:20-slim AS build

WORKDIR /src

# better-sqlite3 needs build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install better-sqlite3 runtime dependencies if needed (usually just node)
# We might need the build tools again if npm install --production rebuilds it, 
# but nitro output usually bundles everything or expects them in node_modules.
# For better-sqlite3, we need to ensure the shared library is available.
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/.output ./.output
COPY --from=build /src/package*.json ./

# Nuxt 3 with better-sqlite3 often needs the module in the production environment
RUN npm install --omit=dev

# Create data directory for persistence
RUN mkdir -p /data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/db.sqlite

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
