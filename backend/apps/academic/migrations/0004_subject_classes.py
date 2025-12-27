# Generated migration for Subject.classes ManyToMany field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0003_studymaterial'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='classes',
            field=models.ManyToManyField(blank=True, related_name='subjects', to='academic.class'),
        ),
    ]
