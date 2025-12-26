from django.contrib import admin
from .models import School, FeatureToggle, ActivityLog, SupportRequest


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'status', 'plan_name', 'plan_expiry_date', 'created_at']
    list_filter = ['status', 'plan_name']
    search_fields = ['name', 'code']


@admin.register(FeatureToggle)
class FeatureToggleAdmin(admin.ModelAdmin):
    list_display = ['school', 'attendance_enabled', 'fees_enabled', 'exams_enabled', 'student_login_enabled']
    list_filter = ['attendance_enabled', 'fees_enabled', 'exams_enabled', 'student_login_enabled']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'school', 'performed_by', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['description']


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ['subject', 'school', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['subject', 'message']
