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

client = genai.Client(api_key="API_KEY_HERE")

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
    """
    POST /register/
    Creates a new user account and sends a welcome coupon.
    No authentication required.
    
    Request Body:
    - username: string (required)
    - email: string (required)
    - password: string (required)
    - password2: string (required, must match password)
    
    Responses:
    - 201: User created successfully
    - 400: Invalid input data
    """
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        from .tasks import create_welcome_coupon_for_user
        create_welcome_coupon_for_user.delay(user.id)



class LoginAPIView(generics.GenericAPIView):
    """
    POST /login/
    Authenticates a user and returns JWT tokens.
    No authentication required.
    
    Request Body:
    - username: string (required)
    - password: string (required)
    
    Responses:
    - 200: Returns access and refresh tokens
        {
            "refresh": "string",
            "access": "string",
            "access_token_expires": timestamp
        }
    - 401: Invalid credentials
    """

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
    """
    POST /orders/
    Creates a new order for the authenticated user.
    Requires authentication.
    
    Request Body: Order data
    Responses:
    - 201: Order created successfully
    - 400: Invalid order data
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


class OrderListAPIView(generics.ListAPIView):
    """
    GET /orders/
    Returns a list of orders for the authenticated user.
    Requires authentication.
    
    Responses:
    - 200: List of user's orders with items and products
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    # def get_queryset(self): N+1
    #     return Order.objects.filter(user=self.request.user)
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')
    
class UserProfileSerializer(serializers.ModelSerializer):
    """
    GET /profile/
    Returns the authenticated user's profile with their orders.
    Requires authentication.
    
    Responses:
    - 200: User profile data with orders
        {
            "id": integer,
            "username": "string",
            "email": "string",
            "orders": [Order objects]
        }
    """
    orders = OrderSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'orders']

class UserProfileAPIView(generics.RetrieveAPIView):
    """
    GET /products/
    Returns a list of all products with images and reviews.
    No authentication required.
    Cached for 5 minutes.
    
    Responses:
    - 200: List of product objects
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id).prefetch_related('order_set')
@silk_profile(name='Product List API')
class ProductListAPIView(generics.ListAPIView):
    """
    GET /products/{id}/
    Returns details for a specific product.
    No authentication required.
    
    Parameters:
    - id: Product ID (required)
    
    Responses:
    - 200: Product details
    - 404: Product not found
    """

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
    POST /checkout/
    Creates a checkout and associated order with discount/coupon logic.
    Requires authentication.
    
    Request Body: Checkout data
    Responses:
    - 201: Checkout and order created successfully
    - 400: Invalid checkout data
    """
    serializer_class   = CheckoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    
# @silk_profile(name='CheckoutList API')
class CheckoutListAPIView(generics.ListAPIView):
    """
    GET /checkouts/
    Returns:
    - All checkouts for admin users
    - Only user's checkouts for regular users
    Requires authentication.
    
    Responses:
    - 200: List of checkout objects with items and products
    """
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
    """
    PUT/PATCH /profile/update/
    Updates the authenticated user's profile.
    Requires authentication.
    
    Request Body: Profile data
    Responses:
    - 200: Profile updated successfully
    - 400: Invalid profile data
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class UserProfileUpdateAPIView(generics.UpdateAPIView):
    """
    POST/PATCH /profile/photo/
    Uploads or updates the authenticated user's profile photo.
    Requires authentication.
    Accepts multipart/form-data.
    
    Request Body:
    - photo: image file
    
    Responses:
    - 200: Photo uploaded successfully
    - 400: Invalid file
    """
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
    """
    GET /products/
    Returns list of all products with images.
    No authentication required.
    Cached for 5 minutes.
    
    GET /products/{id}/
    Returns details for a specific product.
    No authentication required.
    """
    queryset = Product.objects.prefetch_related("images")
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

# ────────── Отзывы ──────────
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows reviews to be viewed or edited.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
            
        return Review.objects.filter(product_id=self.kwargs["product_pk"])

    def perform_create(self, serializer):
        product_id = self.kwargs["product_pk"]
        serializer.save(product_id=product_id)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'product_pk',
                openapi.IN_PATH,
                description="ID of the product",
                type=openapi.TYPE_INTEGER
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

# store/views.py
from django.utils.crypto import get_random_string
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from .models import Coupon

class GeminiChatAPIView(APIView):
    """
    GET /products/{product_pk}/reviews/
    Returns list of reviews for a product.
    No authentication required.
    
    POST /products/{product_pk}/reviews/
    Creates a new review for a product.
    Requires authentication.
    
    Request Body: Review data
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs["product_pk"])


class GeminiChatAPIView(APIView):
    """
    GET /chat/
    Returns the authenticated user's chat history.
    Requires authentication.
    Throttled (heavy).
    
    POST /chat/
    Sends a prompt to Gemini AI and returns the response.
    Requires authentication.
    Throttled (heavy).
    
    Request Body:
    - prompt: string (required)
    
    Responses:
    - 201: Returns AI response
        {"answer": "string"}
    - 400: Prompt is required
    """
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
    """
    DELETE /chat/clear/
    Clears the authenticated user's chat history.
    Requires authentication.
    
    Responses:
    - 204: Chat history cleared
    """
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
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=prompt
        )
        ai_answer = response.text
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
