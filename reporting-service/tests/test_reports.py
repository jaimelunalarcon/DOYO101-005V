from decimal import Decimal
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import pytest

from app.client import BackendClientError
from app.reports import build_summary, filter_low_stock, top_by_inventory_value
from app.schemas import Producto


def test_summary_with_valid_data(client: TestClient, mock_fetch_productos):
    response = client.get("/reports/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["total_productos"] == 3
    assert body["total_unidades"] == 53
    expected = (
        Decimal("19990.00") * 15
        + Decimal("17990.00") * 8
        + Decimal("5990.00") * 30
    )
    assert Decimal(body["valor_inventario"]) == expected


def test_summary_uses_decimal_line_value(sample_productos):
    summary = build_summary(sample_productos)
    assert isinstance(summary.valor_inventario, Decimal)
    # 19990*15 + 17990*8 + 5990*30
    assert summary.valor_inventario == Decimal("623470.00")


def test_producto_rejects_empty_precio():
    with pytest.raises(Exception):
        Producto.model_validate(
            {"id": 1, "nombre": "X", "precio": "", "stock": 1}
        )


def test_summary_empty_catalog(client: TestClient):
    with patch("app.main.fetch_productos", new_callable=AsyncMock, return_value=[]):
        response = client.get("/reports/summary")
    assert response.status_code == 200
    assert response.json() == {
        "total_productos": 0,
        "total_unidades": 0,
        "valor_inventario": "0",
    }


def test_low_stock_default_and_custom_thresholds(
    client: TestClient, mock_fetch_productos, sample_productos
):
    # Default threshold=5; stock mínimo en fixture es 8 → vacío
    response = client.get("/reports/low-stock")
    assert response.status_code == 200
    assert response.json() == []

    response = client.get("/reports/low-stock?threshold=10")
    assert response.status_code == 200
    assert [p["id"] for p in response.json()] == [2]

    response = client.get("/reports/low-stock?threshold=15")
    assert response.status_code == 200
    assert [p["id"] for p in response.json()] == [1, 2]

    response = client.get("/reports/low-stock?threshold=0")
    assert response.status_code == 200
    assert response.json() == []

    assert [p.id for p in filter_low_stock(sample_productos, 10)] == [2]


def test_top_value_ordering_and_limit(client: TestClient, mock_fetch_productos):
    response = client.get("/reports/top-value?limit=2")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["id"] == 1
    assert Decimal(body[0]["valor_inventario"]) == Decimal("299850.00")
    assert body[1]["id"] == 3
    assert Decimal(body[1]["valor_inventario"]) == Decimal("179700.00")
    assert Decimal(body[0]["valor_inventario"]) >= Decimal(body[1]["valor_inventario"])


def test_top_value_unit_helper(sample_productos):
    ranked = top_by_inventory_value(sample_productos, 1)
    assert len(ranked) == 1
    assert ranked[0].id == 1
    assert ranked[0].valor_inventario == Decimal("299850.00")


def test_invalid_threshold_returns_422(client: TestClient):
    response = client.get("/reports/low-stock?threshold=-1")
    assert response.status_code == 422


def test_invalid_limit_returns_422(client: TestClient):
    assert client.get("/reports/top-value?limit=0").status_code == 422
    assert client.get("/reports/top-value?limit=100").status_code == 422


def test_summary_returns_502_when_backend_unavailable(client: TestClient):
    with patch(
        "app.main.fetch_productos",
        new_callable=AsyncMock,
        side_effect=BackendClientError("No se pudo conectar"),
    ):
        response = client.get("/reports/summary")
    assert response.status_code == 502
    assert "No se pudo conectar" in response.json()["detail"]


def test_low_stock_returns_502_on_invalid_payload(client: TestClient):
    with patch(
        "app.main.fetch_productos",
        new_callable=AsyncMock,
        side_effect=BackendClientError("Respuesta del backend no es JSON válido"),
    ):
        response = client.get("/reports/low-stock?threshold=5")
    assert response.status_code == 502


def test_top_value_returns_502_on_unexpected_data(client: TestClient):
    with patch(
        "app.main.fetch_productos",
        new_callable=AsyncMock,
        side_effect=BackendClientError("Se esperaba una lista de productos"),
    ):
        response = client.get("/reports/top-value?limit=5")
    assert response.status_code == 502
