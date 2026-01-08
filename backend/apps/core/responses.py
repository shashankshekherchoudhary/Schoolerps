"""
Standardized API error responses.
Ensures consistent error format across all endpoints.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns standardized error responses.
    
    Response format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "User-friendly message",
            "details": {} // Optional additional details
        }
    }
    """
    # Call default exception handler first
    response = exception_handler(exc, context)
    
    if response is None:
        # Unhandled exception
        return Response({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred. Please try again later.',
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Standardize the response format
    error_data = {
        'success': False,
        'error': {
            'code': get_error_code(response.status_code),
            'message': get_error_message(exc, response),
            'details': response.data if isinstance(response.data, dict) else {'errors': response.data}
        }
    }
    
    response.data = error_data
    return response


def get_error_code(status_code):
    """Map status code to error code."""
    error_codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
        500: 'INTERNAL_ERROR',
    }
    return error_codes.get(status_code, 'UNKNOWN_ERROR')


def get_error_message(exc, response):
    """Get user-friendly error message."""
    status_messages = {
        400: 'Invalid request. Please check your input.',
        401: 'Authentication required. Please log in.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        405: 'This action is not allowed.',
        429: 'Too many requests. Please try again later.',
        500: 'An unexpected error occurred. Please try again later.',
    }
    
    # For validation errors, try to get specific message
    if response.status_code == 400 and isinstance(response.data, dict):
        # Get first error message
        for field, errors in response.data.items():
            if isinstance(errors, list) and errors:
                return f"{field}: {errors[0]}"
            elif isinstance(errors, str):
                return errors
    
    # For auth errors
    if hasattr(exc, 'detail'):
        detail = str(exc.detail)
        if detail:
            return detail
    
    return status_messages.get(response.status_code, 'An error occurred.')


class APIResponse:
    """Helper class for consistent API responses."""
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK):
        """Return success response."""
        response_data = {'success': True}
        if data is not None:
            response_data['data'] = data
        if message:
            response_data['message'] = message
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(message, code='ERROR', details=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return error response."""
        error_data = {
            'success': False,
            'error': {
                'code': code,
                'message': message,
            }
        }
        if details:
            error_data['error']['details'] = details
        return Response(error_data, status=status_code)
    
    @staticmethod
    def created(data=None, message='Created successfully'):
        """Return created response."""
        return APIResponse.success(data, message, status.HTTP_201_CREATED)
    
    @staticmethod
    def deleted(message='Deleted successfully'):
        """Return deleted response."""
        return Response({'success': True, 'message': message}, status=status.HTTP_200_OK)
    
    @staticmethod
    def not_found(message='Resource not found'):
        """Return not found response."""
        return APIResponse.error(message, 'NOT_FOUND', status_code=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def forbidden(message='You do not have permission'):
        """Return forbidden response."""
        return APIResponse.error(message, 'FORBIDDEN', status_code=status.HTTP_403_FORBIDDEN)
