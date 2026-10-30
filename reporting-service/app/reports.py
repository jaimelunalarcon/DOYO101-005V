from decimal import Decimal

from app.schemas import InventorySummary, Producto, ProductoValor


def _line_value(producto: Producto) -> Decimal:
    return producto.precio * Decimal(producto.stock)


def build_summary(productos: list[Producto]) -> InventorySummary:
    total_unidades = sum(p.stock for p in productos)
    valor_inventario = sum((_line_value(p) for p in productos), Decimal("0"))
    return InventorySummary(
        total_productos=len(productos),
        total_unidades=total_unidades,
        valor_inventario=valor_inventario,
    )


def filter_low_stock(productos: list[Producto], threshold: int) -> list[Producto]:
    return [p for p in productos if p.stock <= threshold]


def top_by_inventory_value(productos: list[Producto], limit: int) -> list[ProductoValor]:
    ranked = sorted(productos, key=_line_value, reverse=True)[:limit]
    return [
        ProductoValor(
            id=p.id,
            nombre=p.nombre,
            descripcion=p.descripcion,
            precio=p.precio,
            stock=p.stock,
            valor_inventario=_line_value(p),
        )
        for p in ranked
    ]
