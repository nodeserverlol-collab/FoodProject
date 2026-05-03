# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db import init_db
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Запуск приложения...")
    await init_db()
    print("✅ База данных инициализирована")
    yield
    print("🛑 Остановка приложения")

app = FastAPI(lifespan=lifespan, debug=True)

# ✅ ПРАВИЛЬНАЯ НАСТРОЙКА CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://foodproject-pg8n.onrender.com/login",  # Vite порт
        "http://localhost:3000",  # Бекенд
        "http://localhost:8080",  # Альтернативный
    ],
    allow_credentials=True,  # Важно для cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Все методы
    allow_headers=["*"],  # Все заголовки
)

from router import router
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "API is running", "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)