# Base Image: Lightweight Python 3.11 Slim
FROM python:3.11-slim

# Set environment variables for production performance and Hugging Face port 7860
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOST=0.0.0.0

# Create non-root system user for security compliance (UID 1000 - Hugging Face default)
RUN groupadd -g 1000 appuser && \
    useradd -r -u 1000 -g appuser appuser

WORKDIR /app

# Copy dependency definitions and install cleanly
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy entire application codebase and static frontend assets
COPY . /app

# Change file ownership to non-root appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 7860

# Automated Docker Healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/health')" || exit 1

# Start Hugging Face Spaces production server
CMD ["python", "server.py"]
