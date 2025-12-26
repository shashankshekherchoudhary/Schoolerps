"""
Models for Fee Management.
"""
from django.db import models
from django.conf import settings
from decimal import Decimal


class FeeStructure(models.Model):
    """Fee structure per class."""
    
    class FeeType(models.TextChoices):
        TUITION = 'tuition', 'Tuition Fee'
        ADMISSION = 'admission', 'Admission Fee'
        EXAM = 'exam', 'Exam Fee'
        LAB = 'lab', 'Lab Fee'
        LIBRARY = 'library', 'Library Fee'
        TRANSPORT = 'transport', 'Transport Fee'
        SPORTS = 'sports', 'Sports Fee'
        OTHER = 'other', 'Other'
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='fee_structures'
    )
    school_class = models.ForeignKey(
        'academic.Class',
        on_delete=models.CASCADE,
        related_name='fee_structures'
    )
    
    fee_type = models.CharField(
        max_length=20,
        choices=FeeType.choices,
        default=FeeType.TUITION
    )
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Billing cycle
    is_monthly = models.BooleanField(default=True)
    due_day = models.IntegerField(default=10)  # Day of month when due
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_structures'
        ordering = ['school_class__numeric_value', 'fee_type']
    
    def __str__(self):
        return f"{self.name} - {self.school_class.name} - ₹{self.amount}"


class FeeRecord(models.Model):
    """Monthly fee record for a student."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PARTIAL = 'partial', 'Partially Paid'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        WAIVED = 'waived', 'Waived'
    
    student = models.ForeignKey(
        'academic.Student',
        on_delete=models.CASCADE,
        related_name='fee_records'
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.SET_NULL,
        null=True,
        related_name='records'
    )
    
    # Period
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    
    # Amounts
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fine = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Carry forward from previous
    carry_forward = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Total = amount - discount + fine + carry_forward
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fee_records'
        unique_together = ['student', 'fee_structure', 'month', 'year']
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.student} - {self.month}/{self.year} - {self.status}"
    
    def save(self, *args, **kwargs):
        # Calculate total and balance
        self.total_amount = self.amount - self.discount + self.fine + self.carry_forward
        self.balance = self.total_amount - self.paid_amount
        
        # Update status
        if self.balance <= 0:
            self.status = self.Status.PAID
            self.balance = Decimal('0.00')
        elif self.paid_amount > 0:
            self.status = self.Status.PARTIAL
        
        super().save(*args, **kwargs)
    
    def calculate_carry_forward(self):
        """Get carry forward from previous month's unpaid balance."""
        from django.db.models import Sum
        
        # Get previous records' unpaid balance
        prev_records = FeeRecord.objects.filter(
            student=self.student,
            status__in=['pending', 'partial', 'overdue']
        ).exclude(pk=self.pk)
        
        total_balance = prev_records.aggregate(total=Sum('balance'))['total']
        return total_balance or Decimal('0.00')


class FeePayment(models.Model):
    """Payment transaction for fees."""
    
    class PaymentMode(models.TextChoices):
        CASH = 'cash', 'Cash'
        CHEQUE = 'cheque', 'Cheque'
        ONLINE = 'online', 'Online/UPI'
        CARD = 'card', 'Card'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    
    fee_record = models.ForeignKey(
        FeeRecord,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.CASH
    )
    
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='fee_payments_received'
    )
    
    payment_date = models.DateField()
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fee_payments'
        ordering = ['-payment_date', '-created_at']
    
    def __str__(self):
        return f"₹{self.amount} - {self.fee_record.student} - {self.payment_date}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update fee record paid amount
        total_paid = self.fee_record.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        self.fee_record.paid_amount = total_paid
        self.fee_record.save()
