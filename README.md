# Tienda de Alimentos para Perritos 🐶🐶🐶

Stack completo (Frontend + Backend + Reporting FastAPI + MySQL) orquestado con Docker Compose.

## Integración de reportería (microservicios)

Flujo de la sección **Reportes de inventario**:

```text
Navegador → Nginx (:8080) → FastAPI (reporting-service:8000)
                              → Express (backend:3001) → MySQL
```

| Productos y alta | `http://localhost:8080/productos` |
| Reporte | `http://localhost:8080/reporte` |
| Endpoints vía Nginx | `GET /reports/summary`, `/reports/low-stock?threshold=5`, `/reports/top-value?limit=5` |
| API productos | `GET /api/productos` (sin cambios) |

Nginx hace reverse proxy de `/api/` al backend y de `/reports/` al reporting-service (mismo origen, sin CORS).

El frontend espera solo a que Express esté healthy. Si FastAPI no arranca, la tienda de productos sigue disponible. En `/reporte` la carga falla con un mensaje de error y el botón **Reintentar**.

### Prueba de integración E2E

Con el stack local healthy (el script no detiene contenedores ni borra volúmenes):

```bash
./scripts/e2e-reporting.sh
```

Comprueba `/productos`, `/reporte`, el proxy `/api/productos`, el proxy `/reports/*` y que los totales coincidan con los productos que Express lee de MySQL. No asume una cantidad fija de inventario.

En GitHub Actions el job `docker-build` construye las imágenes, levanta los cuatro servicios con credenciales ficticias de CI y ejecuta el mismo script (`TIMEOUT_SEC=180`). Si falla, el job termina con error. Después, también si falló, `docker compose down --remove-orphans --volumes` limpia contenedores y volúmenes solo en el runner.

Comprobado en local con el stack de esta máquina: los cuatro servicios healthy; `./scripts/e2e-reporting.sh` terminó en `E2E_OK` (6 productos, 133 unidades, 0 con stock bajo, top 5). Con `reporting-service` detenido, el frontend quedó healthy, `/productos` cargó el listado y `/reporte` mostró el error de conexión con **Reintentar**. Jest: 19 passed. PyTest: 20 passed.

## Cómo ejecutar en local

### Credenciales MySQL (obligatorio)

1. Copiá el ejemplo y editá contraseñas propias (no commits de `.env`):

```bash
cp .env.example .env
```

2. En `.env`, reemplazá `REEMPLAZAR_PASSWORD_ROOT` y `REEMPLAZAR_PASSWORD_APP`.
3. Si `DB_USER` es el mismo que `MYSQL_USER` (recomendado: `alumno`), entonces **`DB_PASSWORD` y `MYSQL_PASSWORD` deben coincidir**.
4. El backend debe usar el usuario de aplicación (`alumno`), **no `root`**. `root` queda solo para administración del contenedor DB / healthcheck interno.
5. Comprobar conexión sin exponer secretos:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl -sS http://127.0.0.1:3001/api/productos | head
docker exec tienda-backend printenv DB_USER   # debe mostrar: alumno
```

> Nota: cambiar `MYSQL_USER` / `MYSQL_PASSWORD` en `.env` **no actualiza** usuarios de un volumen MySQL ya inicializado. Solo aplica en la primera creación del volumen.

```bash
docker compose up --build
```

## Modelo de branching 

Se eligió **GitFlow** frente a trunk-based porque:

1. En la pauta de pedia la creación de main, develop y hotfix por lo que es importante que la elección fuera gitflow por otra parte separar en capas las diferenteas ramas y como se abordan los problemas con hotfix o fix generan una mejor documentación de la evolución y estado del proyecto.
2. Develop actua como release para esta entrega

---

## Naming de ramas

| Tipo | Patrón | Uso | Ejemplo |
|------|--------|-----|---------|
| Producción | `main` | Código listo para release | `main` |
| Integración | `develop` | Integración de features y hotfixes | `develop` |
| Feature | `feature/<nombre-corto>` | Nueva funcionalidad | `feature/frontend`, `feature/ci` |
| Hotfix | `hotfix/<nombre-corto>` | Corrección urgente sobre lo ya integrado | `hotfix/docker-compose` |
| Fix menor (opcional) | `fix-<descripcion>` | Bugfix puntual vía PR a `develop` | `fix-edit-product-alert` |



## Flujo de merge

### Feature

1. Crear rama desde `develop`: `feature/<nombre>`
2. Desarrollar hacer commit con nombre descriptivo y hacer push
3. Abrir **Pull Request** hacia `develop`, mencionar en nombre que va a develop
4. Revisión + CI en verde → merge a `develop`
5. Cuando `develop` esté estable → **PR de `develop` → `main`** (release)

```text
feature/*  ──PR──►  develop  ──PR──►  main
```

### Hotfix

1. Crear `hotfix/<nombre>` (desde `main` o desde `develop`, según el caso)
2. Corregir el problema
3. PR hacia la rama objetivo (`develop` y/o `main`)
4. Si se mergea a `main`, sincronizar también a `develop` para no perder el fix

```text
hotfix/*  ──PR──►  main
              └──►  develop  (sincronizar)
```


## Convenciones de commits

Mensajes **cortos, en español**, enfocados en el *qué/por qué*:

Ej:

| Feature / módulo | `Frontend`, `backend`, `creación de base de datos` |
| Hotfix |  `arreglo para habilitar stack local con docker compose` |



---

## Estrategia de revisión (Pull Requests)

Antes de aprobar/mergear un PR:

1. **Descripción clara**: qué cambia, cómo probarlo.
2. **Alcance acotado**: un feature/hotfix por PR.
3. **Nombre de PR**: dejar en el nombre de pr explicitamente a que rama va [develop] o [main]
4. **CI en verde**: el workflow `CI` (`.github/workflows/ci.yml`) debe pasar.

### GitHub Actions (CI)

- Se ejecuta en **push a `develop`** y en **pull request a `main`**.
- Valida la estructura del proyecto y hace `docker compose build`.

---

## Estructura del repositorio

```text
├── frontend/                 # HTML/JS + Nginx (CRUD + reportes)
├── backend/                  # API Express + MySQL
├── reporting-service/        # FastAPI reportes de inventario
├── db/                       # MySQL 8.4 + init.sql
├── scripts/e2e-reporting.sh  # Prueba integración Nginx↔APIs
├── docker-compose.yml
├── .github/workflows/ci.yml  # CI
└── README.md
```
