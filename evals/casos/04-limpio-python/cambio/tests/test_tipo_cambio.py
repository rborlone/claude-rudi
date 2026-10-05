from decimal import Decimal

import httpx
import pytest
import respx

from app import tipo_cambio
from app.config import config

URL = f"{config.tipo_cambio_url}/usd-clp"


@respx.mock
async def test_devuelve_la_tasa():
    respx.get(URL).respond(json={"valor": 950.5})
    assert await tipo_cambio.usd_a_clp() == Decimal("950.5")


@respx.mock
@pytest.mark.parametrize(
    "respuesta",
    [
        httpx.Response(200, json={"valor": 0}),
        httpx.Response(200, json={"valor": -1}),
        httpx.Response(200, json={"valor": "NaN"}),
        httpx.Response(200, json={"valor": "abc"}),
        httpx.Response(200, json={"valor": None}),
        httpx.Response(200, json={}),
        httpx.Response(200, json=[]),
        httpx.Response(500),
    ],
)
async def test_respuestas_invalidas_no_disponible(respuesta):
    respx.get(URL).mock(return_value=respuesta)
    with pytest.raises(tipo_cambio.TipoCambioNoDisponible):
        await tipo_cambio.usd_a_clp()


@respx.mock
async def test_timeout_no_disponible():
    respx.get(URL).mock(side_effect=httpx.TimeoutException("lento"))
    with pytest.raises(tipo_cambio.TipoCambioNoDisponible):
        await tipo_cambio.usd_a_clp()
