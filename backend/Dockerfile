FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
