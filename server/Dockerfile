# Node.js backend Dockerfile
# Build context is project root (../)
FROM node:20-alpine

WORKDIR /app

# Copy shared package (local dependency)
COPY shared/ ./shared/

# Copy server package files
COPY server/package*.json ./

# Rewrite the local dep path for inside container
RUN sed -i 's|file:../shared|file:./shared|' package.json

# Install dependencies
RUN npm install --omit=dev

# Copy server source + service account key
COPY server/src/ ./src/
COPY server/service-account-key.json ./service-account-key.json

EXPOSE 8009

CMD ["node", "src/server.js"]
