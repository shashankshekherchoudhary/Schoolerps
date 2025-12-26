"""
Serializers for Academic management.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import (
    AcademicYear, Class, Section, Subject,
    Teacher, ClassTeacher, SubjectTeacher, Student
)

User = get_user_model()


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current']
        read_only_fields = ['id']


class SectionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'school_class', 'class_name']
        read_only_fields = ['id']


class ClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'numeric_value', 'sections', 'student_count']
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Check for duplicate class names within the same school."""
        school = self.context.get('request').user.school if self.context.get('request') else None
        if school and self.instance is None:  # Only on create
            if Class.objects.filter(school=school, name__iexact=value).exists():
                raise serializers.ValidationError(f'Class "{value}" already exists.')
        return value
    
    def get_student_count(self, obj):
        return Student.objects.filter(current_class=obj, status='active').count()


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code']
        read_only_fields = ['id']


class TeacherListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for teacher lists."""
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    subjects_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'full_name', 'email', 'phone', 'employee_id',
            'is_active', 'subjects_list'
        ]
    
    def get_subjects_list(self, obj):
        return [{'id': s.id, 'name': s.name} for s in obj.subjects.all()]


class TeacherSerializer(serializers.ModelSerializer):
    """Full teacher serializer."""
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    subjects_data = SubjectSerializer(source='subjects', many=True, read_only=True)
    class_teacher_of = serializers.SerializerMethodField()
    subject_assignments_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'employee_id', 'qualification',
            'date_of_joining', 'subjects', 'subjects_data',
            'is_active', 'class_teacher_of', 'subject_assignments_data'
        ]
        read_only_fields = ['id', 'user']
    
    def get_class_teacher_of(self, obj):
        assignment = obj.class_teacher_of.first()
        if assignment:
            return {
                'section_id': assignment.section.id,
                'section_name': str(assignment.section)
            }
        return None
    
    def get_subject_assignments_data(self, obj):
        assignments = obj.subject_assignments.select_related('section', 'subject')
        return [{
            'section': str(a.section),
            'subject': a.subject.name
        } for a in assignments]


class TeacherCreateSerializer(serializers.Serializer):
    """Serializer for creating a teacher with user account."""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=10, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    def validate_phone(self, value):
        from apps.core.validators import validate_phone_serializer
        if value:
            return validate_phone_serializer(value)
        return value
    
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    qualification = serializers.CharField(max_length=200, required=False, allow_blank=True)
    date_of_joining = serializers.DateField(
        required=False, 
        allow_null=True,
        input_formats=['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y', 'iso-8601']
    )
    subjects = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=[]
    )
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        school = self.context['school']
        subjects = validated_data.pop('subjects', [])
        
        # Create user
        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            first_name=validated_data.pop('first_name'),
            last_name=validated_data.pop('last_name'),
            phone=validated_data.pop('phone', ''),
            role='teacher',
            school=school
        )
        
        # Create teacher profile
        teacher = Teacher.objects.create(
            user=user,
            school=school,
            employee_id=validated_data.get('employee_id', ''),
            qualification=validated_data.get('qualification', ''),
            date_of_joining=validated_data.get('date_of_joining')
        )
        
        # Assign subjects
        if subjects:
            teacher.subjects.set(Subject.objects.filter(id__in=subjects, school=school))
        
        return teacher


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student lists."""
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    class_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'full_name', 'email', 'admission_number',
            'current_class', 'current_section', 'class_name',
            'roll_number', 'parent_phone', 'status', 'is_active'
        ]


class StudentSerializer(serializers.ModelSerializer):
    """Full student serializer."""
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    class_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'full_name', 'first_name', 'last_name', 'email', 'phone',
            'admission_number', 'admission_date', 'current_class', 'current_section',
            'class_name', 'roll_number', 'date_of_birth', 'gender', 'blood_group',
            'address', 'parent_name', 'parent_phone', 'parent_email',
            'parent_occupation', 'emergency_contact_name', 'emergency_contact_phone',
            'status', 'is_active'
        ]
        read_only_fields = ['id', 'user', 'roll_number']


class StudentCreateSerializer(serializers.Serializer):
    """Serializer for creating a student with user account."""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    admission_number = serializers.CharField(max_length=50)
    admission_date = serializers.DateField(required=False, allow_null=True)
    current_class = serializers.IntegerField(required=False, allow_null=True)
    current_section = serializers.IntegerField(required=False, allow_null=True)
    # roll_number is auto-assigned based on alphabetical order
    
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=['male', 'female', 'other'], required=False, allow_null=True)
    blood_group = serializers.CharField(max_length=10, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    parent_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    parent_phone = serializers.CharField(max_length=10, required=False, allow_blank=True)
    parent_email = serializers.EmailField(required=False, allow_blank=True)
    parent_occupation = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_phone(self, value):
        from apps.core.validators import validate_phone_serializer
        if value:
            return validate_phone_serializer(value)
        return value
    
    def validate_parent_phone(self, value):
        from apps.core.validators import validate_phone_serializer
        if value:
            return validate_phone_serializer(value)
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value
    
    def validate_admission_number(self, value):
        school = self.context['school']
        if Student.objects.filter(school=school, admission_number=value).exists():
            raise serializers.ValidationError('Admission number already exists.')
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        school = self.context['school']
        
        # Extract class and section IDs
        class_id = validated_data.pop('current_class', None)
        section_id = validated_data.pop('current_section', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            first_name=validated_data.pop('first_name'),
            last_name=validated_data.pop('last_name'),
            phone=validated_data.pop('phone', ''),
            role='student',
            school=school
        )
        
        # Create student profile (roll_number auto-assigned by signal)
        student = Student.objects.create(
            user=user,
            school=school,
            admission_number=validated_data.pop('admission_number'),
            admission_date=validated_data.get('admission_date'),
            current_class_id=class_id,
            current_section_id=section_id,
            date_of_birth=validated_data.get('date_of_birth'),
            gender=validated_data.get('gender'),
            blood_group=validated_data.get('blood_group', ''),
            address=validated_data.get('address', ''),
            parent_name=validated_data.get('parent_name', ''),
            parent_phone=validated_data.get('parent_phone', ''),
            parent_email=validated_data.get('parent_email', ''),
            parent_occupation=validated_data.get('parent_occupation', '')
        )
        
        return student


class ClassTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    section_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassTeacher
        fields = ['id', 'section', 'section_name', 'teacher', 'teacher_name', 'academic_year']
    
    def get_section_name(self, obj):
        return str(obj.section)


class SubjectTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    section_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = SubjectTeacher
        fields = [
            'id', 'section', 'section_name', 'subject', 'subject_name',
            'teacher', 'teacher_name', 'academic_year'
        ]
    
    def get_section_name(self, obj):
        return str(obj.section)


class SchoolDashboardSerializer(serializers.Serializer):
    """Serializer for school admin dashboard stats."""
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    student_attendance_today = serializers.DictField()
    teacher_attendance_today = serializers.DictField()
    pending_fees = serializers.DecimalField(max_digits=12, decimal_places=2)


class StudyMaterialSerializer(serializers.ModelSerializer):
    """Serializer for Study Materials."""
    section_name = serializers.CharField(source='section.name', read_only=True)
    batch_name = serializers.CharField(source='section.school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        from .models import StudyMaterial
        model = StudyMaterial
        fields = [
            'id', 'title', 'description', 'file', 
            'section', 'section_name', 'batch_name', 
            'subject', 'subject_name', 
            'created_at', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
