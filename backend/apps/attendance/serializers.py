"""
Serializers for Attendance.
"""
from rest_framework import serializers
from .models import StudentAttendance, TeacherAttendance, AbsentAlert


class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StudentAttendance
        fields = [
            'id', 'student', 'student_name', 'admission_number', 'roll_number',
            'section', 'date', 'status', 'status_display',
            'marked_by', 'marked_by_name', 'marked_at', 'remarks',
            'alert_scheduled', 'alert_sent', 'alert_cancelled'
        ]
        read_only_fields = ['id', 'marked_at', 'alert_scheduled', 'alert_sent', 'alert_cancelled']


class BulkStudentAttendanceSerializer(serializers.Serializer):
    """Serializer for marking attendance for multiple students."""
    section = serializers.IntegerField()
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    # Expected format:
    # {
    #   "section": 1,
    #   "date": "2024-12-22",
    #   "attendances": [
    #     {"student_id": 1, "status": "present"},
    #     {"student_id": 2, "status": "absent", "remarks": "Sick"}
    #   ]
    # }


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TeacherAttendance
        fields = [
            'id', 'teacher', 'teacher_name', 'date',
            'status', 'status_display',
            'marked_by', 'marked_by_name', 'marked_at', 'remarks'
        ]
        read_only_fields = ['id', 'marked_at']


class BulkTeacherAttendanceSerializer(serializers.Serializer):
    """Serializer for marking attendance for multiple teachers."""
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )


class AbsentAlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='attendance.student.full_name', read_only=True)
    date = serializers.DateField(source='attendance.date', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AbsentAlert
        fields = [
            'id', 'attendance', 'student_name', 'date',
            'status', 'status_display', 'scheduled_at', 'sent_at',
            'parent_phone', 'parent_email', 'message_sent', 'error_message'
        ]


class AttendanceReportSerializer(serializers.Serializer):
    """Serializer for attendance reports."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    percentage = serializers.FloatField()
