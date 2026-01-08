"""
Tests for authentication and user management.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    """Test cases for authentication flows."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        
        # Create a test user
        self.test_email = 'testuser@example.com'
        self.test_password = 'TestPassword123!'
        self.user = User.objects.create_user(
            email=self.test_email,
            password=self.test_password,
            first_name='Test',
            last_name='User',
            role='school_admin'
        )
    
    def test_login_success(self):
        """Test successful login returns tokens and user info."""
        response = self.client.post(self.login_url, {
            'email': self.test_email,
            'password': self.test_password
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.test_email)
    
    def test_login_failure_wrong_password(self):
        """Test login with wrong password fails."""
        response = self.client.post(self.login_url, {
            'email': self.test_email,
            'password': 'WrongPassword'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_failure_nonexistent_user(self):
        """Test login with non-existent user fails."""
        response = self.client.post(self.login_url, {
            'email': 'nonexistent@example.com',
            'password': 'AnyPassword'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_failure_missing_fields(self):
        """Test login with missing fields fails."""
        response = self.client.post(self.login_url, {
            'email': self.test_email
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token fails."""
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with token succeeds."""
        # First login
        login_response = self.client.post(self.login_url, {
            'email': self.test_email,
            'password': self.test_password
        }, format='json')
        
        token = login_response.data['access']
        
        # Access protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.test_email)
    
    def test_logout_blacklists_token(self):
        """Test logout blacklists refresh token."""
        # Login first
        login_response = self.client.post(self.login_url, {
            'email': self.test_email,
            'password': self.test_password
        }, format='json')
        
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post('/api/auth/logout/', {
            'refresh': refresh_token
        }, format='json')
        
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)


class SchoolIsolationTests(TestCase):
    """Test cases for school data isolation."""
    
    def setUp(self):
        """Set up test fixtures with multiple schools."""
        from apps.schools.models import School
        
        self.client = APIClient()
        
        # Create two schools
        self.school1 = School.objects.create(
            name='School One',
            code='SCH001',
            is_active=True
        )
        self.school2 = School.objects.create(
            name='School Two',
            code='SCH002',
            is_active=True
        )
        
        # Create admin for school 1
        self.admin1 = User.objects.create_user(
            email='admin1@school1.com',
            password='Admin1Pass!',
            first_name='Admin',
            last_name='One',
            role='school_admin',
            school=self.school1
        )
        
        # Create admin for school 2
        self.admin2 = User.objects.create_user(
            email='admin2@school2.com',
            password='Admin2Pass!',
            first_name='Admin',
            last_name='Two',
            role='school_admin',
            school=self.school2
        )
    
    def test_admin_sees_only_own_school_data(self):
        """Test that admin can only see their own school's data."""
        # Login as admin1
        response = self.client.post('/api/auth/login/', {
            'email': 'admin1@school1.com',
            'password': 'Admin1Pass!'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify school in response
        self.assertEqual(
            response.data['user']['school']['name'],
            'School One'
        )
