#!/usr/bin/env bash
set -e
cd /app/backend
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python -m gunicorn --bind 0.0.0.0:8000 --workers 3 backend.wsgi:application