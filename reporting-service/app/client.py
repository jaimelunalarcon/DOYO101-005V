from typing import Any

import httpx
from fastapi import HTTPException

from app.config import settings
from app.schemas import Producto


class BackendClientError(Exception):
    """Error al consumir la API del backend Node.js."""


async def fetch_productos() -> list[Producto]:
    """Obtiene productos desde GET /api/productos del backend."""
    url = f"{settings.backend_url.rstrip('/')}/api/productos"
    timeout = httpx.Timeout(settings.http_timeout_seconds)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
    except httpx.TimeoutException as exc:
        raise BackendClientError(
            f"Timeout al consultar productos en {url}"
        ) from exc
    except httpx.RequestError as exc:
        raise BackendClientError(
            f"No se pudo conectar con el backend en {url}: {exc}"
        ) from exc

    if response.status_code != 200:
        raise BackendClientError(
            f"Backend respondió HTTP {response.status_code} al consultar productos"
        )

    try:
        payload: Any = response.json()
    except ValueError as exc:
        raise BackendClientError("Respuesta del backend no es JSON válido") from exc

    if not isinstance(payload, list):
        raise BackendClientError("Se esperaba una lista de productos desde el backend")

    productos: list[Producto] = []
    for index, item in enumerate(payload):
        try:
            productos.append(Producto.model_validate(item))
        except Exception as exc:
            raise BackendClientError(
                f"Producto inválido en índice {index}: {exc}"
            ) from exc

    return productos


def raise_upstream_error(exc: BackendClientError) -> None:
    raise HTTPException(status_code=502, detail=str(exc)) from exc
