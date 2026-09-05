
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_job_is_active_job_salary_max_job_salary_min_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='ats_score',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='compatibility_score',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='matched_skills',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='jobapplication',
            name='missing_skills',
            field=models.TextField(blank=True, default=''),
        ),
    ]
