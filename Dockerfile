# ==============================================================================
# Multi-Stage Production Dockerfile for NetPulse Core Suite
# Builds liquid glass React frontend and runs Django 5.1 ASGI engine on Linux
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python ASGI Engine
FROM python:3.12-slim AS runner
WORKDIR /app

# Install native Linux network tools & C compilation headers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    iproute2 \
    procps \
    net-tools \
    dnsutils \
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy built frontend assets into container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend application source
COPY backend/ /app/backend/

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PYTHONPATH=/app/backend

# Run database migrations and static collection
WORKDIR /app/backend
RUN python manage.py migrate --noinput

# Expose Web/API (8000), Proxy (7890), and DNS Sinkhole (53)
EXPOSE 8000 7890 53/udp 53/tcp

# Launch high-performance Daphne ASGI server
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
