"""
Views for authentication and user management.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    PasswordChangeSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user info along with tokens."""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Update last login
        if response.status_code == 200:
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
            except User.DoesNotExist:
                pass
        
        return response


class LogoutView(APIView):
    """Logout view that blacklists the refresh token."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """Get current authenticated user's profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        # Add feature toggles for the user's school
        if request.user.school:
            try:
                toggle = request.user.school.feature_toggle
                data['features'] = {
                    'attendance': toggle.attendance_enabled,
                    'fees': toggle.fees_enabled,
                    'exams': toggle.exams_enabled,
                    'student_login': toggle.student_login_enabled,
                }
            except Exception:
                data['features'] = {
                    'attendance': True,
                    'fees': True,
                    'exams': True,
                    'student_login': True,
                }
        
        return Response(data)


class PasswordChangeView(APIView):
    """Change password for authenticated user."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully.'})


class DebugStatusView(APIView):
    """
    Safe diagnostic endpoint to verify Production setup.
    Public access allowed.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from django.conf import settings
        
        email = "admin@campusorbit.com"
        try:
            user = User.objects.get(email=email)
            user_status = {
                "exists": True,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser
            }
        except User.DoesNotExist:
            user_status = {
                "exists": False,
                "error": "Admin user not found int DB"
            }
            
        data = {
            "status": "online",
            "db_engine": settings.DATABASES['default']['ENGINE'],
            "admin_user": user_status,
            "security": {
                "allowed_hosts": settings.ALLOWED_HOSTS,
                "debug_mode": settings.DEBUG,
            }
        }
        return Response(data)
