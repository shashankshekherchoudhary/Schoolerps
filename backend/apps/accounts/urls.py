"""
URL patterns for authentication.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    LogoutView,
    CurrentUserView,
    PasswordChangeView,
    DebugStatusView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
    path('debug-status/', DebugStatusView.as_view(), name='debug_status'),
]
