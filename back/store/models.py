# onlinestore/store/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from cloudinary.models import CloudinaryField
from django.db.models import Avg
from django.core.exceptions import ValidationError
class Category(models.TextChoices):
    ELECTRONICS = "electronics", "Electronics"
    GAMING    = "gaming", "Gaming"
    

    DIGITAL     = "digital_goods", "Digital goods"
    DIY         = "diy", "DIY & Tools"
    OTHER       = "other", "Other"

class Product(models.Model):
    name        = models.CharField(max_length=100)
    price       = models.DecimalField(max_digits=8, decimal_places=2)
    quantity    = models.PositiveIntegerField(default=0)
    category    = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.ELECTRONICS,
    )
    description = models.TextField(blank=True, null=True)

    # динамическое поле-свойство
    @property
    def rating(self):
        return self.reviews.aggregate(avg=Avg("rate"))["avg"] or 0

    def __str__(self):
        return self.name

# ────────── до 3-х изображений ──────────
class ProductImage(models.Model):
    product = models.ForeignKey(Product,
                                related_name="images",
                                on_delete=models.CASCADE)
    image   = CloudinaryField("image")

    def clean(self):
        # max 3 картинки на товар
        if self.product.images.count() >= 3 and not self.pk:
            raise ValidationError("A product can have max 3 images")

# ────────── Review ──────────
class Review(models.Model):
    product  = models.ForeignKey(Product,
                                 related_name="reviews",
                                 on_delete=models.CASCADE)
    user     = models.ForeignKey(User,
                                 related_name="reviews",
                                 on_delete=models.CASCADE)
    rate     = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment  = models.TextField(blank=True)
    created  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "user")  # 1 отзыв на товар от пользователя

    def __str__(self):
        return f"{self.rate}★ by {self.user} on {self.product}"

ORDER_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
)


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    products = models.ManyToManyField(Product, through='OrderItem')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    order_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
class Checkout(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    apartment = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)

    card_name = models.CharField(max_length=255)  
    card_number = models.CharField(max_length=20)
    expiration = models.CharField(max_length=7)  
    cvv = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.OneToOneField('Order', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Checkout #{self.id} for {self.email}"
    
class CheckoutItem(models.Model):
    checkout = models.ForeignKey(Checkout, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} of {self.product.name}"
    
class Chat(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chats")
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat #{self.id} ({self.user})"

class ChatMessage(models.Model):
    chat        = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    role        = models.CharField(max_length=10, choices=[("user","user"), ("ai","ai")])
    text        = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)

from django.contrib.auth import get_user_model
User = get_user_model()

class Coupon(models.Model):
    """
    Welcome-coupon, один на каждого пользователя.
    null=True/blank=True → старая таблица мигрирует без «Provide a default».
    После миграции поле можно сделать обязательным (наложить NOT NULL).
    """
    user        = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="welcome_coupon",
        null=True, blank=True,       # ←  главное отличие
    )
    code        = models.CharField(max_length=20, unique=True)
    amount      = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    expires_at  = models.DateTimeField()
    is_active   = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return self.is_active and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.code} → {self.user or 'unbound'}"
