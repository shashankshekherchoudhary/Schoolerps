from django.contrib import admin
from .models import Notice


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['title', 'school', 'target_audience', 'priority', 'is_published', 'publish_date']
    list_filter = ['target_audience', 'priority', 'is_published', 'school']
    search_fields = ['title', 'content']
