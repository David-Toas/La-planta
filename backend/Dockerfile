# Production Multi-Stage Dockerfile for La Planta Prime Backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# HTTP Port and TCP GPS Telematics Port
EXPOSE 4000
EXPOSE 5000

CMD ["node", "dist/index.js"]
