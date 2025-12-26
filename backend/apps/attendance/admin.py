from django.contrib import admin
from .models import StudentAttendance, TeacherAttendance, AbsentAlert


@admin.register(StudentAttendance)
class StudentAttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'marked_by', 'alert_sent']
    list_filter = ['status', 'date', 'school']
    search_fields = ['student__user__first_name', 'student__admission_number']


@admin.register(TeacherAttendance)
class TeacherAttendanceAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'date', 'status', 'marked_by']
    list_filter = ['status', 'date', 'school']


@admin.register(AbsentAlert)
class AbsentAlertAdmin(admin.ModelAdmin):
    list_display = ['attendance', 'status', 'scheduled_at', 'sent_at']
    list_filter = ['status']
