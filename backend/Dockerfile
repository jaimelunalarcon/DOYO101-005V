# Stage 1: dependencias de producción (aprovecha caché de package*.json)
FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# Stage 2: runtime / producción
FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server.js ./

USER appuser

EXPOSE 3001

# node directo evita escrituras de npm en HOME (compatible con read_only)
CMD ["node", "server.js"]
