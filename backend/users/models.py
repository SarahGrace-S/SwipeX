from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = email.strip().lower()
        extra_fields.setdefault('role', 'JOB_SEEKER')
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, full_name, password, **extra_fields)

    def get_by_natural_key(self, username):
        if username and isinstance(username, str):
            return self.get(email__iexact=username.strip())
        return self.get(**{self.model.USERNAME_FIELD: username})

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('JOB_SEEKER', 'Job Seeker'),
        ('RECRUITER', 'Recruiter'),
        ('EMPLOYER', 'Employer'),
        ('ADMIN', 'Admin'),
    )

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='JOB_SEEKER')
    created_at = models.DateTimeField(auto_now_add=True)
    
    phone = models.CharField(max_length=20, blank=True, default='')
    skills = models.TextField(blank=True, default='')
    education = models.TextField(blank=True, default='')
    degree = models.CharField(max_length=255, blank=True, default='')
    college = models.CharField(max_length=255, blank=True, default='')
    graduation_year = models.CharField(max_length=4, blank=True, default='')
    cgpa = models.CharField(max_length=10, blank=True, default='')
    experience = models.TextField(blank=True, default='')
    previous_company = models.CharField(max_length=255, blank=True, default='')
    years_of_experience = models.CharField(max_length=50, blank=True, default='')
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    linkedin = models.URLField(blank=True, default='')
    github = models.URLField(blank=True, default='')
    portfolio = models.URLField(blank=True, default='')
    
    extracted_skills = models.TextField(blank=True, default='')
    resume_summary = models.TextField(blank=True, default='')
    preferred_job_type = models.CharField(max_length=50, blank=True, default='')
    preferred_location = models.CharField(max_length=255, blank=True, default='')
    projects = models.TextField(blank=True, default='')
    certificates = models.TextField(blank=True, default='')
    
    resume_score = models.IntegerField(default=0)
    resume_strengths = models.TextField(blank=True, default='')
    resume_gaps = models.TextField(blank=True, default='')
    resume_improvements = models.TextField(blank=True, default='')

    company_name = models.CharField(max_length=255, blank=True, default='')
    company_logo = models.FileField(upload_to='company_logos/', blank=True, null=True)
    company_website = models.URLField(blank=True, default='')
    company_industry = models.CharField(max_length=255, blank=True, default='')
    company_location = models.CharField(max_length=255, blank=True, default='')
    company_size = models.CharField(max_length=100, blank=True, default='')
    company_description = models.TextField(blank=True, default='')
    hr_contact_email = models.EmailField(blank=True, null=True)
    hr_contact_number = models.CharField(max_length=20, blank=True, default='')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email

