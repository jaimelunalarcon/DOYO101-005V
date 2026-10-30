from fastapi import FastAPI, Query

from app.client import BackendClientError, fetch_productos, raise_upstream_error
from app.reports import build_summary, filter_low_stock, top_by_inventory_value
from app.schemas import HealthResponse, InventorySummary, Producto, ProductoValor

app = FastAPI(
    title="Reporting Service",
    description="Reportes y estadísticas de inventario para la tienda de perritos",
    version="1.0.0",
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Estado del microservicio; no depende del backend Node.js."""
    return HealthResponse()


@app.get("/reports/summary", response_model=InventorySummary)
async def reports_summary() -> InventorySummary:
    try:
        productos = await fetch_productos()
    except BackendClientError as exc:
        raise_upstream_error(exc)
    return build_summary(productos)


@app.get("/reports/low-stock", response_model=list[Producto])
async def reports_low_stock(
    threshold: int = Query(5, ge=0, description="Stock máximo a considerar (inclusive)"),
) -> list[Producto]:
    try:
        productos = await fetch_productos()
    except BackendClientError as exc:
        raise_upstream_error(exc)
    return filter_low_stock(productos, threshold)


@app.get("/reports/top-value", response_model=list[ProductoValor])
async def reports_top_value(
    limit: int = Query(
        5,
        ge=1,
        le=50,
        description="Cantidad máxima de productos a devolver (1-50)",
    ),
) -> list[ProductoValor]:
    try:
        productos = await fetch_productos()
    except BackendClientError as exc:
        raise_upstream_error(exc)
    return top_by_inventory_value(productos, limit)
