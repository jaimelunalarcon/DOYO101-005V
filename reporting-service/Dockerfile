FROM python:3.12.8-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Dependencias primero para maximizar caché de capas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

USER appuser

EXPOSE 8000

# Healthcheck operativo definido en docker-compose.yml (fuente única).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
