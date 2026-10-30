# Evidencias EVP2 — Tienda de Alimentos para Perritos

Repositorio: `jaimelunalarcon/DOYO101-005V`.

Esta ficha describe lo que está en el código y lo que quedó registrado en GitHub Actions. Las capturas no están en el repositorio: cada indicador marca dónde hay que adjuntarlas.

Referencia de operación: [README.md](../README.md).

## 1. Implementación de microservicios y Dockerfiles

Qué se implementó. Cuatro servicios con imagen propia. Nginx publica la tienda y hace de proxy. Express resuelve el CRUD contra MySQL. FastAPI calcula reportes pidiendo el catálogo a Express, sin conectarse a la base. MySQL guarda la tabla `productos` y carga cinco filas de ejemplo solo en el primer arranque del volumen.

Archivos:

- `frontend/Dockerfile`, `frontend/default.conf`, `frontend/index.html`, `frontend/reporte.html`
- `backend/Dockerfile`, `backend/server.js`
- `reporting-service/Dockerfile`, `reporting-service/app/main.py`, `reporting-service/requirements.txt`
- `db/Dockerfile`, `db/init.sql`

Resultado verificable. Las imágenes se construyen en el job `docker-build` del [run 41023485335](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41023485335), que terminó en success para el commit `62b229a`.

**Captura pendiente:** `docker compose ps` con los cuatro contenedores en `healthy`, y el navegador en `/productos` y en `/reporte`.

## 2. Pruebas unitarias automatizadas e integración continua

Qué se implementó. Jest con Supertest para el backend, con MySQL simulado. PyTest para salud, cliente HTTP y reportes de FastAPI. El workflow `CI` ejecuta ambas suites, SonarCloud y, al final, la integración con Compose.

Archivos:

- `backend/tests/productos.test.js`, `backend/jest.config.js`, `backend/package.json`
- `reporting-service/tests/`, `reporting-service/pytest.ini`, `reporting-service/requirements-dev.txt`
- `.github/workflows/ci.yml`
- `sonar-project.properties`

Resultados del push a `develop` `62b229a`, [run 41023485335](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41023485335):

- `tests-backend`: 19 passed. Cobertura de `server.js`: 93,15 % líneas, 94,28 % ramas, 81,81 % funciones. El umbral del archivo de Jest es 80 %.
- `tests-reporting`: 20 passed y 100 % de cobertura de líneas. El umbral de PyTest es 80 %.
- `sonarqube-analysis`: success. En el pull request 32 el log registra `QUALITY GATE STATUS: PASSED` ([run 41023488509](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41023488509)).
- `docker-build`: `E2E_OK` con `productos=5 unidades=113 low=0 top=5`.

En un push a `develop` el análisis de Sonar se ejecuta, pero la espera del Quality Gate queda desactivada por la limitación de SonarCloud Free. La espera sí corre en pull requests y en `main`.

**Captura pendiente:** jobs en verde de ese run, el resumen de Jest, el resumen de PyTest y la pantalla del Quality Gate en SonarCloud.

## 3. Controles DevSecOps y análisis de seguridad

Qué se implementó. Dependabot abre actualizaciones contra `develop`. El job `security-scan` bloquea el pipeline con npm audit desde severidad high, pip-audit sobre las dependencias de producción y Trivy en HIGH y CRITICAL. Compose limita privilegios, publica solo los puertos necesarios y deja MySQL fuera del host. Las contraseñas no están en las imágenes ni en `.env.example` como valores reales.

Archivos:

- `.github/dependabot.yml`
- `.github/workflows/ci.yml` (job `security-scan`)
- `docker-compose.yml`
- `sonar-project.properties`
- `.env.example`, `.gitignore`

Resultado del mismo run `41023485335`, job `security-scan` en success:

- `npm audit --audit-level=high`: 6 vulnerabilidades low en dependencias de Jest. El job no falla con ese nivel.
- `pip-audit -r requirements.txt`: `No known vulnerabilities found`.
- Trivy HIGH/CRITICAL: 0 en `backend/package-lock.json` y 0 en `reporting-service/requirements.txt`. Ese escaneo no incluye dependencias de desarrollo.

**Captura pendiente:** log de `security-scan` con el informe de npm audit, la línea de pip-audit y la tabla de Trivy. Otra captura del archivo de Dependabot o de un PR de Dependabot apuntando a `develop`.

## 4. Despliegue continuo simulado y trazabilidad

Qué se implementó. El workflow `CD` despliega el commit ya aprobado por CI dentro del runner de GitHub Actions. No apunta a un servidor permanente. Comprueba que el checkout sea el SHA autorizado, levanta Compose, repite la E2E, publica el artifact `deployment-report` durante 14 días y borra contenedores y volúmenes del runner.

Archivos:

- `.github/workflows/cd.yml`
- `scripts/e2e-reporting.sh`

Resultados verificables en los logs:

- Ejecución manual [41018834026](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41018834026): `workflow_dispatch` en `develop`, commit `11431ef`, job de aproximadamente un minuto (07:14:13 a 07:15:13 UTC) y `E2E_OK` con 5 productos y 113 unidades.
- Ejecución automática [41023747647](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41023747647): `workflow_run` después del CI de push. El log dice `Commit autorizado: 62b229a9823284ac853f261ba4b4803685a74640` y el mismo `E2E_OK`.
- [41023751211](https://github.com/jaimelunalarcon/DOYO101-005V/actions/runs/41023751211) quedó skipped porque el CI que lo disparó era un pull request. Esa condición está en el `if` del job.

**Captura pendiente:** resumen del job manual con el SHA y `E2E_OK`, el artifact `deployment-report`, y el log del run automático donde aparece `Commit autorizado`.

## 5. Orquestación con Docker Compose

Qué se implementó. Un Compose con red `tienda-net`, volumen `mysql-data`, variables obligatorias, healthchecks y este orden: la base sana, después Express, y desde Express el frontend y FastAPI. El frontend no depende de que FastAPI esté sano.

Archivos:

- `docker-compose.yml`
- `.env.example`
- `scripts/e2e-reporting.sh`

Resultado verificable. `docker compose config` y `docker compose up` forman parte de `docker-build` y de `deploy-simulated`, ambos en success en los runs citados. La E2E exige los cuatro healthchecks antes de comparar API y reportes. El script local no borra el volumen. La limpieza con `--volumes` está solo en los workflows.

**Captura pendiente:** `docker compose config` sin errores y `docker compose ps` mostrando la red y el estado healthy. No incluir el contenido de `.env`.

## Reflexión final

Separar la tienda en cuatro procesos me obligó a definir quién habla con quién. Al principio resultaba más simple dejar que cada servicio llegara a la base. Dejar MySQL solo detrás de Express hizo visible el contrato: FastAPI no necesita el esquema, necesita el catálogo. El proxy de Nginx resolvió el origen único del navegador y, a la vez, me mostró un fallo concreto: una redirección absoluta perdía el puerto 8080 porque el contenedor escucha en el 80.

Contenedorizar no fue solo escribir un `FROM`. Los healthchecks cambiaron el arranque: Express no puede consultar MySQL antes de que acepte la clave, y la tienda no debería caerse si el reporte todavía no responde. Esa última decisión está en `depends_on` del frontend.

El CI me sirvió para no confiar en una prueba hecha a mano una sola vez. Jest y PyTest cubren la lógica con dependencias simuladas. La E2E cubre el camino real, con un volumen nuevo y los cinco productos del `init.sql`. Ver 19, 20 y `E2E_OK` en el mismo run cierra ese circuito.

En seguridad entendí que un control que no falla el job no protege igual que uno que sí. npm audit deja pasar las low de Jest. Trivy y pip-audit cortan el camino de las dependencias de producción. Dependabot, además, no puede actualizar `pytest` y `pytest-asyncio` por separado: sus rangos no coinciden, por eso quedan fijados juntos y agrupados.

El CD simulado me aclaró la diferencia entre validar y desplegar. El runner no es un servidor. El valor está en desplegar el mismo SHA que pasó el CI, guardar el informe y borrar los volúmenes al final. También vi que un CI de pull request dispara `workflow_run` y el job se salta: el despliegue queda reservado al push a `develop`.
