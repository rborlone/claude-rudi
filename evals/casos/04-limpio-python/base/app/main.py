import logging

from fastapi import FastAPI

from app import clientes

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="Servicio de clientes")
app.include_router(clientes.router)
