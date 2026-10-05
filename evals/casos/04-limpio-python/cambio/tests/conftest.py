import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seguridad import Usuario, usuario_actual


@pytest.fixture
def cliente_http():
    def como(usuario: Usuario | None):
        app.dependency_overrides.pop(usuario_actual, None)
        if usuario:
            app.dependency_overrides[usuario_actual] = lambda: usuario
        return TestClient(app)

    yield como
    app.dependency_overrides.clear()
