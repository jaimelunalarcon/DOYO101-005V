# Tienda de Alimentos para Perritos 🐶🐶🐶

Stack completo (Frontend + Backend + MySQL) orquestado con Docker Compose.

## Cómo ejecutar en local

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
├── frontend/                 # HTML/JS + Nginx
├── backend/                  # API Express + MySQL
├── db/                       # MySQL 8 + init.sql
├── docker-compose.yml
├── .github/workflows/ci.yml  # CI
└── README.md
```
