from django.contrib import admin
from .models import FeeStructure, FeeRecord, FeePayment


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'school', 'school_class', 'fee_type', 'amount', 'is_active']
    list_filter = ['fee_type', 'is_active', 'school']


@admin.register(FeeRecord)
class FeeRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'month', 'year', 'total_amount', 'paid_amount', 'balance', 'status']
    list_filter = ['status', 'month', 'year']
    search_fields = ['student__user__first_name', 'student__admission_number']


@admin.register(FeePayment)
class FeePaymentAdmin(admin.ModelAdmin):
    list_display = ['fee_record', 'amount', 'payment_mode', 'payment_date', 'received_by']
    list_filter = ['payment_mode', 'payment_date']
