from django.contrib import admin
from .models import Job, SwipeHistory


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'job_type', 'company_type', 'posted_date')
    list_filter = ('job_type', 'company_type', 'posted_date')
    search_fields = ('title', 'company', 'location', 'skills')


@admin.register(SwipeHistory)
class SwipeHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'action', 'swiped_at')
    list_filter = ('action', 'swiped_at')
