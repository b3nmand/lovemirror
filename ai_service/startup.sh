#!/bin/bash
# Azure App Service startup script

echo "Starting LoveMirror AI Service..."

# Set environment variables if not already set
export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot"

# Start gunicorn with optimized settings for Azure
exec gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers 1 --threads 4 --worker-class gthread app:app 