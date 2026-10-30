from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class Producto(BaseModel):
    """Producto tal como lo expone el backend Node.js."""

    model_config = ConfigDict(extra="ignore")

    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    stock: int

    @field_validator("precio", mode="before")
    @classmethod
    def parse_precio(cls, value: object) -> object:
        if value is None or value == "":
            raise ValueError("precio es obligatorio")
        return value


class InventorySummary(BaseModel):
    total_productos: int
    total_unidades: int
    valor_inventario: Decimal


class ProductoValor(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    stock: int
    valor_inventario: Decimal


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "reporting-service"
