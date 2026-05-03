FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
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

COPY requirements.txt .

# Удаляем Windows-специфичные пакеты и устанавливаем
RUN grep -v "python-magic-bin" requirements.txt > requirements-clean.txt && \
    pip install --no-cache-dir -r requirements-clean.txt

COPY . .

EXPOSE 3000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]