"""
Views for Fee Management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
from datetime import date

from apps.accounts.permissions import (
    IsSchoolAdmin, IsAccountAdmin, IsSchoolStaff, IsStudent,
    FeesFeatureEnabled
)
from apps.academic.models import Student, Class
from .models import FeeStructure, FeeRecord, FeePayment
from .serializers import (
    FeeStructureSerializer, FeeRecordSerializer, FeeRecordCreateSerializer,
    FeePaymentSerializer, FeePaymentCreateSerializer,
    StudentFeesSummarySerializer, GenerateFeeRecordsSerializer
)


class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for fee structure management."""
    serializer_class = FeeStructureSerializer
    permission_classes = [FeesFeatureEnabled, IsSchoolAdmin]
    
    def get_queryset(self):
        queryset = FeeStructure.objects.filter(
            school=self.request.user.school
        ).select_related('school_class')
        
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class FeeRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for fee records."""
    permission_classes = [FeesFeatureEnabled]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_bulk']:
            return [FeesFeatureEnabled(), IsSchoolAdmin()]
        return [FeesFeatureEnabled(), IsSchoolStaff()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FeeRecordCreateSerializer
        return FeeRecordSerializer
    
    def get_queryset(self):
        queryset = FeeRecord.objects.filter(
            student__school=self.request.user.school
        ).select_related('student', 'fee_structure')
        
        # Filters
        student_id = self.request.query_params.get('student')
        class_id = self.request.query_params.get('class')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        status_filter = self.request.query_params.get('status')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(student__current_class_id=class_id)
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate_bulk(self, request):
        """Generate fee records for all students in a class for a month."""
        serializer = GenerateFeeRecordsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        class_id = data['class_id']
        month = data['month']
        year = data['year']
        include_carry_forward = data['include_carry_forward']
        
        # Get fee structures for this class
        fee_structures = FeeStructure.objects.filter(
            school=request.user.school,
            school_class_id=class_id,
            is_active=True
        )
        
        if not fee_structures.exists():
            return Response(
                {'error': 'No fee structures found for this class.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all active students in this class
        students = Student.objects.filter(
            school=request.user.school,
            current_class_id=class_id,
            status='active'
        )
        
        created_count = 0
        skipped_count = 0
        
        for student in students:
            for fee_structure in fee_structures:
                # Calculate due date
                due_date = date(year, month, fee_structure.due_day)
                
                # Calculate carry forward
                carry_forward = Decimal('0.00')
                if include_carry_forward:
                    prev_balance = FeeRecord.objects.filter(
                        student=student,
                        status__in=['pending', 'partial', 'overdue']
                    ).aggregate(total=Sum('balance'))['total']
                    carry_forward = prev_balance or Decimal('0.00')
                
                # Create or skip
                _, created = FeeRecord.objects.get_or_create(
                    student=student,
                    fee_structure=fee_structure,
                    month=month,
                    year=year,
                    defaults={
                        'amount': fee_structure.amount,
                        'carry_forward': carry_forward,
                        'due_date': due_date,
                        'total_amount': fee_structure.amount + carry_forward,
                        'balance': fee_structure.amount + carry_forward
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    skipped_count += 1
        
        return Response({
            'message': 'Fee records generated successfully.',
            'created': created_count,
            'skipped': skipped_count
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending fee records."""
        queryset = self.get_queryset().filter(
            status__in=['pending', 'partial', 'overdue']
        )
        
        # Group by student
        students_data = []
        student_ids = queryset.values_list('student_id', flat=True).distinct()
        
        for student_id in student_ids:
            student_records = queryset.filter(student_id=student_id)
            student = student_records.first().student
            
            totals = student_records.aggregate(
                total=Sum('total_amount'),
                paid=Sum('paid_amount'),
                balance=Sum('balance')
            )
            
            students_data.append({
                'student_id': student_id,
                'student_name': student.full_name,
                'admission_number': student.admission_number,
                'class_name': student.class_name,
                'total_fees': totals['total'] or 0,
                'total_paid': totals['paid'] or 0,
                'total_balance': totals['balance'] or 0,
                'pending_records': student_records.count()
            })
        
        return Response(students_data)


class FeePaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for fee payments (Account Admin)."""
    serializer_class = FeePaymentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'record_payment']:
            return [FeesFeatureEnabled(), (IsSchoolAdmin | IsAccountAdmin)()]
        return [FeesFeatureEnabled(), IsSchoolStaff()]
    
    def get_queryset(self):
        return FeePayment.objects.filter(
            fee_record__student__school=self.request.user.school
        ).select_related('fee_record', 'received_by')
    
    @action(detail=False, methods=['post'])
    def record_payment(self, request):
        """Record a payment for a fee record."""
        serializer = FeePaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        fee_record = FeeRecord.objects.get(id=data['fee_record'])
        
        # Create payment
        payment = FeePayment.objects.create(
            fee_record=fee_record,
            amount=data['amount'],
            payment_mode=data['payment_mode'],
            payment_date=data.get('payment_date', timezone.now().date()),
            transaction_id=data.get('transaction_id', ''),
            receipt_number=data.get('receipt_number', ''),
            received_by=request.user,
            remarks=data.get('remarks', '')
        )
        
        return Response(
            FeePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )


class AccountAdminDashboardView(APIView):
    """Dashboard for Account Admin."""
    permission_classes = [FeesFeatureEnabled, (IsSchoolAdmin | IsAccountAdmin)]
    
    def get(self, request):
        school = request.user.school
        today = timezone.now().date()
        current_month = today.month
        current_year = today.year
        
        # Pending fees
        pending = FeeRecord.objects.filter(
            student__school=school,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(
            total_balance=Sum('balance'),
            total_records=Sum('id')
        )
        
        # This month's collection
        this_month_collection = FeePayment.objects.filter(
            fee_record__student__school=school,
            payment_date__month=current_month,
            payment_date__year=current_year
        ).aggregate(total=Sum('amount'))
        
        # Today's collection
        today_collection = FeePayment.objects.filter(
            fee_record__student__school=school,
            payment_date=today
        ).aggregate(total=Sum('amount'))
        
        # Overdue records
        overdue_records = FeeRecord.objects.filter(
            student__school=school,
            due_date__lt=today,
            status__in=['pending', 'partial']
        ).count()
        
        return Response({
            'pending_balance': pending['total_balance'] or 0,
            'pending_records': pending['total_records'] or 0,
            'this_month_collection': this_month_collection['total'] or 0,
            'today_collection': today_collection['total'] or 0,
            'overdue_records': overdue_records
        })


class StudentFeesView(APIView):
    """View fees for a student (Student/Parent view)."""
    permission_classes = [FeesFeatureEnabled, IsStudent]
    
    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=404)
        
        # Get fee records
        records = FeeRecord.objects.filter(
            student=student
        ).select_related('fee_structure').prefetch_related('payments')
        
        # Summary
        totals = records.aggregate(
            total_fees=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
            total_balance=Sum('balance')
        )
        
        pending_records = records.filter(status__in=['pending', 'partial', 'overdue'])
        
        return Response({
            'summary': {
                'total_fees': totals['total_fees'] or 0,
                'total_paid': totals['total_paid'] or 0,
                'total_balance': totals['total_balance'] or 0,
                'pending_count': pending_records.count()
            },
            'pending_records': FeeRecordSerializer(pending_records, many=True).data,
            'all_records': FeeRecordSerializer(records[:20], many=True).data
        })
