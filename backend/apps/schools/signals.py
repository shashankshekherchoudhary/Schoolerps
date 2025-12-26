"""
Signals for Schools app.
Auto-create FeatureToggle when a School is created.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import School, FeatureToggle


@receiver(post_save, sender=School)
def create_feature_toggle(sender, instance, created, **kwargs):
    """Create FeatureToggle when School is created."""
    if created:
        FeatureToggle.objects.create(school=instance)
