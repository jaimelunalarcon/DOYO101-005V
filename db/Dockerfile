# Imagen base MySQL 8.4 (compatible con el volumen local existente).
# Credenciales: solo en runtime vía Compose/.env — no incrustar en la imagen.
FROM mysql:8.4

# init.sql se ejecuta solo la primera vez que se crea el volumen de datos
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
