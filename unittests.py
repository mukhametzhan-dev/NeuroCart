# store/tests.py
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Product, Order, OrderItem, Checkout, Coupon, Chat, ChatMessage, Review, Category

User = get_user_model()

class BaseTestCase(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create admin user
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Create test product
        self.category = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            price=1000.00,
            category=self.category
        )
        
        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            amount=1000.00,
            status='pending'
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1
        )
        
        # Create test coupon
        self.coupon = Coupon.objects.create(
            code='TEST123',
            amount=500,
            user=self.user
        )
        
        # Create test chat
        self.chat = Chat.objects.create(user=self.user)
        self.chat_message = ChatMessage.objects.create(
            chat=self.chat,
            role='user',
            text='Test message'
        )
        
        # Create test review
        self.review = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=5,
            comment='Great product'
        )
        
        # Set up clients
        self.anon_client = APIClient()
        
        self.user_client = APIClient()
        self.user_client.force_authenticate(user=self.user)
        
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)


class RegistrationAPITests(BaseTestCase):
    def test_user_registration(self):
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        
        response = self.anon_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)  # 2 from setUp + 1 new
        
        # Verify welcome coupon was created
        user = User.objects.get(username='newuser')
        self.assertTrue(Coupon.objects.filter(user=user).exists())


class LoginAPITests(BaseTestCase):
    def test_user_login(self):
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.anon_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('access_token_expires', response.data)
    
    def test_invalid_login(self):
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.anon_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrderAPITests(BaseTestCase):
    def test_create_order(self):
        url = reverse('order-create')
        data = {
            'items': [
                {
                    'product': self.product.id,
                    'quantity': 2
                }
            ]
        }
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 2)
        self.assertEqual(OrderItem.objects.count(), 2)
    
    def test_list_orders(self):
        url = reverse('order-list')
        response = self.user_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.order.id)


class ProductAPITests(BaseTestCase):
    def test_product_list(self):
        url = reverse('product-list')
        response = self.anon_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_product_detail(self):
        url = reverse('product-detail', args=[self.product.id])
        response = self.anon_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product.name)


class CheckoutAPITests(BaseTestCase):
    def test_create_checkout(self):
        url = reverse('checkout-create')
        data = {
            'items': [
                {
                    'product': self.product.id,
                    'quantity': 1
                }
            ],
            'shipping_address': '123 Test St',
            'payment_method': 'card'
        }
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Checkout.objects.count(), 1)
        
        # Verify order was created
        checkout = Checkout.objects.first()
        self.assertIsNotNone(checkout.order)
    
    def test_checkout_list_admin(self):
        # First create a checkout
        self.test_create_checkout()
        
        url = reverse('checkout-list')
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_checkout_list_user(self):
        # First create a checkout
        self.test_create_checkout()
        
        url = reverse('checkout-list')
        response = self.user_client.get(url)
        # Regular users shouldn't be able to list checkouts (unless it's their own)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileAPITests(BaseTestCase):
    def test_get_profile(self):
        url = reverse('profile')
        response = self.user_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(len(response.data['orders']), 1)
    
    def test_update_profile(self):
        url = reverse('profile-update')
        data = {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'updated@example.com'
        }
        
        response = self.user_client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'updated@example.com')


class ChatAPITests(BaseTestCase):
    def test_get_chat(self):
        url = reverse('chat')
        response = self.user_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 1)
    
    def test_post_chat(self):
        url = reverse('chat')
        data = {'prompt': 'Test question'}
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('answer', response.data)
        
        # Verify messages were saved
        chat = Chat.objects.get(user=self.user)
        self.assertEqual(chat.messages.count(), 3)  # initial + user + ai
    
    def test_clear_chat(self):
        url = reverse('chat-clear')
        response = self.user_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Chat.objects.filter(user=self.user).exists())


class CouponAPITests(BaseTestCase):
    def test_validate_coupon(self):
        url = reverse('coupon-validate')
        data = {
            'code': 'TEST123',
            'amount': 1000
        }
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['discounted_total'], 500)
    
    def test_validate_invalid_coupon(self):
        url = reverse('coupon-validate')
        data = {
            'code': 'INVALID',
            'amount': 1000
        }
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_coupon(self):
        url = reverse('coupon-detail', args=['TEST123'])
        response = self.user_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'TEST123')
    
    def test_get_user_coupon(self):
        url = reverse('user-coupon')
        response = self.user_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'TEST123')


class ProductConsultAPITests(BaseTestCase):
    def test_product_consult(self):
        url = reverse('product-ask', args=[self.product.id])
        data = {'prompt': 'Is this product good?'}
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('answer', response.data)
        
        # Verify messages were saved
        chat = Chat.objects.get(user=self.user)
        self.assertTrue(chat.messages.filter(role='ai').exists())


class ReviewAPITests(BaseTestCase):
    def test_create_review(self):
        url = reverse('review-list', args=[self.product.id])
        data = {
            'rating': 4,
            'comment': 'Pretty good'
        }
        
        response = self.user_client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 2)
    
    def test_list_reviews(self):
        url = reverse('review-list', args=[self.product.id])
        response = self.anon_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)