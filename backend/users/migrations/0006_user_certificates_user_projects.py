
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_extracted_skills_user_preferred_job_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='certificates',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='projects',
            field=models.TextField(blank=True, default=''),
        ),
    ]
