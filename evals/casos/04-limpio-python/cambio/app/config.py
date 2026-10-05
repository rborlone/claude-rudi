from pydantic_settings import BaseSettings


class Config(BaseSettings):
    database_url: str
    jwt_clave_publica: str
    jwt_emisor: str
    jwt_audiencia: str
    tipo_cambio_url: str
    tipo_cambio_timeout_s: float = 3.0


config = Config()
