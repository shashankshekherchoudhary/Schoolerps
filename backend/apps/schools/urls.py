"""
URL patterns for Platform Admin features.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SchoolViewSet, ActivityLogViewSet, SupportRequestViewSet,
    PlatformDashboardView
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')
router.register(r'support-requests', SupportRequestViewSet, basename='support-request')

urlpatterns = [
    path('dashboard/', PlatformDashboardView.as_view(), name='platform-dashboard'),
    path('', include(router.urls)),
]
