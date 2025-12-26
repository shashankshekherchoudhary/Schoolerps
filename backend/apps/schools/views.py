"""
Views for Platform Admin features.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Max, Q

from apps.accounts.permissions import IsPlatformAdmin, IsSchoolAdmin, IsSchoolMember
from .models import School, FeatureToggle, ActivityLog, SupportRequest
from .serializers import (
    SchoolSerializer, SchoolCreateSerializer, SchoolListSerializer,
    SchoolAdminCreateSerializer, FeatureToggleSerializer,
    ActivityLogSerializer, SupportRequestSerializer, SupportRequestCreateSerializer
)
from apps.accounts.serializers import PasswordResetSerializer

User = get_user_model()


class SchoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing schools (Platform Admin only).
    """
    permission_classes = [IsPlatformAdmin]
    
    def get_queryset(self):
        return School.objects.all().select_related('feature_toggle')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SchoolCreateSerializer
        if self.action == 'list':
            return SchoolListSerializer
        return SchoolSerializer
    
    def perform_create(self, serializer):
        school = serializer.save()
        # Log activity
        ActivityLog.objects.create(
            school=school,
            action='school_created',
            description=f'School "{school.name}" created',
            performed_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a school."""
        school = self.get_object()
        school.status = 'suspended'
        school.save(update_fields=['status'])
        
        ActivityLog.objects.create(
            school=school,
            action='school_suspended',
            description=f'School suspended by platform admin',
            performed_by=request.user
        )
        
        return Response({'message': 'School suspended successfully.'})
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a suspended school."""
        school = self.get_object()
        school.status = 'active'
        school.save(update_fields=['status'])
        
        ActivityLog.objects.create(
            school=school,
            action='school_activated',
            description=f'School activated by platform admin',
            performed_by=request.user
        )
        
        return Response({'message': 'School activated successfully.'})
    
    @action(detail=True, methods=['put', 'patch'])
    def features(self, request, pk=None):
        """Update feature toggles for a school."""
        school = self.get_object()
        toggle = school.feature_toggle
        
        serializer = FeatureToggleSerializer(toggle, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Log changes
        changes = []
        for field, value in serializer.validated_data.items():
            old_value = getattr(toggle, field)
            if old_value != value:
                changes.append(f'{field}: {old_value} → {value}')
        
        serializer.save()
        
        if changes:
            ActivityLog.objects.create(
                school=school,
                action='feature_toggled',
                description=f'Features updated: {", ".join(changes)}',
                performed_by=request.user
            )
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['put', 'patch'])
    def plan(self, request, pk=None):
        """Update plan for a school."""
        school = self.get_object()
        
        old_plan = school.plan_name
        
        school.plan_name = request.data.get('plan_name', school.plan_name)
        school.plan_start_date = request.data.get('plan_start_date', school.plan_start_date)
        school.plan_expiry_date = request.data.get('plan_expiry_date', school.plan_expiry_date)
        school.plan_notes = request.data.get('plan_notes', school.plan_notes)
        school.save()
        
        if old_plan != school.plan_name:
            ActivityLog.objects.create(
                school=school,
                action='plan_changed',
                description=f'Plan changed from {old_plan} to {school.plan_name}',
                performed_by=request.user
            )
        
        return Response(SchoolSerializer(school).data)
    
    @action(detail=True, methods=['post'])
    def create_admin(self, request, pk=None):
        """Create a school admin for this school."""
        school = self.get_object()
        
        data = request.data.copy()
        data['school'] = school.id
        
        serializer = SchoolAdminCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        ActivityLog.objects.create(
            school=school,
            action='admin_created',
            description=f'School admin "{user.email}" created',
            performed_by=request.user
        )
        
        return Response({
            'message': 'School admin created successfully.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def admins(self, request, pk=None):
        """List school admins."""
        school = self.get_object()
        admins = school.users.filter(role='school_admin')
        
        data = [{
            'id': admin.id,
            'email': admin.email,
            'full_name': admin.get_full_name(),
            'is_active': admin.is_active,
            'last_login': admin.last_login
        } for admin in admins]
        
        return Response(data)
    
    @action(detail=True, methods=['post'], url_path='admins/(?P<admin_id>[^/.]+)/reset-password')
    def reset_admin_password(self, request, pk=None, admin_id=None):
        """Reset a school admin's password."""
        school = self.get_object()
        
        try:
            admin = school.users.get(id=admin_id, role='school_admin')
        except User.DoesNotExist:
            return Response({'error': 'Admin not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        admin.set_password(serializer.validated_data['new_password'])
        admin.save()
        
        ActivityLog.objects.create(
            school=school,
            action='admin_password_reset',
            description=f'Password reset for admin "{admin.email}"',
            performed_by=request.user
        )
        
        return Response({'message': 'Password reset successfully.'})
    
    @action(detail=True, methods=['get'])
    def usage_signals(self, request, pk=None):
        """Get usage signals for a school."""
        school = self.get_object()
        
        last_login = school.users.aggregate(last=Max('last_login'))['last']
        active_users = school.users.filter(is_active=True).count()
        
        # Check if attendance feature has been used
        attendance_used = False
        if hasattr(school, 'student_attendances'):
            attendance_used = school.student_attendances.exists()
        
        return Response({
            'last_login': last_login,
            'active_users_count': active_users,
            'attendance_used': attendance_used
        })


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing activity logs (Platform Admin only)."""
    permission_classes = [IsPlatformAdmin]
    serializer_class = ActivityLogSerializer
    
    def get_queryset(self):
        queryset = ActivityLog.objects.all().select_related('school', 'performed_by')
        
        # Filter by school
        school_id = self.request.query_params.get('school')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset


class SupportRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for support requests."""
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            return [IsPlatformAdmin()]
        return [IsSchoolMember()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupportRequestCreateSerializer
        return SupportRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'platform_admin':
            queryset = SupportRequest.objects.all()
        else:
            queryset = SupportRequest.objects.filter(school=user.school)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('school', 'created_by', 'resolved_by')
    
    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a support request."""
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.resolved_by = request.user
        ticket.resolved_at = timezone.now()
        ticket.resolution_notes = request.data.get('resolution_notes', '')
        ticket.save()
        
        return Response(SupportRequestSerializer(ticket).data)


class PlatformDashboardView(APIView):
    """Dashboard stats for Platform Admin."""
    permission_classes = [IsPlatformAdmin]
    
    def get(self, request):
        total_schools = School.objects.count()
        active_schools = School.objects.filter(status='active').count()
        suspended_schools = School.objects.filter(status='suspended').count()
        
        # Expiring soon (within 7 days)
        today = timezone.now().date()
        week_later = today + timezone.timedelta(days=7)
        expiring_soon = School.objects.filter(
            plan_expiry_date__gte=today,
            plan_expiry_date__lte=week_later
        ).count()
        
        open_tickets = SupportRequest.objects.filter(status='open').count()
        
        # Recent activity
        recent_logs = ActivityLog.objects.all()[:5]
        
        return Response({
            'total_schools': total_schools,
            'active_schools': active_schools,
            'suspended_schools': suspended_schools,
            'expiring_soon': expiring_soon,
            'open_tickets': open_tickets,
            'recent_activity': ActivityLogSerializer(recent_logs, many=True).data
        })
