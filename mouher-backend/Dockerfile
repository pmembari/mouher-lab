FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml ./
COPY commerce ./commerce
COPY mouher_backend ./mouher_backend
COPY manage.py ./

RUN pip install --no-cache-dir .

EXPOSE 8001

CMD ["gunicorn", "mouher_backend.wsgi:application", "--bind", "0.0.0.0:8001", "--workers", "3", "--timeout", "60"]
