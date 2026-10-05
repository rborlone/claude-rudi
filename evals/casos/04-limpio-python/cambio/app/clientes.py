import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app import tipo_cambio
from app.db import sesion
from app.seguridad import Usuario, usuario_actual

log = logging.getLogger(__name__)
router = APIRouter(prefix="/clientes", tags=["clientes"])


class Cliente(BaseModel):
    id: int
    nombre: str


class Saldo(BaseModel):
    cliente_id: int
    saldo_usd: Decimal
    saldo_clp: Decimal


def _exigir_acceso(usuario: Usuario, cliente_id: int) -> None:
    # 404 y no 403: no revelamos qué clientes existen.
    if not usuario.es_admin and usuario.cliente_id != cliente_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")


@router.get("/{cliente_id}", response_model=Cliente)
async def obtener(cliente_id: int, usuario: Usuario = Depends(usuario_actual), s: AsyncSession = Depends(sesion)):
    _exigir_acceso(usuario, cliente_id)
    fila = (await s.execute(text("SELECT id, nombre FROM clientes WHERE id = :id"), {"id": cliente_id})).first()
    if fila is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
    return Cliente(id=fila.id, nombre=fila.nombre)


@router.get("/{cliente_id}/saldo", response_model=Saldo)
async def saldo(cliente_id: int, usuario: Usuario = Depends(usuario_actual), s: AsyncSession = Depends(sesion)):
    _exigir_acceso(usuario, cliente_id)
    saldo_usd = (
        await s.execute(
            text("SELECT COALESCE(SUM(monto_usd), 0) FROM movimientos WHERE cliente_id = :id"), {"id": cliente_id}
        )
    ).scalar_one()
    try:
        tasa = await tipo_cambio.usd_a_clp()
    except tipo_cambio.TipoCambioNoDisponible:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Tipo de cambio no disponible, intenta en unos minutos")
    log.info("Saldo consultado para el cliente %s", cliente_id)
    return Saldo(cliente_id=cliente_id, saldo_usd=saldo_usd, saldo_clp=(saldo_usd * tasa).quantize(Decimal("1")))
