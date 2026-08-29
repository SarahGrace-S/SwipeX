from django.urls import path
from .views import UserRegistrationView, CustomTokenObtainPairView, UserProfileView, GoogleAuthView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('google-auth/', GoogleAuthView.as_view(), name='google-auth'),
]
