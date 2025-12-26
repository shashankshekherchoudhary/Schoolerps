"""
Views for School Admin academic management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Q

from apps.accounts.permissions import IsSchoolAdmin, IsSchoolStaff, IsTeacher, IsStudent
from .models import (
    AcademicYear, Class, Section, Subject,
    Teacher, ClassTeacher, SubjectTeacher, Student
)
from .serializers import (
    AcademicYearSerializer, ClassSerializer, SectionSerializer, SubjectSerializer,
    TeacherSerializer, TeacherListSerializer, TeacherCreateSerializer,
    StudentSerializer, StudentListSerializer, StudentCreateSerializer,
    ClassTeacherSerializer, SubjectTeacherSerializer, SchoolDashboardSerializer
)

User = get_user_model()


class SchoolDashboardView(APIView):
    """Dashboard stats for School Admin."""
    permission_classes = [IsSchoolAdmin]
    
    def get(self, request):
        school = request.user.school
        today = timezone.now().date()
        
        # Total counts
        total_students = Student.objects.filter(school=school, status='active').count()
        total_teachers = Teacher.objects.filter(school=school, user__is_active=True).count()
        
        # Attendance stats (will be implemented in attendance app)
        student_attendance_today = {'present': 0, 'absent': 0, 'total': 0, 'percentage': 0}
        teacher_attendance_today = {'present': 0, 'absent': 0, 'total': 0, 'percentage': 0}
        
        try:
            from apps.attendance.models import StudentAttendance, TeacherAttendance
            
            student_att = StudentAttendance.objects.filter(
                school=school, date=today
            ).aggregate(
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                total=Count('id')
            )
            if student_att['total'] > 0:
                student_attendance_today = {
                    **student_att,
                    'percentage': round(student_att['present'] / student_att['total'] * 100, 1)
                }
            
            teacher_att = TeacherAttendance.objects.filter(
                school=school, date=today
            ).aggregate(
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                total=Count('id')
            )
            if teacher_att['total'] > 0:
                teacher_attendance_today = {
                    **teacher_att,
                    'percentage': round(teacher_att['present'] / teacher_att['total'] * 100, 1)
                }
        except Exception:
            pass
        
        # Pending fees
        pending_fees = 0
        try:
            from apps.fees.models import FeeRecord
            pending = FeeRecord.objects.filter(
                student__school=school,
                status__in=['pending', 'partial']
            ).aggregate(total=Sum('balance'))
            pending_fees = pending['total'] or 0
        except Exception:
            pass
        
        return Response({
            'total_students': total_students,
            'total_teachers': total_teachers,
            'student_attendance_today': student_attendance_today,
            'teacher_attendance_today': teacher_attendance_today,
            'pending_fees': pending_fees
        })


class AcademicYearViewSet(viewsets.ModelViewSet):
    """ViewSet for academic year management."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = AcademicYearSerializer
    
    def get_queryset(self):
        return AcademicYear.objects.filter(school=self.request.user.school)
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
    
    @action(detail=True, methods=['post'])
    def set_current(self, request, pk=None):
        """Set as current academic year."""
        year = self.get_object()
        year.is_current = True
        year.save()
        return Response({'message': 'Academic year set as current.'})


class ClassViewSet(viewsets.ModelViewSet):
    """ViewSet for class management."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = ClassSerializer
    
    def get_queryset(self):
        return Class.objects.filter(school=self.request.user.school).prefetch_related('sections')
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
    
    @action(detail=True, methods=['post'])
    def add_section(self, request, pk=None):
        """Add a section to this class."""
        school_class = self.get_object()
        name = request.data.get('name')
        
        if not name:
            return Response({'error': 'Section name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        section, created = Section.objects.get_or_create(
            school_class=school_class,
            name=name.upper()
        )
        
        if not created:
            return Response({'error': 'Section already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(SectionSerializer(section).data, status=status.HTTP_201_CREATED)


class SectionViewSet(viewsets.ModelViewSet):
    """ViewSet for section management."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = SectionSerializer
    
    def get_queryset(self):
        return Section.objects.filter(school_class__school=self.request.user.school)


class SubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for subject management."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = SubjectSerializer
    
    def get_queryset(self):
        return Subject.objects.filter(school=self.request.user.school)
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher management."""
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        return Teacher.objects.filter(
            school=self.request.user.school
        ).select_related('user').prefetch_related('subjects')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TeacherListSerializer
        if self.action == 'create':
            return TeacherCreateSerializer
        return TeacherSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['school'] = self.request.user.school
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        return Response(TeacherSerializer(teacher).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle teacher active status."""
        teacher = self.get_object()
        teacher.user.is_active = not teacher.user.is_active
        teacher.user.save(update_fields=['is_active'])
        return Response({'is_active': teacher.user.is_active})
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset teacher's password."""
        teacher = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        teacher.user.set_password(new_password)
        teacher.user.save()
        return Response({'message': 'Password reset successfully.'})
    
    @action(detail=False, methods=['post'])
    def preview_import(self, request):
        """Parse and validate CSV file for bulk teacher import preview."""
        from .teacher_import_utils import parse_teacher_csv
        
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        if not uploaded_file.name.endswith('.csv'):
            return Response({'error': 'Only CSV files are supported.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_content = uploaded_file.read()
            result = parse_teacher_csv(file_content, request.user.school)
            
            if 'error' in result:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
            
            # Clean result for JSON
            valid_rows = []
            for row in result['valid_rows']:
                clean_data = {k: v for k, v in row['data'].items() 
                             if not k.endswith('_resolved') and not k.endswith('_parsed') and not k.endswith('_normalized')}
                valid_rows.append({'row_number': row['row_number'], 'data': clean_data})
            
            return Response({
                'valid_count': len(valid_rows),
                'invalid_count': len(result['invalid_rows']),
                'valid_rows': valid_rows,
                'invalid_rows': result['invalid_rows']
            })
        except Exception as e:
            return Response({'error': f'Failed to parse file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def confirm_import(self, request):
        """Confirm and create teachers from validated data."""
        from .teacher_import_utils import parse_teacher_csv, create_teachers_from_rows
        
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_content = request.FILES['file'].read()
            parse_result = parse_teacher_csv(file_content, request.user.school)
            
            if 'error' in parse_result:
                return Response({'error': parse_result['error']}, status=status.HTTP_400_BAD_REQUEST)
            
            if not parse_result['valid_rows']:
                return Response({'error': 'No valid rows to import.'}, status=status.HTTP_400_BAD_REQUEST)
            
            result = create_teachers_from_rows(parse_result['valid_rows'], request.user.school)
            
            return Response({
                'message': f"Import completed. {result['success_count']} teachers created.",
                'success_count': result['success_count'],
                'error_count': result['error_count'],
                'errors': result['errors'],
                'skipped_count': len(parse_result['invalid_rows'])
            })
        except Exception as e:
            return Response({'error': f'Import failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def sample_csv(self, request):
        """Download sample CSV template for teacher import."""
        from django.http import HttpResponse
        from .teacher_import_utils import generate_teacher_sample_csv
        
        csv_content = generate_teacher_sample_csv()
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="teacher_import_template.csv"'
        return response


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for student management."""
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        queryset = Student.objects.filter(
            school=self.request.user.school
        ).select_related('user', 'current_class', 'current_section')
        
        # Filters
        class_id = self.request.query_params.get('class')
        section_id = self.request.query_params.get('section')
        status_filter = self.request.query_params.get('status')
        
        if class_id:
            queryset = queryset.filter(current_class_id=class_id)
        if section_id:
            queryset = queryset.filter(current_section_id=section_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        if self.action == 'create':
            return StudentCreateSerializer
        return StudentSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['school'] = self.request.user.school
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle student active status."""
        student = self.get_object()
        student.user.is_active = not student.user.is_active
        student.user.save(update_fields=['is_active'])
        
        if not student.user.is_active:
            student.status = 'inactive'
        else:
            student.status = 'active'
        student.save(update_fields=['status'])
        
        return Response({'is_active': student.user.is_active, 'status': student.status})
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset student's password."""
        student = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        student.user.set_password(new_password)
        student.user.save()
        return Response({'message': 'Password reset successfully.'})
    
    @action(detail=False, methods=['post'])
    def preview_import(self, request):
        """Parse and validate CSV file for bulk import preview."""
        from .bulk_import_utils import parse_csv_file
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Check file type
        if not uploaded_file.name.endswith('.csv'):
            return Response(
                {'error': 'Only CSV files are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read file content
        try:
            file_content = uploaded_file.read()
            result = parse_csv_file(file_content, request.user.school)
            
            if 'error' in result:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Clean result for JSON serialization (remove Django objects)
            valid_rows = []
            for row in result['valid_rows']:
                clean_data = {k: v for k, v in row['data'].items() 
                             if not k.endswith('_obj') and not k.endswith('_parsed')}
                valid_rows.append({
                    'row_number': row['row_number'],
                    'data': clean_data
                })
            
            return Response({
                'valid_count': len(valid_rows),
                'invalid_count': len(result['invalid_rows']),
                'valid_rows': valid_rows,
                'invalid_rows': result['invalid_rows']
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to parse file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def confirm_import(self, request):
        """Confirm and create students from validated data."""
        from .bulk_import_utils import parse_csv_file, create_students_from_rows
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        try:
            file_content = uploaded_file.read()
            parse_result = parse_csv_file(file_content, request.user.school)
            
            if 'error' in parse_result:
                return Response(
                    {'error': parse_result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not parse_result['valid_rows']:
                return Response(
                    {'error': 'No valid rows to import.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create students
            result = create_students_from_rows(
                parse_result['valid_rows'],
                request.user.school
            )
            
            return Response({
                'message': f"Import completed. {result['success_count']} students created.",
                'success_count': result['success_count'],
                'error_count': result['error_count'],
                'errors': result['errors'],
                'skipped_count': len(parse_result['invalid_rows'])
            })
            
        except Exception as e:
            return Response(
                {'error': f'Import failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def sample_csv(self, request):
        """Download sample CSV template."""
        from django.http import HttpResponse
        from .bulk_import_utils import generate_sample_csv
        
        csv_content = generate_sample_csv()
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_import_template.csv"'
        return response


class ClassTeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for class teacher assignments."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = ClassTeacherSerializer
    
    def get_queryset(self):
        queryset = ClassTeacher.objects.filter(
            section__school_class__school=self.request.user.school
        ).select_related('section', 'teacher', 'academic_year')
        
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
            
        return queryset


class SubjectTeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for subject teacher assignments."""
    permission_classes = [IsSchoolAdmin]
    serializer_class = SubjectTeacherSerializer
    
    def get_queryset(self):
        queryset = SubjectTeacher.objects.filter(
            section__school_class__school=self.request.user.school
        ).select_related('section', 'subject', 'teacher', 'academic_year')
        
        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
            
        return queryset


# Teacher Panel Views
class TeacherDashboardView(APIView):
    """Dashboard for teachers."""
    permission_classes = [IsTeacher]
    
    def get(self, request):
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found.'}, status=404)
        
        # Get class teacher assignment
        class_teacher_of = None
        current_academic_year = AcademicYear.objects.filter(school=teacher.school, is_current=True).first()
        
        # Filter by current year if possible, else take first (legacy)
        ct_assignments = teacher.class_teacher_of.all()
        if current_academic_year:
            ct_assignments = ct_assignments.filter(academic_year=current_academic_year)
            
        ct_assignment = ct_assignments.first()
        
        if ct_assignment:
            class_teacher_of = {
                'id': ct_assignment.section.id,
                'section': str(ct_assignment.section),
                'student_count': Student.objects.filter(
                    current_section=ct_assignment.section,
                    status='active'
                ).count()
            }
        
        # Get subject assignments
        st_assignments = teacher.subject_assignments.select_related('section', 'subject')
        if current_academic_year:
            st_assignments = st_assignments.filter(academic_year=current_academic_year)

        subject_assignments = [{
            'section_id': a.section.id,
            'section': str(a.section),
            'subject_id': a.subject.id,
            'subject': a.subject.name
        } for a in st_assignments]
        
        # Tuition Owner Stats
        tuition_stats = None
        if request.user.is_owner and request.user.school.account_type == 'tuition':
            tuition_stats = {
                'total_students': Student.objects.filter(school=teacher.school, status='active').count(),
                'total_batches': Section.objects.filter(school_class__school=teacher.school).count(),
                'total_subjects': Subject.objects.filter(school=teacher.school).count()
            }
        
        return Response({
            'teacher': TeacherSerializer(teacher).data,
            'class_teacher_of': class_teacher_of,
            'subject_assignments': subject_assignments,
            'tuition_stats': tuition_stats
        })


class TeacherStudentsView(APIView):
    """Get students for teacher's class/subjects."""
    permission_classes = [IsTeacher]
    
    def get(self, request):
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found.'}, status=404)
        
        # Get sections the teacher is associated with
        section_ids = set()
        
        # Class teacher sections
        for ct in teacher.class_teacher_of.all():
            section_ids.add(ct.section_id)
        
        # Subject teacher sections
        for st in teacher.subject_assignments.all():
            section_ids.add(st.section_id)
        
        students = Student.objects.filter(
            current_section_id__in=section_ids,
            status='active'
        ).select_related('current_class', 'current_section')
        
        return Response(StudentListSerializer(students, many=True).data)


# Student Panel Views
class StudentProfileView(APIView):
    """Student profile view (for student/parent login)."""
    permission_classes = [IsStudent]
    
    def get(self, request):
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        # Get class teacher
        class_teacher = None
        if student.current_section:
            ct = ClassTeacher.objects.filter(section=student.current_section).first()
            if ct:
                class_teacher = {
                    'name': ct.teacher.full_name,
                    'email': ct.teacher.email,
                    'phone': ct.teacher.phone
                }
        
        # Get subject teachers
        subject_teachers = []
        if student.current_section:
            for st in SubjectTeacher.objects.filter(section=student.current_section).select_related('teacher', 'subject'):
                subject_teachers.append({
                    'subject': st.subject.name,
                    'teacher_name': st.teacher.full_name,
                    'email': st.teacher.email,
                    'phone': st.teacher.phone
                })
        
        return Response({
            'student': StudentSerializer(student).data,
            'class_teacher': class_teacher,
            'subject_teachers': subject_teachers
        })


class StudyMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Study Materials (Notes).
    Requires 'notes' feature to be enabled.
    """
    from apps.accounts.permissions import IsSchoolMember, NotesFeatureEnabled
    permission_classes = [IsSchoolMember, NotesFeatureEnabled]
    
    from .serializers import StudyMaterialSerializer
    serializer_class = StudyMaterialSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.school:
            return self.serializer_class.Meta.model.objects.none()
            
        queryset = self.serializer_class.Meta.model.objects.filter(school=user.school)
        
        # Student filtering
        if user.role == 'student':
            student = getattr(user, 'student_profile', None)
            if student and student.current_section:
                queryset = queryset.filter(section=student.current_section)
            else:
                return queryset.none()
        
        return queryset.select_related('section', 'subject', 'created_by')
    
    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            created_by=self.request.user
        )
