from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.client import BackendClientError, fetch_productos


def _mock_async_client(response: MagicMock):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


@pytest.mark.asyncio
async def test_fetch_productos_ok(sample_productos_raw):
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = sample_productos_raw

    with patch("app.client.httpx.AsyncClient", return_value=_mock_async_client(response)):
        productos = await fetch_productos()

    assert len(productos) == 3
    assert productos[0].nombre == "Alimento Cachorro Premium"
    assert str(productos[0].precio) == "19990.00"


@pytest.mark.asyncio
async def test_fetch_productos_timeout():
    with patch(
        "app.client.httpx.AsyncClient",
        side_effect=httpx.TimeoutException("timeout"),
    ):
        with pytest.raises(BackendClientError, match="Timeout"):
            await fetch_productos()


@pytest.mark.asyncio
async def test_fetch_productos_connection_error():
    with patch(
        "app.client.httpx.AsyncClient",
        side_effect=httpx.ConnectError("connection refused"),
    ):
        with pytest.raises(BackendClientError, match="No se pudo conectar"):
            await fetch_productos()


@pytest.mark.asyncio
async def test_fetch_productos_http_error_status():
    response = MagicMock()
    response.status_code = 500
    response.json.return_value = {"message": "error"}

    with patch("app.client.httpx.AsyncClient", return_value=_mock_async_client(response)):
        with pytest.raises(BackendClientError, match="HTTP 500"):
            await fetch_productos()


@pytest.mark.asyncio
async def test_fetch_productos_invalid_json():
    response = MagicMock()
    response.status_code = 200
    response.json.side_effect = ValueError("broken json")

    with patch("app.client.httpx.AsyncClient", return_value=_mock_async_client(response)):
        with pytest.raises(BackendClientError, match="JSON válido"):
            await fetch_productos()


@pytest.mark.asyncio
async def test_fetch_productos_unexpected_shape():
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"productos": []}

    with patch("app.client.httpx.AsyncClient", return_value=_mock_async_client(response)):
        with pytest.raises(BackendClientError, match="lista de productos"):
            await fetch_productos()


@pytest.mark.asyncio
async def test_fetch_productos_invalid_item():
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = [{"id": 1, "nombre": "X"}]  # faltan precio/stock

    with patch("app.client.httpx.AsyncClient", return_value=_mock_async_client(response)):
        with pytest.raises(BackendClientError, match="Producto inválido"):
            await fetch_productos()
