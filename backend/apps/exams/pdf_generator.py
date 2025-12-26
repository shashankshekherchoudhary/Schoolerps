"""
PDF Report Card Generator using ReportLab.
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from django.conf import settings
import os


def generate_report_card_pdf(report_card):
    """
    Generate a PDF report card for a student.
    
    Args:
        report_card: ReportCard model instance
    
    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm
    )
    
    # Get data
    student = report_card.student
    exam = report_card.exam
    school = student.school
    
    # Get exam results
    from .models import ExamResult
    results = ExamResult.objects.filter(
        exam_subject__exam=exam,
        student=student
    ).select_related('exam_subject', 'exam_subject__subject')
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        spaceAfter=12
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=10,
        spaceBefore=10
    )
    
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT
    )
    
    # Build content
    content = []
    
    # School Header
    content.append(Paragraph(school.name.upper(), title_style))
    
    if school.address:
        address_parts = []
        if school.address:
            address_parts.append(school.address)
        if school.city:
            address_parts.append(school.city)
        if school.state:
            address_parts.append(school.state)
        if school.pincode:
            address_parts.append(school.pincode)
        content.append(Paragraph(", ".join(address_parts), subtitle_style))
    
    if school.phone or school.email:
        contact = []
        if school.phone:
            contact.append(f"Phone: {school.phone}")
        if school.email:
            contact.append(f"Email: {school.email}")
        content.append(Paragraph(" | ".join(contact), subtitle_style))
    
    content.append(Spacer(1, 0.3*inch))
    
    # Report Card Title
    content.append(Paragraph(f"REPORT CARD - {exam.name.upper()}", header_style))
    content.append(Paragraph(f"Academic Year: {exam.academic_year.name}", subtitle_style))
    
    content.append(Spacer(1, 0.2*inch))
    
    # Student Information
    student_info = [
        ['Student Name:', student.full_name, 'Admission No.:', student.admission_number],
        ['Class:', student.class_name or 'N/A', 'Roll No.:', student.roll_number or 'N/A'],
        ['Parent/Guardian:', student.parent_name or 'N/A', 'Contact:', student.parent_phone or 'N/A'],
    ]
    
    student_table = Table(student_info, colWidths=[2.5*cm, 6*cm, 2.5*cm, 6*cm])
    student_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    content.append(student_table)
    content.append(Spacer(1, 0.3*inch))
    
    # Results Table
    results_header = ['S.No.', 'Subject', 'Max Marks', 'Marks Obtained', 'Grade', 'Remarks']
    results_data = [results_header]
    
    total_max = 0
    total_obtained = 0
    
    for idx, result in enumerate(results, 1):
        max_marks = result.exam_subject.max_marks
        obtained = result.marks_obtained if not result.is_absent else 'AB'
        grade = result.grade if not result.is_absent else '-'
        
        total_max += max_marks
        if not result.is_absent and result.marks_obtained:
            total_obtained += result.marks_obtained
        
        results_data.append([
            str(idx),
            result.exam_subject.subject.name,
            str(max_marks),
            str(obtained),
            grade,
            result.remarks or '-'
        ])
    
    # Add total row
    percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
    results_data.append([
        '', 'TOTAL', str(total_max), str(total_obtained), 
        f'{percentage}%', ''
    ])
    
    col_widths = [1*cm, 5*cm, 2.5*cm, 3*cm, 2*cm, 3.5*cm]
    results_table = Table(results_data, colWidths=col_widths)
    results_table.setStyle(TableStyle([
        # Header style
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Data style
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (4, -1), 'CENTER'),
        
        # Total row style
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ecf0f1')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    content.append(results_table)
    content.append(Spacer(1, 0.3*inch))
    
    # Summary Section
    overall_grade = get_overall_grade(percentage)
    summary_data = [
        ['Overall Percentage:', f'{percentage}%', 'Overall Grade:', overall_grade],
        ['Rank in Class:', str(report_card.rank) if report_card.rank else 'N/A', 'Result:', 'PASS' if percentage >= 35 else 'FAIL'],
    ]
    
    summary_table = Table(summary_data, colWidths=[3.5*cm, 4*cm, 3.5*cm, 4*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(summary_table)
    content.append(Spacer(1, 0.5*inch))
    
    # Signatures Section
    # Get class teacher name
    class_teacher_name = "Class Teacher"
    try:
        from apps.academic.models import ClassTeacher
        if student.current_section:
            ct = ClassTeacher.objects.filter(section=student.current_section).first()
            if ct:
                class_teacher_name = ct.teacher.full_name
    except Exception:
        pass
    
    principal_name = school.principal_name or "Principal"
    
    signature_data = [
        ['', '', ''],
        ['_________________', '_________________', '_________________'],
        ['Class Teacher', 'Principal', 'Parent/Guardian'],
        [class_teacher_name, principal_name, ''],
    ]
    
    sig_table = Table(signature_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    content.append(sig_table)
    
    # Footer
    content.append(Spacer(1, 0.3*inch))
    footer_text = f"Generated on: {report_card.generated_at.strftime('%d-%m-%Y %H:%M')}"
    content.append(Paragraph(footer_text, ParagraphStyle(
        'Footer', parent=normal_style, fontSize=8, alignment=TA_RIGHT
    )))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    
    return buffer


def get_overall_grade(percentage):
    """Calculate overall grade based on percentage."""
    if percentage >= 90:
        return 'A+'
    elif percentage >= 80:
        return 'A'
    elif percentage >= 70:
        return 'B+'
    elif percentage >= 60:
        return 'B'
    elif percentage >= 50:
        return 'C'
    elif percentage >= 35:
        return 'D'
    else:
        return 'F'
