"""
URL patterns for Fee Management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FeeStructureViewSet, FeeRecordViewSet, FeePaymentViewSet,
    AccountAdminDashboardView, StudentFeesView
)

router = DefaultRouter()
router.register(r'structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'records', FeeRecordViewSet, basename='fee-record')
router.register(r'payments', FeePaymentViewSet, basename='fee-payment')

urlpatterns = [
    path('account/dashboard/', AccountAdminDashboardView.as_view(), name='account-dashboard'),
    path('student/', StudentFeesView.as_view(), name='student-fees'),
    path('', include(router.urls)),
]
