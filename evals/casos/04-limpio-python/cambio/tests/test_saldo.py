from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from app import tipo_cambio
from app.db import sesion
from app.main import app
from app.seguridad import Usuario

DUENO = Usuario(id=1, cliente_id=7, es_admin=False)
OTRO = Usuario(id=2, cliente_id=8, es_admin=False)


@pytest.fixture
def saldo_en_db():
    resultado = AsyncMock()
    resultado.execute.return_value.scalar_one = lambda: Decimal("10.50")
    app.dependency_overrides[sesion] = lambda: resultado
    yield
    app.dependency_overrides.pop(sesion, None)


def test_devuelve_el_saldo_convertido(cliente_http, saldo_en_db, monkeypatch):
    monkeypatch.setattr(tipo_cambio, "usd_a_clp", AsyncMock(return_value=Decimal("950")))
    r = cliente_http(DUENO).get("/clientes/7/saldo")
    assert r.status_code == 200
    assert r.json() == {"cliente_id": 7, "saldo_usd": "10.50", "saldo_clp": "9975"}


def test_otro_cliente_recibe_404(cliente_http, saldo_en_db):
    assert cliente_http(OTRO).get("/clientes/7/saldo").status_code == 404


def test_sin_token_recibe_401_o_403(cliente_http):
    assert cliente_http(None).get("/clientes/7/saldo").status_code in (401, 403)


def test_tipo_de_cambio_caido_responde_503(cliente_http, saldo_en_db, monkeypatch):
    monkeypatch.setattr(tipo_cambio, "usd_a_clp", AsyncMock(side_effect=tipo_cambio.TipoCambioNoDisponible))
    assert cliente_http(DUENO).get("/clientes/7/saldo").status_code == 503
