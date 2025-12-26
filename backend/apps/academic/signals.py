"""
Django signals for the academic app.
Handles automatic roll number assignment on student changes.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver


# Store original values to detect changes
_student_original_values = {}


@receiver(pre_save, sender='academic.Student')
def capture_student_original_values(sender, instance, **kwargs):
    """Capture original values before save to detect changes."""
    if instance.pk:
        try:
            original = sender.objects.select_related('user').get(pk=instance.pk)
            _student_original_values[instance.pk] = {
                'section_id': original.current_section_id,
                'first_name': original.user.first_name,
                'last_name': original.user.last_name,
            }
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='academic.Student')
def handle_student_roll_number(sender, instance, created, **kwargs):
    """
    Recalculate roll numbers when:
    - A new student is added
    - A student's name changes
    - A student changes section
    """
    from .roll_number_utils import recalculate_roll_numbers, handle_student_section_change
    
    if created:
        # New student - recalculate for their section
        if instance.current_section:
            recalculate_roll_numbers(instance.current_section)
    else:
        # Existing student - check what changed
        original = _student_original_values.pop(instance.pk, None)
        if not original:
            return
        
        old_section_id = original.get('section_id')
        new_section_id = instance.current_section_id
        
        # Check if section changed
        if old_section_id != new_section_id:
            from .models import Section
            old_section = Section.objects.filter(pk=old_section_id).first() if old_section_id else None
            new_section = instance.current_section
            handle_student_section_change(instance, old_section, new_section)
        else:
            # Check if name changed (requires recalculation for reordering)
            name_changed = (
                original.get('first_name') != instance.user.first_name or
                original.get('last_name') != instance.user.last_name
            )
            if name_changed and instance.current_section:
                recalculate_roll_numbers(instance.current_section)


@receiver(post_save, sender='accounts.User')
def handle_user_name_change(sender, instance, created, **kwargs):
    """
    Handle name changes via User model.
    This covers cases where user name is updated directly.
    """
    if created:
        return
    
    # Check if this user has a student profile
    if hasattr(instance, 'student_profile'):
        student = instance.student_profile
        if student.current_section:
            from .roll_number_utils import recalculate_roll_numbers
            recalculate_roll_numbers(student.current_section)
