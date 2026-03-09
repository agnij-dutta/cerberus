# ---------------------------------------------------------------------------
# Cerberus Rate-Limit Service — multi-stage production build
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN groupadd --gid 1000 cerberus && \
    useradd --uid 1000 --gid cerberus --shell /bin/bash --create-home cerberus

WORKDIR /opt/cerberus

# ---------------------------------------------------------------------------
# Builder — install deps in a virtualenv so we can copy it cleanly
# ---------------------------------------------------------------------------
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --prefix=/install .

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM base AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

COPY . .

RUN chown -R cerberus:cerberus /opt/cerberus

USER cerberus

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Gunicorn with uvicorn workers — see gunicorn.conf.py for tuning knobs
CMD ["gunicorn", "app.main:create_app()", "-c", "gunicorn.conf.py"]
