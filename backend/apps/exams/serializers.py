"""
Serializers for Exam Management.
"""
from rest_framework import serializers
from .models import Exam, ExamSubject, ExamResult, ReportCard


class ExamSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    
    class Meta:
        model = ExamSubject
        fields = [
            'id', 'exam', 'subject', 'subject_name', 'school_class', 'class_name',
            'max_marks', 'passing_marks', 'exam_date'
        ]
        read_only_fields = ['id']


class ExamSerializer(serializers.ModelSerializer):
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    exam_subjects = ExamSubjectSerializer(many=True, read_only=True)
    class_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_type', 'exam_type_display',
            'academic_year', 'academic_year_name',
            'classes', 'class_names', 'start_date', 'end_date',
            'is_published', 'published_at', 'description',
            'exam_subjects', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'published_at', 'created_at', 'updated_at']
    
    def get_class_names(self, obj):
        return [c.name for c in obj.classes.all()]


class ExamCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = [
            'name', 'exam_type', 'academic_year', 'classes',
            'start_date', 'end_date', 'description'
        ]


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    subject_name = serializers.CharField(source='exam_subject.subject.name', read_only=True)
    max_marks = serializers.DecimalField(
        source='exam_subject.max_marks',
        max_digits=5, decimal_places=2, read_only=True
    )
    passing_marks = serializers.DecimalField(
        source='exam_subject.passing_marks',
        max_digits=5, decimal_places=2, read_only=True
    )
    grade = serializers.CharField(read_only=True)
    percentage = serializers.FloatField(read_only=True)
    is_passed = serializers.BooleanField(read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.get_full_name', read_only=True)
    
    class Meta:
        model = ExamResult
        fields = [
            'id', 'exam_subject', 'student', 'student_name', 'admission_number',
            'subject_name', 'marks_obtained', 'max_marks', 'passing_marks',
            'is_absent', 'grade', 'percentage', 'is_passed', 'remarks',
            'entered_by', 'entered_by_name', 'entered_at', 'updated_at'
        ]
        read_only_fields = ['id', 'entered_by', 'entered_at', 'updated_at']


class BulkMarksEntrySerializer(serializers.Serializer):
    """Serializer for entering marks for multiple students."""
    exam_subject = serializers.IntegerField()
    results = serializers.ListField(
        child=serializers.DictField()
    )
    # Expected format:
    # {
    #   "exam_subject": 1,
    #   "results": [
    #     {"student_id": 1, "marks_obtained": 85, "is_absent": false},
    #     {"student_id": 2, "marks_obtained": null, "is_absent": true}
    #   ]
    # }


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.CharField(source='student.class_name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    
    class Meta:
        model = ReportCard
        fields = [
            'id', 'exam', 'exam_name', 'student', 'student_name',
            'admission_number', 'class_name',
            'total_marks', 'obtained_marks', 'percentage', 'grade', 'rank',
            'pdf_file', 'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']


class StudentExamResultSerializer(serializers.Serializer):
    """Serializer for student's exam results view."""
    exam_id = serializers.IntegerField()
    exam_name = serializers.CharField()
    exam_type = serializers.CharField()
    total_marks = serializers.DecimalField(max_digits=7, decimal_places=2)
    obtained_marks = serializers.DecimalField(max_digits=7, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    grade = serializers.CharField()
    rank = serializers.IntegerField(allow_null=True)
    results = ExamResultSerializer(many=True)
    report_card_id = serializers.IntegerField(allow_null=True)
