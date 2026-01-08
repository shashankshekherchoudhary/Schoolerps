"""
Pytest configuration for CampusOrbit.
"""
import os
import django
from django.conf import settings

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campusorbit.settings')

# Configure Django
django.setup()

# Pytest configuration
pytest_plugins = ['pytest_django']
