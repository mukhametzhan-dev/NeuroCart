# onlinestore/store/urls.py
from django.urls import path
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter
from rest_framework_nested import routers
from .views import ChatClearAPIView, CouponDetailAPIView, CouponValidateAPIView, GeminiChatAPIView, ProductConsultAPIView, ProductViewSet, ReviewViewSet, UserCouponAPIView


from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

router = routers.SimpleRouter()
router.register(r'products', ProductViewSet, basename='products')

products_router = routers.NestedSimpleRouter(router, r'products', lookup='product')
products_router.register(r'reviews', ReviewViewSet, basename='product-reviews')

# from rest_framework_swagger.views import get_swagger_view

schema_view = get_schema_view(
    openapi.Info(
        title="NeuroCart API Documentation",
        default_version="v1",
        description="API documentation for the online store",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


from .views import (
    RegistrationAPIView,
    LoginAPIView,
    OrderCreateAPIView,
    OrderListAPIView,
    ProductListAPIView,
    UserProfileAPIView,
    ProductDetailAPIView,
    CheckoutAPIView,
    UserProfilePhotoDeleteAPIView,
    UserProfilePhotoUploadAPIView,
    UserProfileUpdateAPIView,
    CheckoutListAPIView,
    # ProductListCreateAPIView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('register/', RegistrationAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('orders/', OrderListAPIView.as_view(), name='orders-list'),
    path('profile/', UserProfileAPIView.as_view(), name='profile'),
    path('profile/update/', UserProfileUpdateAPIView.as_view(), name='profile-update'),
    path('profile/photo/', UserProfilePhotoUploadAPIView.as_view(), name='profile-photo-upload'),
    path('profile/photo/', UserProfilePhotoUploadAPIView.as_view(), name='profile-photo-upload'),  # POST
    path('profile/photo/', UserProfilePhotoDeleteAPIView.as_view(), name='profile-photo-delete'),  # DELETE
    path('orders/create/', OrderCreateAPIView.as_view(), name='order-create'),
    path('products/', ProductListAPIView.as_view(), name='products-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),




    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
    path('checkouts/', CheckoutListAPIView.as_view(), name='checkouts-list'),  # GET
     path("chat/", GeminiChatAPIView.as_view()), 
        #  path("coupons/welcome/", WelcomeCouponAPIView.as_view(),  name="coupon-welcome"),
    path("coupons/validate/", CouponValidateAPIView.as_view(), name="coupon-validate"),
        path("coupons/<str:code>/", CouponDetailAPIView.as_view(), name="coupon-detail"),
    path("chat/clear/", ChatClearAPIView.as_view(),           name="chat-clear"),
    path("products/<int:pk>/ask/", ProductConsultAPIView.as_view(), name="product-ask"),
    path('coupon/user/', UserCouponAPIView.as_view(), name='user-coupon'),
        path('', include(router.urls)),
    path('', include(products_router.urls)),
    path("silk/", include("silk.urls", namespace="silk")),

    



]
