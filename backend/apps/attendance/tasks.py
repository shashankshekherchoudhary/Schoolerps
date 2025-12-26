"""
Celery tasks for attendance-related background jobs.
"""
from celery import shared_task
from django.utils import timezone
from django.conf import settings


@shared_task
def schedule_absent_alert(attendance_id):
    """
    Schedule an absent alert to be sent after the configured delay.
    This is called when a student is marked absent.
    """
    from .models import StudentAttendance, AbsentAlert
    
    try:
        attendance = StudentAttendance.objects.get(id=attendance_id)
        
        # If already not absent or alert already handled, skip
        if attendance.status != 'absent':
            return f"Attendance {attendance_id} is no longer absent, skipping alert."
        
        if attendance.alert_sent or attendance.alert_cancelled:
            return f"Alert already processed for attendance {attendance_id}."
        
        # Schedule the alert
        delay_minutes = getattr(settings, 'ABSENT_ALERT_DELAY_MINUTES', 20)
        scheduled_at = timezone.now() + timezone.timedelta(minutes=delay_minutes)
        
        alert, created = AbsentAlert.objects.get_or_create(
            attendance=attendance,
            defaults={
                'status': 'scheduled',
                'scheduled_at': scheduled_at,
                'parent_phone': attendance.student.parent_phone,
                'parent_email': attendance.student.parent_email
            }
        )
        
        if created:
            attendance.alert_scheduled = True
            attendance.save(update_fields=['alert_scheduled'])
            
            # Schedule the actual send task
            send_absent_alert.apply_async(
                args=[alert.id],
                eta=scheduled_at
            )
        
        return f"Alert scheduled for attendance {attendance_id} at {scheduled_at}"
    
    except StudentAttendance.DoesNotExist:
        return f"Attendance {attendance_id} not found."


@shared_task
def send_absent_alert(alert_id):
    """
    Send the actual absent alert to parents.
    This runs after the delay period.
    """
    from .models import AbsentAlert
    
    try:
        alert = AbsentAlert.objects.select_related(
            'attendance', 'attendance__student'
        ).get(id=alert_id)
        
        # Check if cancelled
        if alert.status == 'cancelled':
            return f"Alert {alert_id} was cancelled."
        
        # Check if attendance was corrected
        if alert.attendance.status != 'absent':
            alert.status = 'cancelled'
            alert.save(update_fields=['status'])
            
            alert.attendance.alert_cancelled = True
            alert.attendance.save(update_fields=['alert_cancelled'])
            
            return f"Alert {alert_id} cancelled - attendance corrected."
        
        # Build message
        student = alert.attendance.student
        message = (
            f"Dear Parent, your child {student.full_name} "
            f"(Admission No: {student.admission_number}) "
            f"was marked ABSENT on {alert.attendance.date}. "
            f"Please contact the school if this is incorrect."
        )
        
        alert.message_sent = message
        
        # TODO: Integrate with actual SMS/Email service
        # For now, just log it
        success = _send_notification(
            phone=alert.parent_phone,
            email=alert.parent_email,
            message=message
        )
        
        if success:
            alert.status = 'sent'
            alert.sent_at = timezone.now()
            alert.attendance.alert_sent = True
            alert.attendance.save(update_fields=['alert_sent'])
        else:
            alert.status = 'failed'
            alert.error_message = 'Failed to send notification'
        
        alert.save()
        
        return f"Alert {alert_id} processed with status: {alert.status}"
    
    except AbsentAlert.DoesNotExist:
        return f"Alert {alert_id} not found."


def _send_notification(phone, email, message):
    """
    Placeholder function for sending SMS/Email.
    Replace with actual integration (Twilio, SendGrid, etc.)
    """
    # TODO: Implement actual SMS/Email sending
    print(f"[NOTIFICATION] Phone: {phone}, Email: {email}")
    print(f"[NOTIFICATION] Message: {message}")
    return True


@shared_task
def cancel_absent_alert(attendance_id):
    """
    Cancel a scheduled absent alert.
    Called when attendance is corrected from absent to present.
    """
    from .models import StudentAttendance, AbsentAlert
    
    try:
        attendance = StudentAttendance.objects.get(id=attendance_id)
        
        if hasattr(attendance, 'absent_alert'):
            alert = attendance.absent_alert
            if alert.status == 'scheduled':
                alert.status = 'cancelled'
                alert.save(update_fields=['status'])
                
                attendance.alert_cancelled = True
                attendance.save(update_fields=['alert_cancelled'])
                
                return f"Alert cancelled for attendance {attendance_id}"
        
        return f"No active alert to cancel for attendance {attendance_id}"
    
    except StudentAttendance.DoesNotExist:
        return f"Attendance {attendance_id} not found."
