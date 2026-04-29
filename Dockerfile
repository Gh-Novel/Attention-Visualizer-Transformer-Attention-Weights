FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only PyTorch first (smaller image, no CUDA overhead)
RUN pip install --no-cache-dir torch==2.3.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python deps
RUN pip install --no-cache-dir \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.29.0" \
    transformers==4.41.1 \
    numpy==1.26.4 \
    python-multipart==0.0.9

# Build React frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY backend/ ./backend/

# HF Spaces requires a non-root user with uid 1000
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    HF_HOME=/home/user/.cache/huggingface

EXPOSE 7860

WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
