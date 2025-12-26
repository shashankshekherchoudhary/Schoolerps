"""
URL patterns for Exam Management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExamViewSet, ExamSubjectViewSet, ExamResultViewSet, ReportCardViewSet,
    StudentExamResultsView, StudentReportCardDownloadView
)

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'exam-subjects', ExamSubjectViewSet, basename='exam-subject')
router.register(r'results', ExamResultViewSet, basename='exam-result')
router.register(r'report-cards', ReportCardViewSet, basename='report-card')

urlpatterns = [
    path('student/results/', StudentExamResultsView.as_view(), name='student-exam-results'),
    path('student/report-card/<int:report_card_id>/download/', 
         StudentReportCardDownloadView.as_view(), name='student-report-card-download'),
    path('', include(router.urls)),
]
