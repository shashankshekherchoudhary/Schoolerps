"""
Common validators for the School ERP system.
"""
import re
from django.core.exceptions import ValidationError
from rest_framework import serializers


def validate_phone_number(value):
    """
    Validate that a phone number contains exactly 10 digits.
    Used as Django model validator.
    """
    if not value:
        return value  # Allow blank/null
    
    # Remove any whitespace
    cleaned = value.strip()
    
    # Check if exactly 10 digits
    if not re.match(r'^\d{10}$', cleaned):
        raise ValidationError(
            'Phone number must be exactly 10 digits (no spaces, country code, or special characters).'
        )
    
    return cleaned


class PhoneNumberField(serializers.CharField):
    """
    Custom serializer field for 10-digit phone numbers.
    """
    default_error_messages = {
        'invalid': 'Phone number must be exactly 10 digits (no spaces, country code, or special characters).',
    }
    
    def __init__(self, **kwargs):
        kwargs.setdefault('max_length', 10)
        kwargs.setdefault('min_length', 10)
        super().__init__(**kwargs)
    
    def to_internal_value(self, data):
        if not data:
            return data
        
        # Remove any whitespace
        cleaned = str(data).strip()
        
        # Remove any non-digit characters for validation
        digits_only = re.sub(r'\D', '', cleaned)
        
        # Validate exactly 10 digits
        if len(digits_only) != 10:
            self.fail('invalid')
        
        return digits_only
    
    def run_validation(self, data):
        # Allow blank if field is not required
        if data in ('', None) and not self.required:
            return data
        return super().run_validation(data)


def validate_phone_serializer(value):
    """
    Validator function for use in serializer field validators list.
    """
    if not value:
        return value
    
    cleaned = str(value).strip()
    digits_only = re.sub(r'\D', '', cleaned)
    
    if len(digits_only) != 10:
        raise serializers.ValidationError(
            'Phone number must be exactly 10 digits (no spaces, country code, or special characters).'
        )
    
    return digits_only
