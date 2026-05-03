# Используем стабильный Python
FROM python:3.12-slim

WORKDIR /app

# Устанавливаем системные зависимости и libmagic1
RUN apt-get update && apt-get install -y \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libgtk2.0-dev \
    gcc \
    python3-dev \
    libffi-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Копируем ОЧИЩЕННЫЙ файл с зависимостями
COPY requirements-linux.txt requirements.txt

# Устанавливаем пакеты
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

EXPOSE 3000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]