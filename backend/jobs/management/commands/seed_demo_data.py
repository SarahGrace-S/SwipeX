from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from jobs.models import Job, Notification
from jobs.views import create_job_notifications

class Command(BaseCommand):
    help = 'Seed database with demo jobs and notifications for demonstration'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        
        recruiter, r_created = User.objects.get_or_create(
            email='recruiter123@gmail.com',
            defaults={
                'username': 'recruiter123',
                'full_name': 'Shakthi Recruiter',
                'role': 'RECRUITER',
                'is_active': True,
            }
        )
        if r_created:
            recruiter.set_password('pass123')
            recruiter.save()
            self.stdout.write(f"Created recruiter user: {recruiter.email}")

        seeker, s_created = User.objects.get_or_create(
            email='seeker123@gmail.com',
            defaults={
                'username': 'seeker123',
                'full_name': 'Sarah Seeker',
                'role': 'JOB_SEEKER',
                'skills': 'Java, Spring Boot, React, MySQL, Python',
                'degree': 'BE CSE',
                'experience': '2 years',
                'education': 'BE CSE from Anna University',
                'preferred_location': 'Bangalore',
                'preferred_job_type': 'FULL_TIME',
                'is_active': True,
            }
        )
        if s_created:
            seeker.set_password('pass123')
            seeker.save()
            self.stdout.write(f"Created seeker user: {seeker.email}")
        else:
            seeker.skills = 'Java, Spring Boot, React, MySQL, Python'
            seeker.degree = 'BE CSE'
            seeker.experience = '2 years'
            seeker.education = 'BE CSE from Anna University'
            seeker.preferred_location = 'Bangalore'
            seeker.preferred_job_type = 'FULL_TIME'
            seeker.save()
            self.stdout.write(f"Updated seeker profile skills: {seeker.email}")

        demo_jobs_data = [
            {
                'title': 'Full Stack Developer',
                'company': 'TechNova',
                'location': 'Bangalore',
                'salary': '₹12,00,000 - ₹18,00,000',
                'experience': '1–3 years',
                'job_type': 'FULL_TIME',
                'skills': 'Java, Spring Boot, React, MySQL',
                'description': 'Join our high-growth startup to build next-generation web platforms. We operate with cutting-edge tools and offer huge ownership.',
                'company_type': 'STARTUP',
                'salary_min': 1200000,
                'salary_max': 1800000,
                'is_active': True,
            },
            {
                'title': 'Backend Developer',
                'company': 'CloudNest',
                'location': 'Coimbatore',
                'salary': '₹8,00,000 - ₹12,00,000',
                'experience': '1-3 years',
                'job_type': 'FULL_TIME',
                'skills': 'Java, Python, Spring Boot, PostgreSQL',
                'description': 'Scale and maintain backend microservices for our cloud storage services. Experience with Django/Spring Boot preferred.',
                'company_type': 'STARTUP',
                'salary_min': 800000,
                'salary_max': 1200000,
                'is_active': True,
            },
            {
                'title': 'Cloud / DevOps Engineer',
                'company': 'DataSphere',
                'location': 'Chennai',
                'salary': '₹15,00,000 - ₹24,00,000',
                'experience': '3-5 years',
                'job_type': 'FULL_TIME',
                'skills': 'AWS, Docker, Kubernetes, Linux, Python',
                'description': 'Design, deploy, and scale enterprise container platforms. Looking for Linux administration expertise and AWS certification.',
                'company_type': 'ENTERPRISE',
                'salary_min': 1500000,
                'salary_max': 2400000,
                'is_active': True,
            },
            {
                'title': 'Data Analyst',
                'company': 'InsightWorks',
                'location': 'Bangalore',
                'salary': '₹6,00,000 - ₹9,00,000',
                'experience': '1-3 years',
                'job_type': 'FULL_TIME',
                'skills': 'Python, SQL, Excel, Power BI',
                'description': 'Generate visualizations, structure reports, and analyze large datasets to support executive decisions.',
                'company_type': 'STARTUP',
                'salary_min': 600000,
                'salary_max': 900000,
                'is_active': True,
            }
        ]

        for jd in demo_jobs_data:
            Notification.objects.filter(related_job__title=jd['title'], related_job__company=jd['company']).delete()

        seeded_jobs_count = 0
        for jd in demo_jobs_data:
            job, created = Job.objects.get_or_create(
                title=jd['title'],
                company=jd['company'],
                defaults={
                    'location': jd['location'],
                    'salary': jd['salary'],
                    'experience': jd['experience'],
                    'job_type': jd['job_type'],
                    'skills': jd['skills'],
                    'description': jd['description'],
                    'company_type': jd['company_type'],
                    'salary_min': jd['salary_min'],
                    'salary_max': jd['salary_max'],
                    'is_active': jd['is_active'],
                    'posted_by': recruiter
                }
            )
            if created:
                seeded_jobs_count += 1
            else:
                job.location = jd['location']
                job.salary = jd['salary']
                job.experience = jd['experience']
                job.job_type = jd['job_type']
                job.skills = jd['skills']
                job.description = jd['description']
                job.company_type = jd['company_type']
                job.salary_min = jd['salary_min']
                job.salary_max = jd['salary_max']
                job.is_active = jd['is_active']
                job.posted_by = recruiter
                job.save()

            create_job_notifications(job, seeker)
            self.stdout.write(f"Processed demo job: {job.title} at {job.company}")

        self.stdout.write(self.style.SUCCESS(f"Idempotent seed complete! Added {seeded_jobs_count} new demo jobs."))
