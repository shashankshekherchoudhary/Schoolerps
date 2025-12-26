"""
Utility functions for bulk teacher import.
"""
import csv
import io
from datetime import datetime
from django.contrib.auth import get_user_model

from .models import Subject, Teacher

User = get_user_model()


REQUIRED_COLUMNS = [
    'email', 'first_name', 'last_name', 'phone'
]

OPTIONAL_COLUMNS = ['employee_id', 'qualification', 'date_of_joining', 'subjects']


def parse_teacher_csv(file_content, school):
    """
    Parse CSV file and validate each row for teacher import.
    Returns dict with valid_rows and invalid_rows.
    """
    valid_rows = []
    invalid_rows = []
    
    # Decode if bytes
    if isinstance(file_content, bytes):
        file_content = file_content.decode('utf-8-sig')
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(file_content))
    
    # Validate headers
    headers = reader.fieldnames or []
    missing_headers = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing_headers:
        return {
            'error': f"Missing required columns: {', '.join(missing_headers)}",
            'valid_rows': [],
            'invalid_rows': []
        }
    
    # Cache subjects for this school
    subjects_cache = {s.name.lower(): s for s in Subject.objects.filter(school=school)}
    
    # Get existing emails
    existing_emails = set(
        User.objects.values_list('email', flat=True)
    )
    
    # Track emails in this batch to detect duplicates
    batch_emails = set()
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
        errors = []
        
        # Strip whitespace from all values
        row = {k: v.strip() if v else '' for k, v in row.items()}
        
        # Check required fields
        for col in REQUIRED_COLUMNS:
            if not row.get(col):
                errors.append(f"'{col}' is required")
        
        # Skip further validation if basic fields missing
        if errors:
            invalid_rows.append({
                'row_number': row_num,
                'data': row,
                'errors': errors
            })
            continue
        
        # Validate email format and uniqueness
        email = row['email'].lower()
        if '@' not in email:
            errors.append("Invalid email format")
        elif email in existing_emails:
            errors.append(f"Email '{email}' already exists")
        elif email in batch_emails:
            errors.append(f"Duplicate email '{email}' in file")
        
        # Parse subjects (comma-separated)
        subject_names = row.get('subjects', '')
        resolved_subjects = []
        if subject_names:
            for sname in subject_names.split(','):
                sname = sname.strip().lower()
                if sname and sname in subjects_cache:
                    resolved_subjects.append(subjects_cache[sname])
                elif sname:
                    errors.append(f"Subject '{sname}' not found")
        
        # Validate date of joining if provided
        doj = row.get('date_of_joining', '')
        parsed_doj = None
        if doj:
            try:
                parsed_doj = datetime.strptime(doj, '%Y-%m-%d').date()
            except ValueError:
                errors.append("Date of joining must be in YYYY-MM-DD format")
        
        # Validate phone (must be exactly 10 digits)
        phone = row.get('phone', '')
        if phone:
            import re
            digits_only = re.sub(r'\D', '', phone)
            if len(digits_only) != 10:
                errors.append("Phone must be exactly 10 digits")
        
        if errors:
            invalid_rows.append({
                'row_number': row_num,
                'data': row,
                'errors': errors
            })
        else:
            row['email_normalized'] = email
            row['subjects_resolved'] = resolved_subjects
            row['date_of_joining_parsed'] = parsed_doj
            batch_emails.add(email)
            valid_rows.append({
                'row_number': row_num,
                'data': row
            })
    
    return {
        'valid_rows': valid_rows,
        'invalid_rows': invalid_rows
    }


def create_teachers_from_rows(valid_rows, school):
    """
    Create teacher records from validated rows.
    Returns success and error counts.
    """
    success_count = 0
    error_count = 0
    errors = []
    
    for row_info in valid_rows:
        row = row_info['data']
        row_num = row_info['row_number']
        
        try:
            # Generate default password
            default_password = f"Teacher@{row['first_name']}{row_num}"
            
            # Create user
            user = User.objects.create_user(
                email=row['email_normalized'],
                password=default_password,
                first_name=row['first_name'],
                last_name=row['last_name'],
                phone=row.get('phone', ''),
                role='teacher',
                school=school
            )
            
            # Create teacher profile
            teacher = Teacher.objects.create(
                user=user,
                school=school,
                employee_id=row.get('employee_id', ''),
                qualification=row.get('qualification', ''),
                date_of_joining=row.get('date_of_joining_parsed')
            )
            
            # Assign subjects
            if row.get('subjects_resolved'):
                teacher.subjects.set(row['subjects_resolved'])
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            errors.append({
                'row_number': row_num,
                'error': str(e)
            })
    
    return {
        'success_count': success_count,
        'error_count': error_count,
        'errors': errors
    }


def generate_teacher_sample_csv():
    """Generate sample CSV template for teacher import."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(REQUIRED_COLUMNS + OPTIONAL_COLUMNS)
    
    # Sample rows
    writer.writerow([
        'john.doe@school.com', 'John', 'Doe', '9876543210',
        'EMP-001', 'M.Sc Mathematics', '2023-01-15', 'Mathematics, Physics'
    ])
    writer.writerow([
        'jane.smith@school.com', 'Jane', 'Smith', '9876543211',
        'EMP-002', 'B.Ed English', '', 'English'
    ])
    
    return output.getvalue()
