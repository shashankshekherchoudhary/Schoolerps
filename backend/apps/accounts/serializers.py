"""
Serializers for User authentication and management.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user info in response.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        if user.school:
            token['school_id'] = user.school.id
            token['school_name'] = user.school.name
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra user info to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'full_name': self.user.get_full_name(),
            'role': self.user.role,
            'role_display': self.user.get_role_display(),
            'school_id': self.user.school.id if self.user.school else None,
            'school_name': self.user.school.name if self.user.school else None,
            'account_type': self.user.school.account_type if self.user.school else None,
            'is_owner': self.user.is_owner,
            'feature_toggles': self._get_feature_toggles(self.user)
        }
        
        # Check if school is active (for non-platform admins)
        if self.user.school and not self.user.school.is_active:
            raise serializers.ValidationError(
                'Your school account has been suspended. Please contact support.'
            )
        
        return data

    def _get_feature_toggles(self, user):
        toggles = {
            'notes': False,
            'attendance': True,
            'fees': True,
            'exams': True,
            'student_login': True
        }
        if user.school and hasattr(user.school, 'feature_toggle'):
            ft = user.school.feature_toggle
            toggles['notes'] = ft.notes_enabled
            toggles['attendance'] = ft.attendance_enabled
            toggles['fees'] = ft.fees_enabled
            toggles['exams'] = ft.exams_enabled
            toggles['student_login'] = ft.student_login_enabled
        return toggles


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    account_type = serializers.CharField(source='school.account_type', read_only=True)
    feature_toggles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'school', 'school_name',
            'account_type', 'is_owner', 'feature_toggles',
            'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_feature_toggles(self, obj):
        toggles = {
            'notes': False,
            'attendance': True,
            'fees': True,
            'exams': True,
            'student_login': True
        }
        if obj.school and hasattr(obj.school, 'feature_toggle'):
            ft = obj.school.feature_toggle
            toggles['notes'] = ft.notes_enabled
            toggles['attendance'] = ft.attendance_enabled
            toggles['fees'] = ft.fees_enabled
            toggles['exams'] = ft.exams_enabled
            toggles['student_login'] = ft.student_login_enabled
        return toggles


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'password', 'confirm_password', 'role', 'school'
        ]
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return data


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for admin password reset."""
    
    new_password = serializers.CharField(required=True, min_length=8)
