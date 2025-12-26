"""
URL patterns for Attendance.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StudentAttendanceViewSet, TeacherAttendanceViewSet,
    StudentAttendanceHistoryView
)

router = DefaultRouter()
router.register(r'students', StudentAttendanceViewSet, basename='student-attendance')
router.register(r'teachers', TeacherAttendanceViewSet, basename='teacher-attendance')

urlpatterns = [
    path('student/history/', StudentAttendanceHistoryView.as_view(), name='student-attendance-history'),
    path('', include(router.urls)),
]
