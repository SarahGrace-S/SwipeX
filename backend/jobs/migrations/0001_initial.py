
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Job',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('company', models.CharField(max_length=255)),
                ('location', models.CharField(max_length=255)),
                ('salary', models.CharField(blank=True, default='', max_length=100)),
                ('experience', models.CharField(blank=True, default='', max_length=100)),
                ('job_type', models.CharField(choices=[('FULL_TIME', 'Full Time'), ('PART_TIME', 'Part Time'), ('INTERNSHIP', 'Internship'), ('REMOTE', 'Remote'), ('CONTRACT', 'Contract')], default='FULL_TIME', max_length=20)),
                ('skills', models.TextField(blank=True, default='')),
                ('description', models.TextField(blank=True, default='')),
                ('company_type', models.CharField(choices=[('MNC', 'MNC'), ('STARTUP', 'Startup'), ('NEW_STARTUP', 'New Startup')], default='MNC', max_length=20)),
                ('posted_date', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-posted_date'],
            },
        ),
        migrations.CreateModel(
            name='SwipeHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('SAVED', 'Saved'), ('APPLIED', 'Applied'), ('SKIPPED', 'Skipped')], max_length=10)),
                ('swiped_at', models.DateTimeField(auto_now_add=True)),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='swipe_history', to='jobs.job')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='swipe_history', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-swiped_at'],
                'unique_together': {('user', 'job', 'action')},
            },
        ),
    ]
