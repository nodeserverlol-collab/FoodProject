import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Получаем URL из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL")

# Проверка и нормализация URL
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Please add it in Render Environment Variables."
    )

# Конвертируем postgresql:// в postgresql+asyncpg:// если нужно
if DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    print("🔧 Converted URL to use asyncpg driver")

print(f"✅ Database driver: {DATABASE_URL.split('://')[0]}")

# Создаем engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Для отладки, в production можно убрать или установить False
    pool_pre_ping=True,  # Проверка соединения перед использованием
    pool_size=5,  # Размер пула соединений
    max_overflow=10,  # Максимальное количество дополнительных соединений
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    """Инициализация базы данных"""
    async with engine.begin() as conn:
        # Для production лучше использовать Alembic миграции
        # await conn.run_sync(Base.metadata.create_all)
        pass

async def get_db():
    """Генератор сессий БД"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()