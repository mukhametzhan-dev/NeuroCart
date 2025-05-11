from celery import shared_task
from .models import Checkout, Coupon, Order, OrderItem
from django.utils import timezone
# @shared_task
# def process_checkout_task(checkout_id):
#     try:
#         checkout = Checkout.objects.get(id=checkout_id)
#     except Checkout.DoesNotExist:
#         return


#     order = Order.objects.create(
#         user=checkout.user,
#         amount=0,  
#         status='confirmed'
#     )
#     print(order)
#     print(checkout)
#     print(checkout.items.all())
#     print(checkout.items.all().count())
#     print('User:', checkout.user)
    

#     total_amount = 0

#     for item in checkout.items.all():
#         product = item.product
#         quantity = item.quantity
#         OrderItem.objects.create(order=order, product=product, quantity=quantity)
#         total_amount += product.price * quantity

#     order.amount = total_amount
#     order.save()


#     checkout.order = order
#     checkout.save()

# @shared_task
# def create_welcome_coupon(code, ip):
#     Coupon.objects.get_or_create(
#         code=code,
#         defaults=dict(amount=5000, created_for_ip=ip)
#     )

# @shared_task
# def deactivate_expired_coupons():
#     now = timezone.now()
#     Coupon.objects.filter(is_active=True, expires_at__lt=now).update(is_active=False)

from celery import shared_task
from django.utils import timezone
from django.utils.crypto import get_random_string
from datetime import timedelta
from django.contrib.auth import get_user_model
from .models import Coupon

@shared_task
def create_welcome_coupon_for_user(user_id):
    User = get_user_model()
    user = User.objects.get(pk=user_id)
    if hasattr(user, "welcome_coupon"):        # уже есть
        return
    code = get_random_string(8).upper()
    Coupon.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(days=30),
    )

@shared_task
def deactivate_expired_coupons():
    from django.utils import timezone
    Coupon.objects.filter(is_active=True, expires_at__lt=timezone.now()).update(is_active=False)
