from django.core.management.base import BaseCommand
from jobs.models import Job


class Command(BaseCommand):
    help = 'Seed the database with sample jobs'

    def handle(self, *args, **kwargs):
        jobs_data = [
            {
                'title': 'Full Stack Developer',
                'company': 'TechNova',
                'location': 'Bangalore, India',
                'salary': '\u20b98,00,000 - \u20b915,00,000',
                'experience': '1-3 years',
                'job_type': 'FULL_TIME',
                'skills': 'React, Node.js, JavaScript, MongoDB',
                'description': 'Develop scalable web applications using the MERN stack. Collaborate with UI/UX designers and manage APIs.',
                'company_type': 'STARTUP',
                'salary_min': 800000,
                'salary_max': 1500000,
                'is_active': True,
            },
            {
                'title': 'Java Backend Developer',
                'company': 'CodeWorks',
                'location': 'Hyderabad, India',
                'salary': '\u20b910,00,000 - \u20b918,00,000',
                'experience': '1-3 years',
                'job_type': 'FULL_TIME',
                'skills': 'Java, Spring Boot, MySQL, REST API',
                'description': 'Design, build, and maintain efficient backend service microservices. Optimize SQL queries and construct endpoints.',
                'company_type': 'MNC',
                'salary_min': 1000000,
                'salary_max': 1800000,
                'is_active': True,
            },
            {
                'title': 'Python Developer',
                'company': 'DataTech',
                'location': 'Pune, India',
                'salary': '\u20b99,00,000 - \u20b916,00,000',
                'experience': '1-3 years',
                'job_type': 'FULL_TIME',
                'skills': 'Python, Django, SQL, REST API',
                'description': 'Develop high-performance backends and web applications. Participate in architectural design and code reviews.',
                'company_type': 'STARTUP',
                'salary_min': 900000,
                'salary_max': 1600000,
                'is_active': True,
            },
            {
                'title': 'Frontend Developer',
                'company': 'WebSphere',
                'location': 'Remote',
                'salary': '\u20b96,00,000 - \u20b912,00,000',
                'experience': '0-2 years',
                'job_type': 'REMOTE',
                'skills': 'React, JavaScript, HTML, CSS',
                'description': 'Craft gorgeous, responsive user interfaces. Implement modern CSS techniques and handle user flow state.',
                'company_type': 'NEW_STARTUP',
                'salary_min': 600000,
                'salary_max': 1200000,
                'is_active': True,
            },
            {
                'title': 'Data Engineer',
                'company': 'CloudData',
                'location': 'Mumbai, India',
                'salary': '\u20b914,00,000 - \u20b925,00,000',
                'experience': '2-4 years',
                'job_type': 'FULL_TIME',
                'skills': 'Python, SQL, PostgreSQL, AWS',
                'description': 'Build high-volume ETL data pipelines. Manage databases on AWS and organize data warehousing.',
                'company_type': 'STARTUP',
                'salary_min': 1400000,
                'salary_max': 2500000,
                'is_active': True,
            },
            {
                'title': 'Software Engineer',
                'company': 'InnovateLabs',
                'location': 'Bangalore, India',
                'salary': '\u20b97,50,000 - \u20b914,00,000',
                'experience': '0-2 years',
                'job_type': 'FULL_TIME',
                'skills': 'Java, Python, Git, SQL, Data Structures',
                'description': 'Entry-level role focused on engineering excellence. Build features, learn testing frameworks, and write clean code.',
                'company_type': 'MNC',
                'salary_min': 750000,
                'salary_max': 1400000,
                'is_active': True,
            },
        ]

        created_count = 0
        for job_data in jobs_data:
            _, created = Job.objects.get_or_create(
                title=job_data['title'],
                company=job_data['company'],
                defaults=job_data
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} jobs (total: {Job.objects.count()})'))
