# Dockerfile
FROM python:3.14-slim

WORKDIR /app

# Установка системных зависимостей для PostgreSQL и других библиотек
# Перед установкой Python‑зависимостей
RUN apt-get update && apt-get install -y \
pkg-config \
libcairo2-dev \
libpango1.0-dev \
libgtk2.0-dev \
gcc \
python3-dev


# Затем установка Python‑пакетов
RUN pip install --no-cache-dir -r requirements.txt


# Копирование файлов зависимостей
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование всего проекта
COPY . .

# Открываем порт
EXPOSE 3000

# Команда для запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]