# onlinestore/urls.py
from django.contrib import admin
from django.urls import path, include
from store import views as store_views
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),  

    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('login/', store_views.login_view, name='login'),         # or use TemplateView if no extra logic is needed
    path('register/', store_views.registration_view, name='register'),
    path('profile/', store_views.profile_view, name='profile'),
    path('products/', TemplateView.as_view(template_name='product_grid.html'), name='product_grid'),
    path('order/', TemplateView.as_view(template_name='order_form.html'), name='order_form'),
    path('order/create/', store_views.order_create_view, name='order_create'),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)