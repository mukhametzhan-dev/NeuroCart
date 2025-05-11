from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product

@receiver(post_save, sender=Product)
def clear_product_list_cache(sender, instance, **kwargs):
    cache_key = "products_list"
    cache.delete(cache_key)