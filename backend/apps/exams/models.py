"""
Models for Exam and Results Management.
"""
from django.db import models
from django.conf import settings


class Exam(models.Model):
    """Exam definition."""
    
    class ExamType(models.TextChoices):
        UNIT_TEST = 'unit_test', 'Unit Test'
        MIDTERM = 'midterm', 'Mid Term'
        QUARTERLY = 'quarterly', 'Quarterly'
        HALF_YEARLY = 'half_yearly', 'Half Yearly'
        ANNUAL = 'annual', 'Annual'
        OTHER = 'other', 'Other'
    
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='exams'
    )
    academic_year = models.ForeignKey(
        'academic.AcademicYear',
        on_delete=models.CASCADE,
        related_name='exams'
    )
    
    name = models.CharField(max_length=100)
    exam_type = models.CharField(
        max_length=20,
        choices=ExamType.choices,
        default=ExamType.UNIT_TEST
    )
    
    # Classes this exam applies to
    classes = models.ManyToManyField(
        'academic.Class',
        related_name='exams'
    )
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    description = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exams'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"


class ExamSubject(models.Model):
    """Subject configuration for an exam."""
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='exam_subjects'
    )
    subject = models.ForeignKey(
        'academic.Subject',
        on_delete=models.CASCADE,
        related_name='exam_configs'
    )
    school_class = models.ForeignKey(
        'academic.Class',
        on_delete=models.CASCADE,
        related_name='exam_subjects'
    )
    
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    passing_marks = models.DecimalField(max_digits=5, decimal_places=2, default=35)
    
    exam_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'exam_subjects'
        unique_together = ['exam', 'subject', 'school_class']
    
    def __str__(self):
        return f"{self.exam.name} - {self.subject.name} ({self.school_class.name})"


class ExamResult(models.Model):
    """Individual student result for a subject in an exam."""
    
    exam_subject = models.ForeignKey(
        ExamSubject,
        on_delete=models.CASCADE,
        related_name='results'
    )
    student = models.ForeignKey(
        'academic.Student',
        on_delete=models.CASCADE,
        related_name='exam_results'
    )
    
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_absent = models.BooleanField(default=False)
    
    remarks = models.CharField(max_length=200, blank=True, null=True)
    
    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='entered_results'
    )
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exam_results'
        unique_together = ['exam_subject', 'student']
    
    def __str__(self):
        return f"{self.student} - {self.exam_subject.subject.name} - {self.marks_obtained}"
    
    @property
    def is_passed(self):
        if self.is_absent or self.marks_obtained is None:
            return False
        return self.marks_obtained >= self.exam_subject.passing_marks
    
    @property
    def percentage(self):
        if self.is_absent or self.marks_obtained is None:
            return 0
        return round((self.marks_obtained / self.exam_subject.max_marks) * 100, 2)
    
    @property
    def grade(self):
        """Calculate grade based on percentage."""
        pct = self.percentage
        if pct >= 90:
            return 'A+'
        elif pct >= 80:
            return 'A'
        elif pct >= 70:
            return 'B+'
        elif pct >= 60:
            return 'B'
        elif pct >= 50:
            return 'C'
        elif pct >= 35:
            return 'D'
        else:
            return 'F'


class ReportCard(models.Model):
    """Generated report card for a student."""
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='report_cards'
    )
    student = models.ForeignKey(
        'academic.Student',
        on_delete=models.CASCADE,
        related_name='report_cards'
    )
    
    total_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    obtained_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True, null=True)
    rank = models.IntegerField(null=True, blank=True)
    
    # PDF storage
    pdf_file = models.FileField(upload_to='report_cards/', blank=True, null=True)
    
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'report_cards'
        unique_together = ['exam', 'student']
    
    def __str__(self):
        return f"{self.student} - {self.exam.name}"
