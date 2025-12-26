"""
Models for Attendance tracking.
"""
from django.db import models
from django.conf import settings


class StudentAttendance(models.Model):
    """Daily attendance for students."""
    
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='student_attendances'
    )
    student = models.ForeignKey(
        'academic.Student',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    section = models.ForeignKey(
        'academic.Section',
        on_delete=models.CASCADE,
        related_name='student_attendances'
    )
    date = models.DateField()
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRESENT
    )
    
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_student_attendances'
    )
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For absent alert system
    alert_scheduled = models.BooleanField(default=False)
    alert_sent = models.BooleanField(default=False)
    alert_cancelled = models.BooleanField(default=False)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'student_attendances'
        unique_together = ['student', 'date']
        ordering = ['-date', 'student__roll_number']
    
    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"


class TeacherAttendance(models.Model):
    """Daily attendance for teachers."""
    
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
        ON_LEAVE = 'on_leave', 'On Leave'
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='teacher_attendances'
    )
    teacher = models.ForeignKey(
        'academic.Teacher',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    date = models.DateField()
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRESENT
    )
    
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_teacher_attendances'
    )
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'teacher_attendances'
        unique_together = ['teacher', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.teacher} - {self.date} - {self.status}"


class AbsentAlert(models.Model):
    """Tracks absent alerts sent to parents."""
    
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        SENT = 'sent', 'Sent'
        CANCELLED = 'cancelled', 'Cancelled'
        FAILED = 'failed', 'Failed'
    
    attendance = models.OneToOneField(
        StudentAttendance,
        on_delete=models.CASCADE,
        related_name='absent_alert'
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )
    
    scheduled_at = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Contact info used
    parent_phone = models.CharField(max_length=20, blank=True, null=True)
    parent_email = models.EmailField(blank=True, null=True)
    
    # Response tracking
    message_sent = models.TextField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'absent_alerts'
        ordering = ['-scheduled_at']
    
    def __str__(self):
        return f"Alert for {self.attendance.student} - {self.status}"
