from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import UserRegistrationSerializer, UserSerializer
from .resume_parser import parse_resume

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            return Response({
                "user": UserSerializer(user).data,
                "message": "User registered successfully."
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Registration failed: {e}", exc_info=True)
            return Response({
                "error": "An error occurred during registration. Please verify your inputs and try again."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)


class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        if 'resume' in self.request.FILES and user.resume:
            # Parse the new resume
            try:
                parsed_data = parse_resume(user.resume.path)
                user.extracted_skills = ', '.join(parsed_data.get('skills', []))
                user.resume_summary = parsed_data.get('summary', '')
                user.save(update_fields=['extracted_skills', 'resume_summary'])
            except Exception as e:
                print(f"Failed to parse resume: {e}")


class GoogleAuthView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        import urllib.request
        import json
        import os
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.conf import settings

        token = request.data.get('credential')
        role = request.data.get('role', 'JOB_SEEKER')
        
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Call Google tokeninfo API
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            req = urllib.request.Request(url, method='GET')
            with urllib.request.urlopen(req, timeout=10) as response:
                id_info = json.loads(response.read().decode('utf-8'))
                
            # Verify issuer
            if id_info.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response({'error': 'Invalid issuer.'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Verify audience
            google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None) or os.getenv('GOOGLE_CLIENT_ID')
            if google_client_id and id_info.get('aud') != google_client_id:
                return Response({'error': 'Invalid audience.'}, status=status.HTTP_400_BAD_REQUEST)
                
            email = id_info.get('email')
            name = id_info.get('name', '')
            
            if not email:
                return Response({'error': 'Email not provided by Google.'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': name,
                    'role': role,
                }
            )
            
            # Generate SimpleJWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f'Authentication failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

