"""
Utility functions for automatic roll number assignment.
Roll numbers are assigned alphabetically within a Class + Section.
"""
from django.db import transaction


def get_sort_key(student):
    """
    Generate sort key for lexicographical ordering.
    Primary: first_name (lowercase), Secondary: last_name (lowercase)
    """
    first_name = (student.user.first_name or '').lower().strip()
    last_name = (student.user.last_name or '').lower().strip()
    return (first_name, last_name)


def recalculate_roll_numbers(section, academic_year=None):
    """
    Recalculate and assign roll numbers for all students in a section.
    
    Args:
        section: Section instance
        academic_year: Optional AcademicYear instance (for future use)
    
    Returns:
        dict with count of updated students
    """
    from .models import Student
    
    # Get all active students in this section
    students = Student.objects.filter(
        current_section=section,
        status='active'
    ).select_related('user')
    
    # Sort students alphabetically by first name, then last name
    sorted_students = sorted(students, key=get_sort_key)
    
    # Assign roll numbers sequentially
    updated_count = 0
    with transaction.atomic():
        for index, student in enumerate(sorted_students, start=1):
            new_roll = str(index)
            if student.roll_number != new_roll:
                student.roll_number = new_roll
                student.save(update_fields=['roll_number'])
                updated_count += 1
    
    return {
        'total_students': len(sorted_students),
        'updated_count': updated_count
    }


def recalculate_roll_numbers_for_class(school_class):
    """
    Recalculate roll numbers for all sections in a class.
    
    Args:
        school_class: Class instance
    
    Returns:
        dict with results per section
    """
    results = {}
    for section in school_class.sections.all():
        results[section.name] = recalculate_roll_numbers(section)
    return results


def assign_roll_number_for_student(student):
    """
    Assign appropriate roll number for a single student based on their position
    in alphabetical order within their section.
    
    This is called when a student is added or their name changes.
    
    Args:
        student: Student instance
    
    Returns:
        The assigned roll number
    """
    if not student.current_section:
        return None
    
    # Recalculate all roll numbers for the section
    recalculate_roll_numbers(student.current_section)
    
    # Refresh student to get updated roll number
    student.refresh_from_db()
    return student.roll_number


def handle_student_section_change(student, old_section, new_section):
    """
    Handle roll number updates when a student changes section.
    
    Args:
        student: Student instance
        old_section: Previous Section instance (can be None)
        new_section: New Section instance (can be None)
    """
    # Recalculate for old section (student was removed)
    if old_section:
        recalculate_roll_numbers(old_section)
    
    # Recalculate for new section (student was added)
    if new_section:
        recalculate_roll_numbers(new_section)
