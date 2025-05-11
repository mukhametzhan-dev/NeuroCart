# onlinestore/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "onlinestore.settings")

app = Celery("onlinestore")

# Берём конфиг CELERY_* из settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Автоматически ищем tasks.py во всех INSTALLED_APPS
app.autodiscover_tasks()
