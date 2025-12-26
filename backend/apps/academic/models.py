"""
Models for Academic management.
Classes, Sections, Students, Teachers, Subjects.
"""
from django.db import models
from django.conf import settings


class AcademicYear(models.Model):
    """Academic year for the school."""
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='academic_years'
    )
    name = models.CharField(max_length=50)  # e.g., "2024-25"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'academic_years'
        unique_together = ['school', 'name']
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"
    
    def save(self, *args, **kwargs):
        # Ensure only one current year per school
        if self.is_current:
            AcademicYear.objects.filter(school=self.school, is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Class(models.Model):
    """Class/Grade in the school."""
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='classes'
    )
    name = models.CharField(max_length=50)  # e.g., "Class 10", "Grade 5"
    numeric_value = models.IntegerField(default=0)  # For ordering/comparison
    
    class Meta:
        db_table = 'classes'
        unique_together = ['school', 'name']
        ordering = ['numeric_value']
        verbose_name_plural = 'Classes'
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"


class Section(models.Model):
    """Section within a class."""
    school_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='sections'
    )
    name = models.CharField(max_length=10)  # e.g., "A", "B", "C"
    
    class Meta:
        db_table = 'sections'
        unique_together = ['school_class', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.school_class.name} - {self.name}"
    
    @property
    def school(self):
        return self.school_class.school


class Subject(models.Model):
    """Subject taught in the school."""
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='subjects'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'subjects'
        unique_together = ['school', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"


class Teacher(models.Model):
    """Teacher profile linked to User."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_profile'
    )
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='teachers'
    )
    
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    qualification = models.CharField(max_length=200, blank=True, null=True)
    date_of_joining = models.DateField(blank=True, null=True)
    
    # Subjects the teacher can teach
    subjects = models.ManyToManyField(Subject, related_name='teachers', blank=True)
    
    class Meta:
        db_table = 'teachers'
        ordering = ['user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.school.name}"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email
    
    @property
    def phone(self):
        return self.user.phone


class ClassTeacher(models.Model):
    """Class teacher assignment (one per section)."""
    section = models.OneToOneField(
        Section,
        on_delete=models.CASCADE,
        related_name='class_teacher_assignment'
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='class_teacher_of'
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='class_teachers'
    )
    
    class Meta:
        db_table = 'class_teachers'
        unique_together = ['section', 'academic_year']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.section}"


class SubjectTeacher(models.Model):
    """Subject teacher assignment per class/section."""
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='subject_teachers'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='class_assignments'
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='subject_assignments'
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='subject_teachers'
    )
    
    class Meta:
        db_table = 'subject_teachers'
        unique_together = ['section', 'subject', 'academic_year']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.subject.name} ({self.section})"


class Student(models.Model):
    """Student profile linked to User."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        TRANSFERRED = 'transferred', 'Transferred'
        GRADUATED = 'graduated', 'Graduated'
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='students'
    )
    
    admission_number = models.CharField(max_length=50)
    admission_date = models.DateField(blank=True, null=True)
    
    # Current class assignment
    current_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    current_section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    roll_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Personal Details
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True,
        null=True
    )
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Parent/Guardian Details
    parent_name = models.CharField(max_length=100, blank=True, null=True)
    parent_phone = models.CharField(max_length=20, blank=True, null=True)
    parent_email = models.EmailField(blank=True, null=True)
    parent_occupation = models.CharField(max_length=100, blank=True, null=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    class Meta:
        db_table = 'students'
        unique_together = ['school', 'admission_number']
        ordering = ['current_class__numeric_value', 'current_section__name', 'roll_number']
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.admission_number})"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email
    
        if self.current_class and self.current_section:
            return f"{self.current_class.name} - {self.current_section.name}"
        return None


class StudyMaterial(models.Model):
    """
    Study materials/Notes uploaded by teachers.
    Part of the Paid Feature set.
    """
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='study_materials'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='study_materials/')
    
    # Targeting
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='study_materials',
        null=True,
        blank=True,
        help_text="Target specific Batch/Section"
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='study_materials',
        null=True,
        blank=True
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_materials'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'study_materials'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.school.name}"
