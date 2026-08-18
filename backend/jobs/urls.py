from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobViewSet)
router.register(r'applications', views.JobApplicationViewSet, basename='jobapplication')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('applications/analyze/', views.AnalyzeApplicationView.as_view(), name='analyze-application'),
    path('', include(router.urls)),
    path('swipe/', views.SwipeActionView.as_view(), name='swipe-action'),
    path('saved-jobs/', views.SavedJobsView.as_view(), name='saved-jobs'),
    path('applied-jobs/', views.AppliedJobsView.as_view(), name='applied-jobs'),
    path('skipped-jobs/', views.SkippedJobsView.as_view(), name='skipped-jobs'),
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('seeker-analytics/', views.JobSeekerAnalyticsView.as_view(), name='seeker-analytics'),
    path('recommendations/', views.RecommendationView.as_view(), name='recommendations'),
]
