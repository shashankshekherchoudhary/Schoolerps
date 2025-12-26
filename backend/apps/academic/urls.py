"""
URL patterns for Academic management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SchoolDashboardView, AcademicYearViewSet,
    ClassViewSet, SectionViewSet, SubjectViewSet,
    TeacherViewSet, StudentViewSet,
    ClassTeacherViewSet, SubjectTeacherViewSet,
    TeacherDashboardView, TeacherStudentsView,
    StudentProfileView, StudyMaterialViewSet
)

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'class-teachers', ClassTeacherViewSet, basename='class-teacher')
router.register(r'subject-teachers', SubjectTeacherViewSet, basename='subject-teacher')
router.register(r'materials', StudyMaterialViewSet, basename='studymaterial')

urlpatterns = [
    path('dashboard/', SchoolDashboardView.as_view(), name='school-dashboard'),
    path('teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('teacher/students/', TeacherStudentsView.as_view(), name='teacher-students'),
    path('student/profile/', StudentProfileView.as_view(), name='student-profile'),
    path('', include(router.urls)),
]
