from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

class UserAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], 'john@example.com')
        self.assertEqual(response.data['user']['role'], 'JOB_SEEKER')
        
        # Verify user is saved in DB and password is secure/hashed
        user = User.objects.get(email='john@example.com')
        self.assertTrue(user.check_password('password123'))
        self.assertNotEqual(user.password, 'password123')

    def test_user_registration_password_mismatch(self):
        data = self.user_data.copy()
        data['confirm_password'] = 'different123'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_registration_duplicate_email(self):
        # Register user once
        self.client.post(self.register_url, self.user_data, format='json')
        # Try again with same email
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login_success(self):
        # Create a user
        User.objects.create_user(
            email='john@example.com',
            full_name='John Doe',
            password='password123'
        )
        
        login_data = {
            'email': 'john@example.com',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'john@example.com')
        self.assertEqual(response.data['user']['full_name'], 'John Doe')
        self.assertEqual(response.data['user']['role'], 'JOB_SEEKER')

    def test_user_login_invalid_credentials(self):
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

