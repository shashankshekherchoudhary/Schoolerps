"""
Models for School management (Platform Admin features).
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model


class School(models.Model):
    """
    School model representing a tenant in the multi-tenant system.
    """
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
    
    class PlanType(models.TextChoices):
        TRIAL = 'trial', 'Trial'
        BASIC = 'basic', 'Basic'
        CUSTOM = 'custom', 'Custom'
    
    class AccountType(models.TextChoices):
        SCHOOL = 'school', 'School'
        TUITION = 'tuition', 'Tuition/Coaching'

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    
    # Account Type (School vs Tuition)
    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.SCHOOL
    )
    
    # Contact Info
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Branding
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    principal_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Plan & Subscription
    plan_name = models.CharField(
        max_length=20,
        choices=PlanType.choices,
        default=PlanType.TRIAL
    )
    plan_start_date = models.DateField(default=timezone.now)
    plan_expiry_date = models.DateField(null=True, blank=True)
    plan_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schools'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
        
    @property
    def is_tuition_center(self):
        return self.account_type == self.AccountType.TUITION
    
    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE
    
    @property
    def is_expired(self):
        if self.plan_expiry_date:
            return timezone.now().date() > self.plan_expiry_date
        return False
    
    def check_and_suspend_if_expired(self):
        """Auto-suspend if plan has expired."""
        if self.is_expired and self.status == self.Status.ACTIVE:
            self.status = self.Status.SUSPENDED
            self.save(update_fields=['status'])
            # Log activity
            ActivityLog.objects.create(
                school=self,
                action='school_auto_suspended',
                description=f'School auto-suspended due to plan expiry on {self.plan_expiry_date}'
            )
            return True
        return False


class FeatureToggle(models.Model):
    """
    Feature toggles for each school.
    Controls which features are enabled/disabled.
    """
    school = models.OneToOneField(
        School,
        on_delete=models.CASCADE,
        related_name='feature_toggle'
    )
    
    attendance_enabled = models.BooleanField(default=True)
    fees_enabled = models.BooleanField(default=True)
    exams_enabled = models.BooleanField(default=True)
    student_login_enabled = models.BooleanField(default=True)
    notes_enabled = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'feature_toggles'
    
    def __str__(self):
        return f"Features for {self.school.name}"


class ActivityLog(models.Model):
    """
    Activity log for platform-level actions.
    """
    
    class ActionType(models.TextChoices):
        SCHOOL_CREATED = 'school_created', 'School Created'
        SCHOOL_SUSPENDED = 'school_suspended', 'School Suspended'
        SCHOOL_ACTIVATED = 'school_activated', 'School Activated'
        SCHOOL_AUTO_SUSPENDED = 'school_auto_suspended', 'School Auto-Suspended'
        FEATURE_TOGGLED = 'feature_toggled', 'Feature Toggled'
        PLAN_CHANGED = 'plan_changed', 'Plan Changed'
        ADMIN_CREATED = 'admin_created', 'Admin Created'
        ADMIN_PASSWORD_RESET = 'admin_password_reset', 'Admin Password Reset'
    
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        null=True,
        blank=True
    )
    
    action = models.CharField(max_length=50, choices=ActionType.choices)
    description = models.TextField()
    performed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"


class SupportRequest(models.Model):
    """
    Support requests from schools.
    """
    
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
    
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='support_requests'
    )
    
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_support_requests'
    )
    
    resolved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_support_requests'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.school.name}"
