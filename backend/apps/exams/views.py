"""
Views for Exam and Results Management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from apps.accounts.permissions import (
    IsSchoolAdmin, IsSchoolStaff, IsTeacher, IsStudent,
    ExamsFeatureEnabled
)
from apps.academic.models import Student, Class, Section
from .models import Exam, ExamSubject, ExamResult, ReportCard
from .serializers import (
    ExamSerializer, ExamCreateSerializer, ExamSubjectSerializer,
    ExamResultSerializer, BulkMarksEntrySerializer,
    ReportCardSerializer, StudentExamResultSerializer
)
from .pdf_generator import generate_report_card_pdf


class ExamViewSet(viewsets.ModelViewSet):
    """ViewSet for exam management."""
    permission_classes = [ExamsFeatureEnabled, IsSchoolAdmin]
    
    def get_queryset(self):
        return Exam.objects.filter(
            school=self.request.user.school
        ).prefetch_related('classes', 'exam_subjects')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ExamCreateSerializer
        return ExamSerializer
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish exam results."""
        exam = self.get_object()
        
        if exam.is_published:
            return Response({'error': 'Exam is already published.'}, status=400)
        
        exam.is_published = True
        exam.published_at = timezone.now()
        exam.save(update_fields=['is_published', 'published_at'])
        
        # Generate report cards for all students
        self._generate_report_cards(exam)
        
        return Response({'message': 'Exam results published successfully.'})
    
    def _generate_report_cards(self, exam):
        """Generate report cards for all students in the exam."""
        for school_class in exam.classes.all():
            students = Student.objects.filter(
                current_class=school_class,
                status='active'
            )
            
            student_scores = []
            
            for student in students:
                results = ExamResult.objects.filter(
                    exam_subject__exam=exam,
                    student=student
                )
                
                total_max = results.aggregate(
                    total=Sum('exam_subject__max_marks')
                )['total'] or 0
                
                total_obtained = results.aggregate(
                    total=Sum('marks_obtained')
                )['total'] or 0
                
                percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
                
                grade = self._get_grade(percentage)
                
                report_card, _ = ReportCard.objects.update_or_create(
                    exam=exam,
                    student=student,
                    defaults={
                        'total_marks': total_max,
                        'obtained_marks': total_obtained,
                        'percentage': percentage,
                        'grade': grade
                    }
                )
                
                student_scores.append((student.id, percentage))
            
            # Calculate ranks
            student_scores.sort(key=lambda x: x[1], reverse=True)
            for rank, (student_id, _) in enumerate(student_scores, 1):
                ReportCard.objects.filter(
                    exam=exam, student_id=student_id
                ).update(rank=rank)
    
    def _get_grade(self, percentage):
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B+'
        elif percentage >= 60:
            return 'B'
        elif percentage >= 50:
            return 'C'
        elif percentage >= 35:
            return 'D'
        else:
            return 'F'
    
    @action(detail=True, methods=['post'])
    def add_subjects(self, request, pk=None):
        """Add subjects to an exam for a class."""
        exam = self.get_object()
        
        class_id = request.data.get('class_id')
        subjects = request.data.get('subjects', [])
        # subjects: [{"subject_id": 1, "max_marks": 100, "passing_marks": 35, "exam_date": "2024-12-25"}]
        
        created = 0
        for subj in subjects:
            ExamSubject.objects.get_or_create(
                exam=exam,
                subject_id=subj['subject_id'],
                school_class_id=class_id,
                defaults={
                    'max_marks': subj.get('max_marks', 100),
                    'passing_marks': subj.get('passing_marks', 35),
                    'exam_date': subj.get('exam_date')
                }
            )
            created += 1
        
        return Response({'message': f'{created} subjects added to exam.'})


class ExamSubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for exam subjects."""
    serializer_class = ExamSubjectSerializer
    permission_classes = [ExamsFeatureEnabled, IsSchoolAdmin]
    
    def get_queryset(self):
        return ExamSubject.objects.filter(
            exam__school=self.request.user.school
        ).select_related('subject', 'school_class', 'exam')


class ExamResultViewSet(viewsets.ModelViewSet):
    """ViewSet for exam results."""
    serializer_class = ExamResultSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'bulk_entry']:
            return [ExamsFeatureEnabled(), (IsSchoolAdmin | IsTeacher)()]
        return [ExamsFeatureEnabled(), IsSchoolStaff()]
    
    def get_queryset(self):
        queryset = ExamResult.objects.filter(
            exam_subject__exam__school=self.request.user.school
        ).select_related('student', 'exam_subject', 'exam_subject__subject', 'entered_by')
        
        exam_id = self.request.query_params.get('exam')
        exam_subject_id = self.request.query_params.get('exam_subject')
        student_id = self.request.query_params.get('student')
        
        if exam_id:
            queryset = queryset.filter(exam_subject__exam_id=exam_id)
        if exam_subject_id:
            queryset = queryset.filter(exam_subject_id=exam_subject_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_entry(self, request):
        """Enter marks for multiple students at once."""
        serializer = BulkMarksEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        exam_subject_id = data['exam_subject']
        results_data = data['results']
        
        # Verify exam subject exists
        try:
            exam_subject = ExamSubject.objects.get(id=exam_subject_id)
        except ExamSubject.DoesNotExist:
            return Response({'error': 'Exam subject not found.'}, status=404)
        
        # Check if teacher has permission
        if request.user.role == 'teacher':
            try:
                teacher = request.user.teacher_profile
                if exam_subject.subject not in teacher.subjects.all():
                    return Response(
                        {'error': 'You are not assigned to teach this subject.'},
                        status=403
                    )
            except Exception:
                return Response({'error': 'Teacher profile not found.'}, status=403)
        
        created = 0
        updated = 0
        
        for result_data in results_data:
            student_id = result_data.get('student_id')
            marks = result_data.get('marks_obtained')
            is_absent = result_data.get('is_absent', False)
            remarks = result_data.get('remarks', '')
            
            _, was_created = ExamResult.objects.update_or_create(
                exam_subject_id=exam_subject_id,
                student_id=student_id,
                defaults={
                    'marks_obtained': None if is_absent else marks,
                    'is_absent': is_absent,
                    'remarks': remarks,
                    'entered_by': request.user
                }
            )
            
            if was_created:
                created += 1
            else:
                updated += 1
        
        return Response({
            'message': 'Marks entered successfully.',
            'created': created,
            'updated': updated
        })
    
    @action(detail=False, methods=['get'])
    def by_exam_subject(self, request):
        """Get all students with their results for an exam subject."""
        exam_subject_id = request.query_params.get('exam_subject')
        
        if not exam_subject_id:
            return Response({'error': 'exam_subject is required.'}, status=400)
        
        try:
            exam_subject = ExamSubject.objects.get(id=exam_subject_id)
        except ExamSubject.DoesNotExist:
            return Response({'error': 'Exam subject not found.'}, status=404)
        
        # Get all students in the class
        students = Student.objects.filter(
            current_class=exam_subject.school_class,
            status='active'
        ).select_related('user').order_by('roll_number')
        
        # Get existing results
        results = {
            r.student_id: r
            for r in ExamResult.objects.filter(exam_subject=exam_subject)
        }
        
        data = []
        for student in students:
            result = results.get(student.id)
            data.append({
                'student_id': student.id,
                'student_name': student.full_name,
                'admission_number': student.admission_number,
                'roll_number': student.roll_number,
                'marks_obtained': result.marks_obtained if result else None,
                'is_absent': result.is_absent if result else False,
                'grade': result.grade if result else None,
                'result_id': result.id if result else None
            })
        
        return Response({
            'exam_subject': ExamSubjectSerializer(exam_subject).data,
            'students': data
        })


class ReportCardViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for report cards."""
    serializer_class = ReportCardSerializer
    permission_classes = [ExamsFeatureEnabled, IsSchoolStaff]
    
    def get_queryset(self):
        return ReportCard.objects.filter(
            exam__school=self.request.user.school
        ).select_related('exam', 'student')
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download report card PDF."""
        report_card = self.get_object()
        
        # Generate PDF
        pdf_buffer = generate_report_card_pdf(report_card)
        
        # Return PDF response
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f"report_card_{report_card.student.admission_number}_{report_card.exam.name}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate report card PDF."""
        report_card = self.get_object()
        
        # Regenerate stats
        results = ExamResult.objects.filter(
            exam_subject__exam=report_card.exam,
            student=report_card.student
        )
        
        total_max = results.aggregate(
            total=Sum('exam_subject__max_marks')
        )['total'] or 0
        
        total_obtained = results.aggregate(
            total=Sum('marks_obtained')
        )['total'] or 0
        
        percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
        
        report_card.total_marks = total_max
        report_card.obtained_marks = total_obtained
        report_card.percentage = percentage
        report_card.generated_at = timezone.now()
        report_card.save()
        
        return Response(ReportCardSerializer(report_card).data)


class StudentExamResultsView(APIView):
    """View exam results for a student (Student/Parent view)."""
    permission_classes = [ExamsFeatureEnabled, IsStudent]
    
    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        # Get published exams with results
        exams_data = []
        
        exams = Exam.objects.filter(
            school=student.school,
            is_published=True
        ).order_by('-published_at')
        
        for exam in exams:
            results = ExamResult.objects.filter(
                exam_subject__exam=exam,
                student=student
            ).select_related('exam_subject', 'exam_subject__subject')
            
            if not results.exists():
                continue
            
            total_max = results.aggregate(
                total=Sum('exam_subject__max_marks')
            )['total'] or 0
            
            total_obtained = results.aggregate(
                total=Sum('marks_obtained')
            )['total'] or 0
            
            percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
            
            # Get report card
            report_card = ReportCard.objects.filter(
                exam=exam, student=student
            ).first()
            
            exams_data.append({
                'exam_id': exam.id,
                'exam_name': exam.name,
                'exam_type': exam.get_exam_type_display(),
                'total_marks': total_max,
                'obtained_marks': total_obtained,
                'percentage': percentage,
                'grade': report_card.grade if report_card else None,
                'rank': report_card.rank if report_card else None,
                'results': ExamResultSerializer(results, many=True).data,
                'report_card_id': report_card.id if report_card else None
            })
        
        return Response(exams_data)


class StudentReportCardDownloadView(APIView):
    """Download report card PDF for student."""
    permission_classes = [ExamsFeatureEnabled, IsStudent]
    
    def get(self, request, report_card_id):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        try:
            report_card = ReportCard.objects.get(id=report_card_id, student=student)
        except ReportCard.DoesNotExist:
            return Response({'error': 'Report card not found.'}, status=404)
        
        # Generate PDF
        pdf_buffer = generate_report_card_pdf(report_card)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f"report_card_{student.admission_number}_{report_card.exam.name}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
