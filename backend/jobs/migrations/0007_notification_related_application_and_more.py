
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0006_jobapplication_extracted_skills_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='related_application',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='jobs.jobapplication'),
        ),
        migrations.AddField(
            model_name='notification',
            name='related_job',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notifications', to='jobs.job'),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('NEW_JOB', 'New Job Posted'), ('SKILLS_MATCH', 'Skills Match'), ('HIGH_MATCH', 'High Match'), ('LOW_COMPETITION', 'Low Competition'), ('APPLICATION_SUBMITTED', 'Application Submitted'), ('SHORTLISTED', 'Shortlisted'), ('INTERVIEW_SCHEDULED', 'Interview Scheduled'), ('REJECTED', 'Rejected'), ('SELECTED', 'Selected'), ('NEW_RECOMMENDATION', 'New Recommendation'), ('NEW_APPLICANT', 'New Applicant'), ('STATUS_UPDATED', 'Status Updated'), ('SYSTEM', 'System Notification')], default='SYSTEM', max_length=50),
        ),
    ]
