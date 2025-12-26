"""
Serializers for Fee Management.
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone

from .models import FeeStructure, FeeRecord, FeePayment


class FeeStructureSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'school_class', 'class_name', 'fee_type', 'fee_type_display',
            'name', 'amount', 'is_monthly', 'due_day', 'is_active'
        ]
        read_only_fields = ['id']


class FeePaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)
    payment_mode_display = serializers.CharField(source='get_payment_mode_display', read_only=True)
    
    class Meta:
        model = FeePayment
        fields = [
            'id', 'fee_record', 'amount', 'payment_mode', 'payment_mode_display',
            'transaction_id', 'receipt_number', 'received_by', 'received_by_name',
            'payment_date', 'remarks', 'created_at'
        ]
        read_only_fields = ['id', 'received_by', 'created_at']


class FeeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.CharField(source='student.class_name', read_only=True)
    fee_name = serializers.CharField(source='fee_structure.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payments = FeePaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = FeeRecord
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'class_name',
            'fee_structure', 'fee_name', 'month', 'year',
            'amount', 'discount', 'fine', 'carry_forward',
            'total_amount', 'paid_amount', 'balance',
            'due_date', 'status', 'status_display', 'remarks',
            'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_amount', 'balance', 'created_at', 'updated_at'
        ]


class FeeRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeRecord
        fields = [
            'student', 'fee_structure', 'month', 'year',
            'amount', 'discount', 'fine', 'carry_forward',
            'due_date', 'remarks'
        ]
    
    def validate(self, data):
        # Check for duplicate
        if FeeRecord.objects.filter(
            student=data['student'],
            fee_structure=data.get('fee_structure'),
            month=data['month'],
            year=data['year']
        ).exists():
            raise serializers.ValidationError(
                'Fee record already exists for this student, month, and year.'
            )
        return data


class FeePaymentCreateSerializer(serializers.Serializer):
    """Serializer for recording a payment."""
    fee_record = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = serializers.ChoiceField(choices=FeePayment.PaymentMode.choices)
    payment_date = serializers.DateField(default=timezone.now().date)
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    receipt_number = serializers.CharField(required=False, allow_blank=True)
    remarks = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value
    
    def validate_fee_record(self, value):
        try:
            FeeRecord.objects.get(id=value)
        except FeeRecord.DoesNotExist:
            raise serializers.ValidationError('Fee record not found.')
        return value


class StudentFeesSummarySerializer(serializers.Serializer):
    """Summary of student's fee status."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    total_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_records = serializers.IntegerField()


class GenerateFeeRecordsSerializer(serializers.Serializer):
    """Serializer for bulk generating fee records."""
    class_id = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020)
    include_carry_forward = serializers.BooleanField(default=True)
