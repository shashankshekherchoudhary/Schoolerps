"""
Serializers for Platform Admin features.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Max

from .models import School, FeatureToggle, ActivityLog, SupportRequest

User = get_user_model()


class FeatureToggleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureToggle
        fields = ['attendance_enabled', 'fees_enabled', 'exams_enabled', 'student_login_enabled']


class SchoolSerializer(serializers.ModelSerializer):
    """Full School serializer with all details."""
    
    feature_toggle = FeatureToggleSerializer(read_only=True)
    admin_count = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    active_users_count = serializers.SerializerMethodField()
    attendance_used = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'address', 'city', 'state', 'pincode',
            'phone', 'email', 'website', 'logo', 'principal_name',
            'account_type',
            'status', 'plan_name', 'plan_start_date', 'plan_expiry_date', 'plan_notes',
            'feature_toggle', 'admin_count', 'last_login', 'active_users_count',
            'attendance_used', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_admin_count(self, obj):
        return obj.users.filter(role='school_admin').count()
    
    def get_last_login(self, obj):
        last = obj.users.aggregate(last=Max('last_login'))['last']
        return last.isoformat() if last else None
    
    def get_active_users_count(self, obj):
        return obj.users.filter(is_active=True).count()
    
    def get_attendance_used(self, obj):
        # Check if any attendance records exist
        if hasattr(obj, 'student_attendances'):
            return obj.student_attendances.exists()
        return False


class SchoolCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new school."""
    
    class Meta:
        model = School
        fields = [
            'name', 'code', 'address', 'city', 'state', 'pincode',
            'phone', 'email', 'website', 'logo', 'principal_name',
            'account_type',
            'plan_name', 'plan_start_date', 'plan_expiry_date', 'plan_notes'
        ]
    
    def validate_code(self, value):
        if School.objects.filter(code=value.upper()).exists():
            raise serializers.ValidationError('School code already exists.')
        return value.upper()


class SchoolListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for school list."""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    plan_display = serializers.CharField(source='get_plan_name_display', read_only=True)
    last_login = serializers.SerializerMethodField()
    
    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'status', 'status_display',
            'plan_name', 'plan_display', 'plan_expiry_date',
            'created_at', 'last_login'
        ]
    
    def get_last_login(self, obj):
        last = obj.users.aggregate(last=Max('last_login'))['last']
        return last.isoformat() if last else None


class SchoolAdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a school admin."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'school']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = 'school_admin'
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs."""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'school', 'school_name', 'action', 'action_display',
            'description', 'performed_by', 'performed_by_name', 'created_at'
        ]


class SupportRequestSerializer(serializers.ModelSerializer):
    """Serializer for support requests."""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SupportRequest
        fields = [
            'id', 'school', 'school_name', 'subject', 'message',
            'status', 'status_display', 'created_by', 'created_by_name',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'resolution_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupportRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support requests."""
    
    class Meta:
        model = SupportRequest
        fields = ['subject', 'message']
