# ============================================
# MyJudicial AI Service Dockerfile
# Python 3.11 + Whisper + Sentence Transformers
# ============================================
# Multi-stage: compilers live ONLY in the builder stage; the runtime image
# ships just the venv + ffmpeg/libsndfile. Cuts image size roughly in half
# and removes gcc from production surface.
# ============================================

# --- Builder: compile native deps into an isolated venv ---
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install "setuptools<80" && \
    pip install --no-build-isolation openai-whisper==20240930 && \
    pip install -r requirements.txt

# --- Runtime: audio libs + venv, no compilers ---
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ffmpeg (audio processing for Whisper)
# libsndfile1 (soundfile/audio loading)
# curl (healthcheck)
RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy application code
COPY app/ ./app/

# Create directories for runtime data
RUN mkdir -p /app/models /app/logs /app/cache

# Create non-root user
RUN groupadd -r aiservice && useradd -r -g aiservice -d /app aiservice && \
    chown -R aiservice:aiservice /app
USER aiservice

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]
