from django.db import models
from django.conf import settings


class Job(models.Model):
    COMPANY_TYPE_CHOICES = (
        ('MNC', 'MNC'),
        ('STARTUP', 'Startup'),
        ('NEW_STARTUP', 'New Startup'),
        ('ENTERPRISE', 'Enterprise'),
    )
    JOB_TYPE_CHOICES = (
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('INTERNSHIP', 'Internship'),
        ('REMOTE', 'Remote'),
        ('CONTRACT', 'Contract'),
    )

    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=100, blank=True, default='')
    experience = models.CharField(max_length=100, blank=True, default='')
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='FULL_TIME')
    skills = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    company_type = models.CharField(max_length=20, choices=COMPANY_TYPE_CHOICES, default='MNC')
    salary_min = models.IntegerField(null=True, blank=True)
    salary_max = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    posted_date = models.DateTimeField(auto_now_add=True)
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posted_jobs', null=True, blank=True)

    class Meta:
        ordering = ['-posted_date']

    def __str__(self):
        return f"{self.title} at {self.company}"


class SwipeHistory(models.Model):
    ACTION_CHOICES = (
        ('SAVED', 'Saved'),
        ('APPLIED', 'Applied'),
        ('SKIPPED', 'Skipped'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='swipe_history')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='swipe_history')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    swiped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-swiped_at']
        unique_together = ('user', 'job', 'action')

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.job.title}"


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('APPLIED', 'Applied'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview Scheduled'),
        ('SELECTED', 'Selected'),
        ('REJECTED', 'Rejected'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='job_applications')

    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, default='')
    qualification = models.CharField(max_length=255)
    experience = models.CharField(max_length=100)

    resume = models.FileField(upload_to='resumes/applications/')
    linkedin = models.URLField(blank=True, default='')
    portfolio = models.URLField(blank=True, default='')
    cover_letter = models.TextField(blank=True, default='')
    
    interview_date = models.DateField(null=True, blank=True)
    interview_time = models.TimeField(null=True, blank=True)
    interview_link = models.URLField(blank=True, default='')
    interview_message = models.TextField(blank=True, default='')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    applied_at = models.DateTimeField(auto_now_add=True)

    ats_score = models.IntegerField(default=0)
    compatibility_score = models.IntegerField(default=0)
    matched_skills = models.TextField(blank=True, default='')
    missing_skills = models.TextField(blank=True, default='')
    matched_keywords = models.TextField(blank=True, default='')
    missing_keywords = models.TextField(blank=True, default='')
    recommendation_reason = models.TextField(blank=True, default='')
    resume_summary = models.TextField(blank=True, default='')
    extracted_skills = models.TextField(blank=True, default='')
    technologies_found = models.TextField(blank=True, default='')
    recommendation_priority = models.CharField(max_length=20, default='MEDIUM')

    class Meta:
        ordering = ['-applied_at']
        unique_together = ('job', 'applicant')

    def __str__(self):
        return f"{self.full_name} - {self.job.title}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('NEW_JOB', 'New Job Posted'),
        ('SKILLS_MATCH', 'Skills Match'),
        ('HIGH_MATCH', 'High Match'),
        ('LOW_COMPETITION', 'Low Competition'),
        ('APPLICATION_SUBMITTED', 'Application Submitted'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW_SCHEDULED', 'Interview Scheduled'),
        ('REJECTED', 'Rejected'),
        ('SELECTED', 'Selected'),
        ('NEW_RECOMMENDATION', 'New Recommendation'),
        ('NEW_APPLICANT', 'New Applicant'),
        ('STATUS_UPDATED', 'Status Updated'),
        ('SYSTEM', 'System Notification'),
        ('STARTUP_HIRING', 'Startup Hiring Alert'),
        ('APPLICATION_STATUS', 'Application Status Alert'),
        ('GENERAL', 'General Notification'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='SYSTEM')
    related_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    related_application = models.ForeignKey(JobApplication, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email} - {self.notification_type}"
