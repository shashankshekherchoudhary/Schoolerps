"""
URL patterns for Notices.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NoticeViewSet, StudentNoticesView

router = DefaultRouter()
router.register(r'', NoticeViewSet, basename='notice')

urlpatterns = [
    path('student/', StudentNoticesView.as_view(), name='student-notices'),
    path('', include(router.urls)),
]
