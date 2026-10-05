import logging
from decimal import Decimal, InvalidOperation

import httpx

from app.config import config

log = logging.getLogger(__name__)


class TipoCambioNoDisponible(Exception):
    """El servicio de tipo de cambio no respondió a tiempo o respondió con error."""


async def usd_a_clp() -> Decimal:
    try:
        async with httpx.AsyncClient(timeout=config.tipo_cambio_timeout_s) as http:
            respuesta = await http.get(f"{config.tipo_cambio_url}/usd-clp")
            respuesta.raise_for_status()
            valor = Decimal(str(respuesta.json()["valor"]))
    except (httpx.HTTPError, KeyError, TypeError, ValueError, InvalidOperation) as e:
        log.warning("Tipo de cambio no disponible: %s", e)
        raise TipoCambioNoDisponible from e
    if not valor.is_finite() or valor <= 0:
        log.warning("Tipo de cambio fuera de rango: %s", valor)
        raise TipoCambioNoDisponible
    return valor
