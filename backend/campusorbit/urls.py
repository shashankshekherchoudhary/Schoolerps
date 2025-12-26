"""
URL configuration for Campusorbit project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import HttpResponse

def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    path('', health_check, name='health_check'),
    path('health/', health_check, name='health_check_explicit'),
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/auth/', include('apps.accounts.urls')),
    path('api/platform/', include('apps.schools.urls')),
    path('api/school/', include('apps.academic.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/fees/', include('apps.fees.urls')),
    path('api/exams/', include('apps.exams.urls')),
    path('api/notices/', include('apps.notices.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
