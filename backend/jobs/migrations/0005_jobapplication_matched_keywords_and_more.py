
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0004_jobapplication_ats_score_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='matched_keywords',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='missing_keywords',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='recommendation_reason',
            field=models.TextField(blank=True, default=''),
        ),
    ]
