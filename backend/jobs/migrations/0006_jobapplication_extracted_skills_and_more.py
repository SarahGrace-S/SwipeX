
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0005_jobapplication_matched_keywords_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='extracted_skills',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='recommendation_priority',
            field=models.CharField(default='MEDIUM', max_length=20),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='resume_summary',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='technologies_found',
            field=models.TextField(blank=True, default=''),
        ),
    ]
