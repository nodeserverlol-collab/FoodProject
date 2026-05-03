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

# Копируем requirements.txt
COPY requirements.txt .

# Фильтруем Windows-пакеты и исправляем конфликтующие версии
RUN grep -v "python-magic-bin" requirements.txt > requirements-filtered.txt && \
    sed -i 's/email-validator==1.3.0/email-validator>=2.0.0/g' requirements-filtered.txt && \
    pip install --no-cache-dir -r requirements-filtered.txt

# Копируем проект
COPY . .

EXPOSE 3000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]