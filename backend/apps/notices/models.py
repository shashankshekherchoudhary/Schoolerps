"""
Models for Notices.
"""
from django.db import models
from django.conf import settings


class Notice(models.Model):
    """School notices/announcements."""
    
    class TargetAudience(models.TextChoices):
        ALL = 'all', 'All'
        STUDENTS = 'students', 'Students Only'
        TEACHERS = 'teachers', 'Teachers Only'
        PARENTS = 'parents', 'Parents Only'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='notices'
    )
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    target_audience = models.CharField(
        max_length=20,
        choices=TargetAudience.choices,
        default=TargetAudience.ALL
    )
    
    # Optional: target specific classes (Legacy - consider keeping for backward compat or migrating)
    target_classes = models.ManyToManyField(
        'academic.Class',
        blank=True,
        related_name='notices'
    )

    # Granular Targeting
    target_sections = models.ManyToManyField(
        'academic.Section',
        blank=True,
        related_name='notices'
    )
    
    target_subject = models.ForeignKey(
        'academic.Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notices'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL
    )
    
    is_published = models.BooleanField(default=True)
    publish_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    attachment = models.FileField(upload_to='notice_attachments/', blank=True, null=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_notices'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notices'
        ordering = ['-publish_date', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.school.name}"
