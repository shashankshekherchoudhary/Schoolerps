"""
Management command to recalculate roll numbers for all students.
"""
from django.core.management.base import BaseCommand

from apps.academic.models import Section
from apps.academic.roll_number_utils import recalculate_roll_numbers


class Command(BaseCommand):
    help = 'Recalculate roll numbers for all students based on alphabetical order'

    def add_arguments(self, parser):
        parser.add_argument(
            '--section',
            type=int,
            help='Only recalculate for a specific section ID',
        )
        parser.add_argument(
            '--school',
            type=int,
            help='Only recalculate for a specific school ID',
        )

    def handle(self, *args, **options):
        section_id = options.get('section')
        school_id = options.get('school')
        
        sections = Section.objects.all()
        
        if section_id:
            sections = sections.filter(pk=section_id)
        if school_id:
            sections = sections.filter(school_class__school_id=school_id)
        
        total_updated = 0
        
        for section in sections.select_related('school_class'):
            result = recalculate_roll_numbers(section)
            total_updated += result['updated_count']
            
            self.stdout.write(
                f"  {section.school_class.name} - {section.name}: "
                f"{result['total_students']} students, {result['updated_count']} updated"
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nDone! Updated roll numbers for {total_updated} students.')
        )
