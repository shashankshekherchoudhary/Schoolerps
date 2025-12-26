from django.contrib import admin
from .models import (
    AcademicYear, Class, Section, Subject,
    Teacher, ClassTeacher, SubjectTeacher, Student
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current', 'school']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'numeric_value']
    list_filter = ['school']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'school_class']
    list_filter = ['school_class__school']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'school']
    list_filter = ['school']


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'school', 'employee_id']
    list_filter = ['school']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']


@admin.register(ClassTeacher)
class ClassTeacherAdmin(admin.ModelAdmin):
    list_display = ['section', 'teacher', 'academic_year']
    list_filter = ['academic_year']


@admin.register(SubjectTeacher)
class SubjectTeacherAdmin(admin.ModelAdmin):
    list_display = ['section', 'subject', 'teacher', 'academic_year']
    list_filter = ['academic_year', 'subject']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['user', 'admission_number', 'current_class', 'current_section', 'status']
    list_filter = ['school', 'current_class', 'status']
    search_fields = ['user__first_name', 'user__last_name', 'admission_number']
