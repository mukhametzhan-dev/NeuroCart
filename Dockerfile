# Dockerfile
FROM python:3.11-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# копируем весь проект
COPY back /code/back
WORKDIR /code/back

# собираем статику внутрь образа
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "onlinestore.wsgi:application", "-b", "0.0.0.0:8000"]
