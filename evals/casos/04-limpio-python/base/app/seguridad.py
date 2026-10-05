from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import config

_bearer = HTTPBearer()


@dataclass(frozen=True)
class Usuario:
    id: int
    cliente_id: int
    es_admin: bool


def usuario_actual(credenciales: HTTPAuthorizationCredentials = Depends(_bearer)) -> Usuario:
    try:
        datos = jwt.decode(
            credenciales.credentials,
            config.jwt_clave_publica,
            algorithms=["RS256"],
            audience=config.jwt_audiencia,
            issuer=config.jwt_emisor,
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido") from e
    return Usuario(id=int(datos["sub"]), cliente_id=int(datos["cliente_id"]), es_admin=datos.get("rol") == "admin")
