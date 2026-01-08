"""
Custom throttling classes for rate limiting.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Rate limiting for login attempts.
    Limits anonymous users to 5 login attempts per minute.
    """
    rate = '5/minute'
    scope = 'login'


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Rate limiting for password reset requests.
    Limits to 3 attempts per hour.
    """
    rate = '3/hour'
    scope = 'password_reset'


class BurstRateThrottle(UserRateThrottle):
    """
    Burst rate limiting for authenticated users.
    Limits to 100 requests per minute.
    """
    rate = '100/minute'
    scope = 'burst'


class SustainedRateThrottle(UserRateThrottle):
    """
    Sustained rate limiting for authenticated users.
    Limits to 1000 requests per hour.
    """
    rate = '1000/hour'
    scope = 'sustained'
