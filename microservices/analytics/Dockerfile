FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/workspace

WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt httpx

FROM base AS development
ENV ENV=development
COPY backend/app app
COPY microservices/analytics/main.py main.py
EXPOSE 8014
CMD ["python", "main.py"]

FROM base AS production
ENV ENV=production

RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser
    
COPY --chown=appuser:appuser backend/app app
COPY --chown=appuser:appuser microservices/analytics/main.py main.py

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8014/health || exit 1

EXPOSE 8014
CMD ["python", "main.py"]
