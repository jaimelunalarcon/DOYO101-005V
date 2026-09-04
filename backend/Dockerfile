# Stage 1: dependencias
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Stage 2: runtime / producción
FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 3001

CMD ["npm", "start"]