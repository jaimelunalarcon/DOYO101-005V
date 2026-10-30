from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import Producto


@pytest.fixture
def sample_productos_raw() -> list[dict]:
    """Payload similar al JSON real de Node.js (precio como string)."""
    return [
        {
            "id": 1,
            "nombre": "Alimento Cachorro Premium",
            "descripcion": "Sabor a pollo",
            "precio": "19990.00",
            "stock": 15,
        },
        {
            "id": 2,
            "nombre": "Alimento Adulto Light",
            "descripcion": "Control de peso",
            "precio": "17990.00",
            "stock": 8,
        },
        {
            "id": 3,
            "nombre": "Snacks Dentales",
            "descripcion": "Limpieza dental",
            "precio": "5990.00",
            "stock": 30,
        },
    ]


@pytest.fixture
def sample_productos(sample_productos_raw) -> list[Producto]:
    return [Producto.model_validate(item) for item in sample_productos_raw]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def mock_fetch_productos(sample_productos):
    with patch(
        "app.main.fetch_productos",
        new_callable=AsyncMock,
        return_value=sample_productos,
    ) as mocked:
        yield mocked
