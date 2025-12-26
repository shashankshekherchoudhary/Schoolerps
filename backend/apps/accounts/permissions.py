"""
Custom permissions for role-based access control.
"""
from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Only platform admins can access."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'platform_admin'
        )


class IsSchoolAdmin(permissions.BasePermission):
    """Only school admins can access."""
    
    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.school and request.user.school.is_active):
            return False
            
        # Standard School Admin
        if request.user.role == 'school_admin':
            return True
            
        # Tuition Owner (Role is Teacher, but owns the Tuition)
        if (request.user.role == 'teacher' and 
            request.user.is_owner and 
            request.user.school.account_type == 'tuition'):
            return True
            
        return False


class IsAccountAdmin(permissions.BasePermission):
    """Only account admins can access."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'account_admin' and
            request.user.school and
            request.user.school.is_active
        )


class IsTeacher(permissions.BasePermission):
    """Only teachers can access."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'teacher' and
            request.user.school and
            request.user.school.is_active
        )


class IsStudent(permissions.BasePermission):
    """Only students can access."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role != 'student':
            return False
        if not request.user.school:
            return False
        if not request.user.school.is_active:
            return False
        # Check if student login feature is enabled
        if hasattr(request.user.school, 'feature_toggle'):
            if not request.user.school.feature_toggle.student_login_enabled:
                return False
        return True


class IsSchoolStaff(permissions.BasePermission):
    """School Admin, Account Admin, or Teacher can access."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['school_admin', 'account_admin', 'teacher'] and
            request.user.school and
            request.user.school.is_active
        )


class IsSchoolMember(permissions.BasePermission):
    """Any member of the school can access."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.school and
            request.user.school.is_active
        )


class FeatureEnabled(permissions.BasePermission):
    """
    Base class for feature-based permissions.
    Subclass and set feature_name to check specific features.
    """
    feature_name = None
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Platform admins bypass feature checks
        if request.user.role == 'platform_admin':
            return True
        
        if not request.user.school:
            return False
        
        # Check if feature is enabled
        try:
            toggle = request.user.school.feature_toggle
            if self.feature_name:
                return getattr(toggle, f'{self.feature_name}_enabled', True)
        except Exception:
            pass
        
        return True


class AttendanceFeatureEnabled(FeatureEnabled):
    feature_name = 'attendance'


class FeesFeatureEnabled(FeatureEnabled):
    feature_name = 'fees'


class ExamsFeatureEnabled(FeatureEnabled):
    feature_name = 'exams'


class StudentLoginFeatureEnabled(FeatureEnabled):
    feature_name = 'student_login'


class NotesFeatureEnabled(FeatureEnabled):
    feature_name = 'notes'
