# Stage 1: preparar archivos estáticos
FROM alpine:3.20 AS builder

WORKDIR /app

COPY index.html reporte.html styles.css common.js productos.js reporte.js default.conf ./


# Stage 2: servidor web
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/reporte.html /usr/share/nginx/html/
COPY --from=builder /app/styles.css /usr/share/nginx/html/
COPY --from=builder /app/common.js /usr/share/nginx/html/
COPY --from=builder /app/productos.js /usr/share/nginx/html/
COPY --from=builder /app/reporte.js /usr/share/nginx/html/
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf

# Contenido estático de solo lectura para el usuario nginx
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R a-w /usr/share/nginx/html

EXPOSE 80

# Healthcheck operativo definido en docker-compose.yml (fuente única).
CMD ["nginx", "-g", "daemon off;"]
