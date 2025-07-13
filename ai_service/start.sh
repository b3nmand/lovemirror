#!/bin/bash
echo "Starting AI Service..."
echo "Python version: $(python --version)"
echo "Gunicorn version: $(gunicorn --version)"
echo "Starting gunicorn with app:app on port $PORT"
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 