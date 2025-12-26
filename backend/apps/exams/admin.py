from django.contrib import admin
from .models import Exam, ExamSubject, ExamResult, ReportCard


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'exam_type', 'start_date', 'is_published']
    list_filter = ['exam_type', 'is_published', 'school']


@admin.register(ExamSubject)
class ExamSubjectAdmin(admin.ModelAdmin):
    list_display = ['exam', 'subject', 'school_class', 'max_marks', 'passing_marks']
    list_filter = ['exam']


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam_subject', 'marks_obtained', 'is_absent']
    list_filter = ['exam_subject__exam', 'is_absent']
    search_fields = ['student__user__first_name', 'student__admission_number']


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'percentage', 'grade', 'rank']
    list_filter = ['exam']
