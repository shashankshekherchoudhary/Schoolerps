"""
Views for Notices.
"""
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q

from apps.accounts.permissions import IsSchoolAdmin, IsSchoolMember, IsStudent
from .models import Notice
from .serializers import NoticeSerializer, NoticeCreateSerializer


class NoticeViewSet(viewsets.ModelViewSet):
    """ViewSet for notice management."""
    
    def get_permissions(self):
        # Allow all school members (admins + teachers) to create/view
        # Strict ownership checks or admin overrides should ideally happen in object permissions,
        # but filtering queryset serves as a basic barrier for now.
        return [IsSchoolMember()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NoticeCreateSerializer
        return NoticeSerializer
    
    def get_queryset(self):
        user = self.request.user
        today = timezone.now().date()
        
        # Base: All notices for the school
        queryset = Notice.objects.filter(school=user.school)
        
        # Admins see everything
        if user.role in ['school_admin', 'platform_admin']:
            return queryset.prefetch_related('target_classes', 'target_sections')

        # For Teachers: See targeted notices AND created notices
        if user.role == 'teacher':
            # 1. Notices targeted at teachers
            targeted = queryset.filter(
                is_published=True,
                publish_date__lte=today
            ).filter(
                Q(target_audience='all') | Q(target_audience='teachers')
            ).filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
            )
            
            # 2. Notices created by this teacher (Draft or Published)
            created_by_me = queryset.filter(created_by=user)
            
            return (targeted | created_by_me).distinct().prefetch_related('target_classes', 'target_sections')

        # For others (Students/Parents if accessing this endpoint, though they use StudentNoticesView)
        queryset = queryset.filter(
            is_published=True,
            publish_date__lte=today
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
        )
        
        return queryset.prefetch_related('target_classes', 'target_sections')
    
    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            created_by=self.request.user
        )


class StudentNoticesView(APIView):
    """View notices for students/parents."""
    permission_classes = [IsStudent]
    
    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        today = timezone.now().date()
        
        # Filter Logic:
        # 1. School matches
        # 2. Published & Active
        # 3. Audience matches (All, Students, Parents)
        # 4. Scope matches (Global, My Class, My Section)
        
        notices = Notice.objects.filter(
            school=student.school,
            is_published=True,
            publish_date__lte=today
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
        ).filter(
            Q(target_audience='all') |
            Q(target_audience='students') |
            Q(target_audience='parents')
        ).filter(
            # Notice is Global (no targets)
            (Q(target_classes__isnull=True) & Q(target_sections__isnull=True)) |
            # OR targets my class
            Q(target_classes=student.current_class) |
            # OR targets my section
            Q(target_sections=student.current_section)
        ).distinct().prefetch_related('target_classes', 'target_sections')
        
        return Response(NoticeSerializer(notices, many=True).data)
