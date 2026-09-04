# Imagen base MySQL 8 oficial
FROM mysql:8

# Credenciales por defecto para desarrollo local (Compose puede overridear)
ENV MYSQL_ROOT_PASSWORD=admin123
ENV MYSQL_DATABASE=tienda_perritos
ENV MYSQL_USER=alumno
ENV MYSQL_PASSWORD=alumno123

# init.sql se ejecuta solo la primera vez que se crea el volumen de datos
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
