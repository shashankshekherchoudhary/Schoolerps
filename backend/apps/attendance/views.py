"""
Views for Attendance management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q

from apps.accounts.permissions import (
    IsSchoolAdmin, IsSchoolStaff, IsTeacher, IsStudent,
    AttendanceFeatureEnabled
)
from apps.academic.models import Student, Teacher, Section, ClassTeacher
from .models import StudentAttendance, TeacherAttendance, AbsentAlert
from .serializers import (
    StudentAttendanceSerializer, BulkStudentAttendanceSerializer,
    TeacherAttendanceSerializer, BulkTeacherAttendanceSerializer,
    AbsentAlertSerializer, AttendanceReportSerializer
)
from .tasks import schedule_absent_alert, cancel_absent_alert


class StudentAttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for student attendance."""
    serializer_class = StudentAttendanceSerializer
    
    def get_permissions(self):
        return [AttendanceFeatureEnabled(), IsSchoolStaff()]
    
    def get_queryset(self):
        user = self.request.user
        queryset = StudentAttendance.objects.filter(
            school=user.school
        ).select_related('student', 'section', 'marked_by')
        
        # Filter by section
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        
        # Filter by date
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        # For teachers, only show their class students
        if user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                section_ids = list(teacher.class_teacher_of.values_list('section_id', flat=True))
                queryset = queryset.filter(section_id__in=section_ids)
            except Exception:
                queryset = queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Mark attendance for multiple students at once."""
        serializer = BulkStudentAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        section_id = data['section']
        date = data['date']
        attendances_data = data['attendances']
        
        # Verify permission if teacher
        if request.user.role == 'teacher':
            try:
                teacher = request.user.teacher_profile
                if not teacher.class_teacher_of.filter(section_id=section_id).exists():
                    return Response(
                        {'error': 'You are not the class teacher of this section.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Exception:
                return Response(
                    {'error': 'Teacher profile not found.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        created_count = 0
        updated_count = 0
        
        for att_data in attendances_data:
            student_id = att_data.get('student_id')
            att_status = att_data.get('status', 'present')
            remarks = att_data.get('remarks', '')
            
            attendance, created = StudentAttendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={
                    'school': request.user.school,
                    'section_id': section_id,
                    'status': att_status,
                    'marked_by': request.user,
                    'remarks': remarks
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
            
            # Handle absent alerts (wrapped in try-except for Celery broker issues)
            try:
                if att_status == 'absent' and not attendance.alert_sent:
                    # Schedule absent alert
                    schedule_absent_alert.delay(attendance.id)
                elif att_status != 'absent' and attendance.alert_scheduled and not attendance.alert_sent:
                    # Cancel scheduled alert
                    cancel_absent_alert.delay(attendance.id)
            except Exception:
                # Celery broker unavailable - continue without alerts
                pass
        
        return Response({
            'message': f'Attendance marked successfully.',
            'created': created_count,
            'updated': updated_count
        })
    
    @action(detail=False, methods=['get'])
    def by_section(self, request):
        """Get attendance for a section on a date with all students listed."""
        section_id = request.query_params.get('section')
        date = request.query_params.get('date', timezone.now().date())
        
        if not section_id:
            return Response({'error': 'Section is required.'}, status=400)
        
        # Get all students in the section
        students = Student.objects.filter(
            current_section_id=section_id,
            status='active'
        ).select_related('user').order_by('roll_number')
        
        # Get existing attendance records
        attendances = {
            a.student_id: a 
            for a in StudentAttendance.objects.filter(section_id=section_id, date=date)
        }
        
        result = []
        for student in students:
            att = attendances.get(student.id)
            result.append({
                'student_id': student.id,
                'student_name': student.full_name,
                'admission_number': student.admission_number,
                'roll_number': student.roll_number,
                'status': att.status if att else None,
                'attendance_id': att.id if att else None,
                'remarks': att.remarks if att else None
            })
        
        return Response({
            'date': date,
            'section_id': section_id,
            'students': result,
            'marked_count': len(attendances),
            'total_count': len(students)
        })


class TeacherAttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher attendance (School Admin only)."""
    serializer_class = TeacherAttendanceSerializer
    permission_classes = [AttendanceFeatureEnabled, IsSchoolAdmin]
    
    def get_queryset(self):
        queryset = TeacherAttendance.objects.filter(
            school=self.request.user.school
        ).select_related('teacher', 'marked_by')
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Mark attendance for multiple teachers at once."""
        serializer = BulkTeacherAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        date = data['date']
        attendances_data = data['attendances']
        
        created_count = 0
        updated_count = 0
        
        for att_data in attendances_data:
            teacher_id = att_data.get('teacher_id')
            att_status = att_data.get('status', 'present')
            remarks = att_data.get('remarks', '')
            
            _, created = TeacherAttendance.objects.update_or_create(
                teacher_id=teacher_id,
                date=date,
                defaults={
                    'school': request.user.school,
                    'status': att_status,
                    'marked_by': request.user,
                    'remarks': remarks
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        return Response({
            'message': f'Attendance marked successfully.',
            'created': created_count,
            'updated': updated_count
        })
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get all teachers with their attendance for today."""
        date = request.query_params.get('date', timezone.now().date())
        
        teachers = Teacher.objects.filter(
            school=request.user.school,
            user__is_active=True
        ).select_related('user')
        
        attendances = {
            a.teacher_id: a 
            for a in TeacherAttendance.objects.filter(
                school=request.user.school, 
                date=date
            )
        }
        
        result = []
        for teacher in teachers:
            att = attendances.get(teacher.id)
            result.append({
                'teacher_id': teacher.id,
                'teacher_name': teacher.full_name,
                'employee_id': teacher.employee_id,
                'status': att.status if att else None,
                'attendance_id': att.id if att else None,
                'remarks': att.remarks if att else None
            })
        
        return Response({
            'date': str(date),
            'teachers': result,
            'marked_count': len(attendances),
            'total_count': len(teachers)
        })


class StudentAttendanceHistoryView(APIView):
    """View attendance history for a student (Student/Parent view)."""
    permission_classes = [IsStudent]
    
    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        # Check if attendance feature is enabled
        if hasattr(request.user.school, 'feature_toggle'):
            if not request.user.school.feature_toggle.attendance_enabled:
                return Response({'error': 'Attendance feature is not enabled.'}, status=403)
        
        # Get date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = StudentAttendance.objects.filter(
            student=student
        ).order_by('-date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Calculate summary
        total = queryset.count()
        present = queryset.filter(status='present').count()
        absent = queryset.filter(status='absent').count()
        late = queryset.filter(status='late').count()
        
        percentage = round((present / total * 100), 1) if total > 0 else 0
        
        return Response({
            'summary': {
                'total_days': total,
                'present_days': present,
                'absent_days': absent,
                'late_days': late,
                'percentage': percentage
            },
            'records': StudentAttendanceSerializer(queryset[:50], many=True).data
        })
