
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_company_description_user_company_industry_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='cgpa',
            field=models.CharField(blank=True, default='', max_length=10),
        ),
        migrations.AddField(
            model_name='user',
            name='college',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='company_size',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='user',
            name='degree',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='github',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='graduation_year',
            field=models.CharField(blank=True, default='', max_length=4),
        ),
        migrations.AddField(
            model_name='user',
            name='hr_contact_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='hr_contact_number',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='linkedin',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='portfolio',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='previous_company',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='years_of_experience',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
    ]
