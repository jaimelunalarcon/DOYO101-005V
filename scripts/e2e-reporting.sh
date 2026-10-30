#!/usr/bin/env bash
# Prueba de integración E2E (no destructiva en la máquina local):
# Navegador/host → Nginx → FastAPI → Express → MySQL
# No detiene contenedores ni borra volúmenes. En CI la limpieza está en el workflow.
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
TIMEOUT_SEC="${TIMEOUT_SEC:-90}"

log() { printf '%s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

wait_http() {
  local url="$1"
  local deadline=$((SECONDS + TIMEOUT_SEC))
  while (( SECONDS < deadline )); do
    if curl -fsS -o /dev/null "$url"; then
      return 0
    fi
    sleep 2
  done
  fail "timeout esperando $url"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "falta comando: $1"
}

require_cmd curl
require_cmd python3
require_cmd docker

log "==> Esperando servicios Compose healthy"
deadline=$((SECONDS + TIMEOUT_SEC))
while (( SECONDS < deadline )); do
  healthy="$(docker compose ps --format '{{.Status}}' | grep -c '(healthy)' || true)"
  if [[ "$healthy" -ge 4 ]]; then
    break
  fi
  sleep 2
done
healthy="$(docker compose ps --format '{{.Status}}' | grep -c '(healthy)' || true)"
[[ "$healthy" -ge 4 ]] || fail "se esperaban 4 servicios healthy, hay $healthy"

log "==> 1) Frontend vía Nginx"
wait_http "$BASE_URL/productos"
code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/productos")"
[[ "$code" == "200" ]] || fail "frontend /productos HTTP $code"
code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/reporte")"
[[ "$code" == "200" ]] || fail "frontend /reporte HTTP $code"

log "==> 2) Nginx /api/productos → Express → MySQL"
productos_json="$(curl -fsS "$BASE_URL/api/productos")"

log "==> 3) Nginx /reports/summary → FastAPI → Express"
summary_json="$(curl -fsS "$BASE_URL/reports/summary")"
low_json="$(curl -fsS "$BASE_URL/reports/low-stock?threshold=5")"
top_json="$(curl -fsS "$BASE_URL/reports/top-value?limit=5")"

log "==> 4) Validar estructura y coherencia de datos"
python3 - "$productos_json" "$summary_json" "$low_json" "$top_json" <<'PY'
import json, sys

productos = json.loads(sys.argv[1])
summary = json.loads(sys.argv[2])
low = json.loads(sys.argv[3])
top = json.loads(sys.argv[4])

if not isinstance(productos, list):
    raise SystemExit("productos no es lista")
if not isinstance(low, list) or not isinstance(top, list):
    raise SystemExit("low-stock/top-value deben ser listas")

for key in ("total_productos", "total_unidades", "valor_inventario"):
    if key not in summary:
        raise SystemExit(f"summary sin campo {key}")

if summary["total_productos"] != len(productos):
    raise SystemExit(
        f"incoherencia total_productos={summary['total_productos']} vs len(productos)={len(productos)}"
    )

unidades = sum(int(p["stock"]) for p in productos)
if summary["total_unidades"] != unidades:
    raise SystemExit(
        f"incoherencia total_unidades={summary['total_unidades']} vs suma stock={unidades}"
    )

for p in low:
    if int(p["stock"]) > 5:
        raise SystemExit(f"low-stock incluye stock>{5}: id={p.get('id')}")

for p in top:
    for key in ("id", "nombre", "precio", "stock", "valor_inventario"):
        if key not in p:
            raise SystemExit(f"top-value sin campo {key}")

print("E2E_OK")
print(f"productos={len(productos)} unidades={unidades} low={len(low)} top={len(top)}")
PY

log "==> Integración E2E aprobada"
