# onlinestore/store/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Chat, ChatMessage, Coupon, Product, Order, OrderItem, Checkout, CheckoutItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return data

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        ref_name = "ProductSerializerBasic"  # Add a unique ref_name

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'items', 'amount', 'status', 'order_date']
        read_only_fields = ['user', 'amount', 'status', 'order_date']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user

        order = Order.objects.create(user=user, amount=0)
        total_amount = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']

            OrderItem.objects.create(order=order, product=product, quantity=quantity)
            total_amount += product.price * quantity
        order.amount = total_amount
        order.save()
        return order
class CheckoutItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product')

    class Meta:
        model = CheckoutItem
        fields = ['product_id', 'quantity']

class CheckoutSerializer(serializers.ModelSerializer):
    items = CheckoutItemSerializer(many=True)
    coupon_code = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = Checkout
        fields = [
            'id',
            'user',
            'first_name',
            'last_name',
            'email',
            'address',
            'apartment',
            'country',
            'state',
            'zip_code',
            'card_name',
            'card_number',
            'expiration',
            'cvv',
            'items',
            'created_at',
            'coupon_code',

        ]
        read_only_fields = ("id", "created_at")

    def validate_coupon_code(self, value):
        if not value:
            return None
        try:
            coupon = Coupon.objects.get(code=value)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Coupon not found")
        if not coupon.is_valid:
            raise serializers.ValidationError("Coupon expired or inactive")
        return coupon

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_obj = validated_data.pop("coupon_code", None)  # уже купон или None
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        checkout = Checkout.objects.create(**validated_data)

        # bulk create items
        objs = [
            CheckoutItem(checkout=checkout, **item) for item in items_data
        ]
        CheckoutItem.objects.bulk_create(objs)

        # применяем купон и создаём Order
        self._create_confirmed_order(checkout, coupon_obj)
        return checkout

    # вынесли сюда логику из View
    def _create_confirmed_order(self, checkout, coupon: Coupon | None):
        total = 0
        for cit in checkout.items.select_related("product"):
            total += cit.product.price * cit.quantity

        discount = 0
        if coupon:
            if total <= coupon.amount:
                raise serializers.ValidationError(
                    "Order total must exceed coupon amount"
                )
            discount = coupon.amount
            coupon.is_active = False
            coupon.save(update_fields=["is_active"])

        order = Order.objects.create(
            user=checkout.user,
            amount=total - discount,
            status="confirmed",
        )
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product=ci.product,
                    quantity=ci.quantity,
                )
                for ci in checkout.items.all()
            ]
        )

        checkout.order = order
        checkout.save()
        return order

from accounts.models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    orders = OrderSerializer(source='user.orders', many=True, read_only=True)
    photo = serializers.ImageField(allow_null=True, required=False)

    class Meta:
        model = Profile
        fields = ['email', 'username', 'photo', 'orders']

from .models import Product, ProductImage, Review

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model  = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        # obj.image.url уже будет абсолютным, если SECURE=True; иначе — добавляем сами
        url = obj.image.url
        if url.startswith("http"):
            return url
        # сформировать абсолютный URL через Cloudinary utils
        from cloudinary.utils import cloudinary_url
        full, _ = cloudinary_url(url, secure=True)
        return full



class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model  = Review
        fields = ["id", "user", "rate", "comment", "created"]
        read_only_fields = ["id", "user", "created"]

    def validate_rate(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rate must be 1-5")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')  # Map email to the User model

    class Meta:
        model = Profile  # Base model is Profile
        fields = ['email', 'first_name', 'last_name', 'photo']  # Include fields from both models

    def update(self, instance, validated_data):
        # Update the User model
        user_data = validated_data.pop('user', {})
        if 'email' in user_data:
            instance.user.email = user_data['email']
            instance.user.save()

        # Update the Profile model
        return super().update(instance, validated_data)
class ProductSerializer(serializers.ModelSerializer):
    images  = ProductImageSerializer(many=True, read_only=True)
    rating  = serializers.FloatField(read_only=True)

    class Meta:
        model  = Product
        fields = ["id", "name", "price", "quantity",
                  "category", "description", "images", "rating"]
        ref_name = "ProductSerializerDetailed"  # Add a unique ref_name

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = ("id", "role", "text", "created_at")

class ChatSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = Chat
        fields = ("id", "created_at", "messages")

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Coupon
        fields = ["code", "amount", "expires_at", "is_active"]

class CouponValidateSerializer(serializers.Serializer):
    code   = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, data):
        from .models import Coupon
        try:
            coupon = Coupon.objects.get(code=data["code"])
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Coupon not found")
        if not coupon.is_valid:
            raise serializers.ValidationError("Coupon expired or inactive")
        if data["amount"] <= coupon.amount:
            raise serializers.ValidationError("Order total must exceed coupon amount")
        self.context["coupon"] = coupon
        return data
