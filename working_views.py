# onlinestore/store/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
# from .tasks import process_checkout_task

from rest_framework.views import APIView
from silk.profiling.profiler import silk_profile
from rest_framework.throttling import ScopedRateThrottle
from google import genai

client = genai.Client(api_key="AIzaSyAOCV8Cg26raqqzN1-MYVU67TYeT8Pavh0")

from rest_framework import serializers
from .serializers import (
    ChatSerializer,
    CheckoutSerializer,
    RegistrationSerializer,
    LoginSerializer,
    OrderSerializer,
    ProductSerializer,
    UserSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Chat, ChatMessage, Checkout, Order, OrderItem, Product,Category


class RegistrationAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        from .tasks import create_welcome_coupon_for_user
        create_welcome_coupon_for_user.delay(user.id)



class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        print(username)
        print(password)
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            print(refresh)
            print(refresh.access_token)
            print("AUTHENTICATED")
            
            access_token = refresh.access_token
            print(access_token.payload['exp'])
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
                'access_token_expires': access_token.payload['exp']
            
            }, status=status.HTTP_200_OK)
        
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class OrderCreateAPIView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


class OrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    # def get_queryset(self): N+1
    #     return Order.objects.filter(user=self.request.user)
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')
    
class UserProfileSerializer(serializers.ModelSerializer):
    orders = OrderSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'orders']

class UserProfileAPIView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id).prefetch_related('order_set')
@silk_profile(name='Product List API')
class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    # queryset = Product.objects.all() N+1 solved
    queryset = Product.objects.prefetch_related('images', 'reviews')
    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs["product_pk"]).select_related('user')



class ProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.all()



from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib import messages

def login_view(request):
    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Invalid credentials.")
    return render(request, "login.html")

def registration_view(request):
    if request.method == "POST":

        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")
        if password != password2:
            messages.error(request, "Passwords do not match.")
            return redirect('register')
        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            messages.success(request, "Registration successful. Please log in.")
            return redirect('login')
        except Exception as e:
            messages.error(request, f"Error: {str(e)}")
            return redirect('register')
    return render(request, "registration.html")

def profile_view(request):
    return render(request, "profile.html")

def order_create_view(request):
    if request.method == "POST":

        messages.success(request, "Order placed successfully!")
        return redirect('profile')
    return render(request, "order_form.html")
# @silk_profile(name='Checkout API')
# class CheckoutAPIView(generics.CreateAPIView):
#     serializer_class = CheckoutSerializer
#     permission_classes = [permissions.AllowAny] 

#     def create_confirmed_order(self, checkout):
#         order = Order.objects.create(
#             user=checkout.user,
#             amount=0,
#             status='confirmed'
#         )
#         total_amount = 0
#         for item in checkout.items.all():
#             OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity)
#             total_amount += item.product.price * item.quantity
#         order.amount = total_amount
#         order.save()
#         checkout.order = order
#         checkout.save()
#         return order               N+1 solved
# store/views.py
from rest_framework import generics, permissions
from .serializers import CheckoutSerializer

class CheckoutAPIView(generics.CreateAPIView):
    """
    Creates Checkout + Order (discount, coupon logic handled in serializer)
    """
    serializer_class   = CheckoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    
# @silk_profile(name='CheckoutList API')
class CheckoutListAPIView(generics.ListAPIView):
    serializer_class = CheckoutSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        if self.request.user.is_staff:  # Check if the user is an admin
            return Checkout.objects.prefetch_related('items__product')
        return Checkout.objects.filter(user=self.request.user).prefetch_related('items__product')
from rest_framework import generics, permissions

from accounts.models import Profile
from .serializers import ProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class UserProfileAPIView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class UserProfileUpdateAPIView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class UserProfilePhotoUploadAPIView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user.profile

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

class UserProfilePhotoDeleteAPIView(generics.DestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def delete(self, request, *args, **kwargs):
        profile = self.get_object()
        profile.photo.delete(save=True)
        return Response({'detail': 'Profile photo deleted.'}, status=status.HTTP_204_NO_CONTENT)
    
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer

@method_decorator(cache_page(60 * 5, key_prefix="products_list"), name="get")
class ProductListAPIView(generics.ListAPIView):
    queryset = Product.objects.all()  # Removed select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
from rest_framework import viewsets, mixins, permissions
from .models import Product, Review
from .serializers import ProductSerializer, ReviewSerializer

# ────────── Список + деталь товаров (кэш остался) ──────────
class ProductViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    queryset = Product.objects.prefetch_related("images")
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

# ────────── Отзывы ──────────
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class   = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs["product_pk"])

    def perform_create(self, serializer):
        product_id = self.kwargs["product_pk"]
        serializer.save(product_id=product_id)


# store/views.py
from django.utils.crypto import get_random_string
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from .models import Coupon

class GeminiChatAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "heavy"   # в settin

    def get(self, request, *args, **kwargs):
        chat, _ = Chat.objects.prefetch_related("messages").get_or_create(
            user=request.user
        )
        return Response(ChatSerializer(chat).data)

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        prompt = request.data.get("prompt")
        if not prompt:
            return Response({"detail": "prompt is required"}, status=400)


        ai_answer = f"Gemini would answer to: {prompt}"  
        response = client.models.generate_content(
        model="gemini-2.0-flash", contents="LOCAL: Kazakhstan, currency KZT (tenge), you are an E-commerce shop assistant" + prompt,
        )
        print(response.text)
        ai_answer = response.text


        # persist chat
        chat, _ = Chat.objects.get_or_create(user=request.user)
        ChatMessage.objects.bulk_create([
            ChatMessage(chat=chat, role="user", text=prompt),
            ChatMessage(chat=chat, role="ai",   text=ai_answer),
        ])

        return Response({"answer": ai_answer}, status=201)
# --------------------------------------------------------------------

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Coupon
from .serializers import CouponSerializer, CouponValidateSerializer

WELCOME_AMOUNT = 5000  # тг


from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class CouponValidateAPIView(generics.GenericAPIView):
    serializer_class = CouponValidateSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Validate a coupon",
        operation_description="Validates a coupon and calculates the discounted total.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "code": openapi.Schema(type=openapi.TYPE_STRING, description="Coupon code"),
                "amount": openapi.Schema(type=openapi.TYPE_NUMBER, description="Order total before discount"),
            },
            required=["code", "amount"],
        ),
        responses={
            200: openapi.Response(
                description="Coupon is valid",
                examples={
                    "application/json": {
                        "discounted_total": 4500,
                        "message": "Coupon applied",
                    }
                },
            ),
            400: "Invalid coupon or validation error",
        },
    )
    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        coupon = ser.context["coupon"]
        order_total = ser.validated_data["amount"]
        discounted = order_total - coupon.amount

        return Response(
            {"discounted_total": discounted, "message": "Coupon applied"},
            status=status.HTTP_200_OK,
        )
    
class CouponDetailAPIView(generics.RetrieveAPIView):
    """
    GET /coupons/{code}/
    Возвращает информацию о купоне (только владелец или staff).
    """
    serializer_class   = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    lookup_field = "code"
    queryset = Coupon.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)
class ChatClearAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Chat.objects.filter(user=request.user).delete()
        return Response({"detail": "Chat history cleared"}, status=204)
class ProductConsultAPIView(APIView):
    """
    POST /products/{id}/ask/
    body: {"prompt": "optional extra question"}
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = "heavy"

    def post(self, request, pk):
        product = generics.get_object_or_404(Product, pk=pk)
        extra   = request.data.get("prompt", "")
        prompt  = f"About this product {product.name}: {product.description}\nUser: {extra}"
        # — вызов Gemini —
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )
        ai_answer = response.text
        # сохраняем в чат
        chat, _ = Chat.objects.get_or_create(user=request.user)
        ChatMessage.objects.bulk_create([
            ChatMessage(chat=chat, role="user", text=prompt),
            ChatMessage(chat=chat, role="ai",   text=ai_answer),
        ])
        return Response({"answer": ai_answer})
class UserCouponAPIView(generics.RetrieveAPIView):
    """
    GET /coupons/user/
    Returns the coupon associated with the authenticated user.
    Requires authentication.
    """
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Retrieve the coupon for the authenticated user
        user = self.request.user
        coupon = generics.get_object_or_404(Coupon, user=user)
        return coupon