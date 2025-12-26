"""
Serializers for Notices.
"""
from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    target_audience_display = serializers.CharField(source='get_target_audience_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    target_class_names = serializers.SerializerMethodField()
    target_section_names = serializers.SerializerMethodField()
    target_subject_name = serializers.CharField(source='target_subject.name', read_only=True)
    
    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'target_audience', 'target_audience_display',
            'target_classes', 'target_class_names', 
            'target_sections', 'target_section_names',
            'target_subject', 'target_subject_name',
            'priority', 'priority_display',
            'is_published', 'publish_date', 'expiry_date', 'attachment',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_target_class_names(self, obj):
        return [c.name for c in obj.target_classes.all()]
    
    def get_target_section_names(self, obj):
        return [s.name for s in obj.target_sections.all()]


class NoticeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = [
            'title', 'content', 'target_audience', 'target_classes',
            'target_sections', 'target_subject',
            'priority', 'is_published', 'expiry_date', 'attachment'
        ]
