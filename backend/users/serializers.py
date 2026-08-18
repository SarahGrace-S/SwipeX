from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('full_name', 'email', 'password', 'confirm_password', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields must match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'JOB_SEEKER')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    overall_ats_score = serializers.SerializerMethodField()
    overall_ats_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'full_name', 'email', 'role', 'created_at',
            'phone', 'skills', 'education', 'experience', 'resume',
            'degree', 'college', 'graduation_year', 'cgpa',
            'previous_company', 'years_of_experience', 'linkedin', 'github', 'portfolio',
            'extracted_skills', 'resume_summary', 'preferred_job_type', 'preferred_location',
            'projects', 'certificates',
            'company_name', 'company_logo', 'company_website',
            'company_industry', 'company_location', 'company_description',
            'company_size', 'hr_contact_email', 'hr_contact_number',
            'overall_ats_score', 'overall_ats_status'
        )

    def get_overall_ats_score(self, obj):
        score = 0
        if obj.resume:
            score += 30
        if obj.skills or obj.extracted_skills:
            score += 15
        if obj.education:
            score += 15
        if obj.experience:
            score += 15
        if obj.phone and obj.email:
            score += 10
        if obj.degree:
            score += 10
        if obj.linkedin or obj.portfolio:
            score += 5
        return score

    def get_overall_ats_status(self, obj):
        score = self.get_overall_ats_score(obj)
        if score >= 80:
            return "EXCELLENT"
        elif score >= 60:
            return "GOOD"
        elif score >= 40:
            return "AVERAGE"
        return "NEEDS_IMPROVEMENT"
