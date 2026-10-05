from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import config

motor = create_async_engine(config.database_url, pool_pre_ping=True)
Sesion = async_sessionmaker(motor, expire_on_commit=False)


async def sesion() -> AsyncIterator[AsyncSession]:
    async with Sesion() as s:
        yield s
