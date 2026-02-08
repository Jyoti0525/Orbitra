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

# Copy server source and any config files present
COPY server/src/ ./src/
COPY server/ /tmp/server-files/
RUN cp /tmp/server-files/service-account-key.json ./service-account-key.json 2>/dev/null; \
    rm -rf /tmp/server-files; \
    exit 0

EXPOSE 8009

CMD ["node", "src/server.js"]
