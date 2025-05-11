from django.contrib import admin
from .models import Product,Checkout, Order, OrderItem,ProductImage, Review, Coupon
from django.contrib.auth.models import User
from accounts.models import Profile

admin.site.register(Product)

admin.site.register(Checkout)
admin.site.register(Order)
admin.site.register(ProductImage)
admin.site.register(Review)
admin.site.register(OrderItem)
admin.site.register(Coupon)
admin.site.register(Profile)
admin.site.site_header = "NeuroCart Admin"