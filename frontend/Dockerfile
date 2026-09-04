# Stage 1: preparar archivos estáticos
FROM alpine:3.20 AS builder

WORKDIR /app

COPY index.html app.js ./
COPY default.conf ./


# Stage 2: servidor web
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/app.js /usr/share/nginx/html/
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]