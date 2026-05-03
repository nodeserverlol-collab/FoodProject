# db.py - с PostgreSQL и asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Integer, String, Column
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv

# Загружаем .env файл
load_dotenv()

# Получаем URL из .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Проверяем, что DATABASE_URL не None
if not DATABASE_URL:
    raise ValueError("DATABASE_URL не найден в .env файле!")

# Убеждаемся, что используется asyncpg, а не psycopg2
# Если в URL нет +asyncpg, добавляем его
if "postgresql://" in DATABASE_URL and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    print(f"🔧 Исправлен URL на: {DATABASE_URL}")

print(f"📊 Подключение к БД: {DATABASE_URL.split('@')[0].split('://')[0]}://***@{DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else '...'}")

# Создаем асинхронный engine с asyncpg
engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    pool_size=5,
    max_overflow=10
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

# Конвертируем postgresql:// → postgresql+asyncpg://
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if not DATABASE_URL:
    raise Exception("DATABASE_URL not set!")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
# Конвертируем URL если нужно
if DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    print("🔧 Fixed DATABASE_URL format for asyncpg")

# Убедимся, что префикс правильный
if not DATABASE_URL.startswith("postgresql+asyncpg://"):
    raise Exception(f"Invalid DATABASE_URL format. Must start with 'postgresql+asyncpg://'. Got: {DATABASE_URL[:30]}...")

print(f"✅ Connecting to database with: {DATABASE_URL.split('://')[0]}://***")

# Создаем engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Временно для отладки
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()
class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")  # Новая колонка для роли

# Pydantic модели
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user" 

class UserLogin(BaseModel):
    email: EmailStr
    password: str
async def init_db():
    async with engine.begin() as conn:
        # В production используйте миграции, а не create_all
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        