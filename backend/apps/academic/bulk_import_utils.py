"""
Utility functions for bulk student import.
"""
import csv
import io
from datetime import datetime
from django.contrib.auth import get_user_model

from .models import Class, Section, Student

User = get_user_model()


REQUIRED_COLUMNS = [
    'admission_number', 'first_name', 'last_name', 'class', 'section',
    'gender', 'date_of_birth', 'parent_name', 'parent_phone'
]

OPTIONAL_COLUMNS = ['parent_email', 'address', 'roll_number']


def parse_csv_file(file_content, school):
    """
    Parse CSV file and validate each row.
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
    
    # Cache classes and sections for this school
    classes_cache = {c.name.lower(): c for c in Class.objects.filter(school=school)}
    sections_cache = {}
    for cls in classes_cache.values():
        for section in cls.sections.all():
            key = f"{cls.name.lower()}_{section.name.lower()}"
            sections_cache[key] = section
    
    # Get existing admission numbers
    existing_admissions = set(
        Student.objects.filter(school=school).values_list('admission_number', flat=True)
    )
    
    # Track admission numbers in this batch to detect duplicates
    batch_admissions = set()
    
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
        
        # Validate admission number uniqueness
        admission = row['admission_number']
        if admission in existing_admissions:
            errors.append(f"Admission number '{admission}' already exists")
        elif admission in batch_admissions:
            errors.append(f"Duplicate admission number '{admission}' in file")
        
        # Validate class exists
        class_name = row['class'].lower()
        if class_name not in classes_cache:
            errors.append(f"Class '{row['class']}' not found")
        
        # Validate section exists in class
        section_key = f"{class_name}_{row['section'].lower()}"
        if class_name in classes_cache and section_key not in sections_cache:
            errors.append(f"Section '{row['section']}' not found in class '{row['class']}'")
        
        # Validate gender
        gender = row['gender'].lower()
        if gender not in ['male', 'female', 'other']:
            errors.append("Gender must be 'male', 'female', or 'other'")
        
        # Validate date of birth
        dob = row['date_of_birth']
        try:
            parsed_dob = datetime.strptime(dob, '%Y-%m-%d').date()
            row['date_of_birth_parsed'] = parsed_dob
        except ValueError:
            errors.append("Date of birth must be in YYYY-MM-DD format")
        
        # Validate parent phone (must be exactly 10 digits)
        parent_phone = row.get('parent_phone', '')
        if parent_phone:
            import re
            digits_only = re.sub(r'\D', '', parent_phone)
            if len(digits_only) != 10:
                errors.append("Parent phone must be exactly 10 digits")
        
        if errors:
            invalid_rows.append({
                'row_number': row_num,
                'data': row,
                'errors': errors
            })
        else:
            # Add resolved references
            row['class_obj'] = classes_cache[class_name]
            row['section_obj'] = sections_cache[section_key]
            row['gender_normalized'] = gender
            batch_admissions.add(admission)
            valid_rows.append({
                'row_number': row_num,
                'data': row
            })
    
    return {
        'valid_rows': valid_rows,
        'invalid_rows': invalid_rows
    }


def create_students_from_rows(valid_rows, school):
    """
    Create student records from validated rows.
    Returns success and error counts.
    """
    success_count = 0
    error_count = 0
    errors = []
    
    for row_info in valid_rows:
        row = row_info['data']
        row_num = row_info['row_number']
        
        try:
            # Generate email from admission number
            email = f"{row['admission_number'].lower().replace(' ', '')}@{school.code.lower()}.student"
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                email = f"{row['admission_number'].lower().replace(' ', '')}_{row_num}@{school.code.lower()}.student"
            
            # Generate default password
            default_password = f"Student@{row['admission_number']}"
            
            # Create user
            user = User.objects.create_user(
                email=email,
                password=default_password,
                first_name=row['first_name'],
                last_name=row['last_name'],
                role='student',
                school=school
            )
            
            # Create student profile (roll_number auto-assigned by signal)
            Student.objects.create(
                user=user,
                school=school,
                admission_number=row['admission_number'],
                current_class=row['class_obj'],
                current_section=row['section_obj'],
                date_of_birth=row.get('date_of_birth_parsed'),
                gender=row['gender_normalized'],
                parent_name=row['parent_name'],
                parent_phone=row['parent_phone'],
                parent_email=row.get('parent_email', ''),
                address=row.get('address', '')
            )
            
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


def generate_sample_csv():
    """Generate sample CSV template."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(REQUIRED_COLUMNS + OPTIONAL_COLUMNS)
    
    # Sample rows
    writer.writerow([
        'ADM-2024-001', 'John', 'Doe', 'Class 5', 'A',
        'male', '2012-05-15', 'Robert Doe', '9876543210',
        'parent@email.com', '123 Main Street', '1'
    ])
    writer.writerow([
        'ADM-2024-002', 'Jane', 'Smith', 'Class 5', 'A',
        'female', '2012-08-20', 'Mary Smith', '9876543211',
        '', '', '2'
    ])
    
    return output.getvalue()
