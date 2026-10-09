# PrivacyX ML Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies for numerical libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and models
COPY . .

# Ensure models directory exists and train baseline models
RUN python -c "from pathlib import Path; Path('models').mkdir(exist_ok=True)"
RUN python train.py --samples 500

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
