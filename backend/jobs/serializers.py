from rest_framework import serializers
from .models import Job, SwipeHistory, JobApplication, Notification
from users.serializers import UserSerializer

class JobSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)
    ats_score = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    matching_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()
    recommendation_reason = serializers.SerializerMethodField()
    profile_incomplete = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()
    competition_level = serializers.SerializerMethodField()
    average_ats_score = serializers.SerializerMethodField()
    average_compatibility_score = serializers.SerializerMethodField()
    ai_match_insights = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('posted_by',)

    def _get_skill_comparison(self, obj):
        if hasattr(obj, '_cached_match_analysis'):
            analysis = obj._cached_match_analysis
            return (
                analysis['ats_score'],
                analysis['match_score'],
                analysis['matching_skills'],
                analysis['missing_skills'],
                analysis['recommendation_reason'],
                analysis['profile_incomplete']
            )

        request = self.context.get('request')
        is_authenticated_seeker = bool(request and request.user.is_authenticated and request.user.role == 'JOB_SEEKER')

        from .ai_service import calculate_recommendation_match

        if is_authenticated_seeker:
            user = request.user
            user_profile = {
                'skills': user.skills,
                'extracted_skills': user.extracted_skills,
                'experience': user.experience,
                'years_of_experience': user.years_of_experience,
                'education': user.education,
                'degree': user.degree,
                'preferred_location': user.preferred_location,
                'preferred_job_type': user.preferred_job_type,
                'projects': user.projects,
                'resume': bool(user.resume),
            }

            # Optional history for role alignment
            job_titles = self.context.get('favored_job_titles')
            if job_titles is None:
                from .models import SwipeHistory, JobApplication
                applied_job_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
                saved_job_ids = SwipeHistory.objects.filter(user=user, action='SAVED').values_list('job_id', flat=True)
                job_titles = list(Job.objects.filter(id__in=set(applied_job_ids).union(set(saved_job_ids))).values_list('title', flat=True))
            user_history = {'job_titles': job_titles}
        else:
            # Baseline candidate skills for unauthenticated guest visitors
            user_profile = {
                'skills': 'python, javascript, react, typescript, node, sql, postgresql, git, docker, rest apis',
                'extracted_skills': 'problem solving, communication, cloud',
                'experience': '2+ years software engineering experience',
                'years_of_experience': '2',
                'education': 'Bachelor of Science in Computer Science',
                'degree': 'B.S. Computer Science',
                'preferred_location': obj.location,
                'preferred_job_type': obj.job_type,
                'resume': True,
            }
            user_history = None

        job_details = {
            'title': obj.title,
            'company': obj.company,
            'location': obj.location,
            'skills': obj.skills,
            'description': obj.description,
            'experience': obj.experience,
            'job_type': obj.job_type,
        }

        analysis = calculate_recommendation_match(user_profile, job_details, user_history)
        obj._cached_match_analysis = analysis

        return (
            analysis['ats_score'],
            analysis['match_score'],
            analysis['matching_skills'],
            analysis['missing_skills'],
            analysis['recommendation_reason'],
            analysis['profile_incomplete']
        )

    def get_ats_score(self, obj):
        ats, _, _, _, _, _ = self._get_skill_comparison(obj)
        return ats

    def get_match_score(self, obj):
        _, comp, _, _, _, _ = self._get_skill_comparison(obj)
        return comp

    def get_matching_skills(self, obj):
        _, _, matching, _, _, _ = self._get_skill_comparison(obj)
        return matching

    def get_missing_skills(self, obj):
        _, _, _, missing, _, _ = self._get_skill_comparison(obj)
        return missing

    def get_recommendation_reason(self, obj):
        _, _, _, _, reason, _ = self._get_skill_comparison(obj)
        return reason

    def get_profile_incomplete(self, obj):
        _, _, _, _, _, incomplete = self._get_skill_comparison(obj)
        return incomplete

    def get_application_count(self, obj):
        return obj.applications.count()

    def get_competition_level(self, obj):
        count = obj.applications.count()
        if count <= 3:
            return "LOW"
        elif count <= 10:
            return "MEDIUM"
        return "HIGH"

    def get_average_ats_score(self, obj):
        from django.db.models import Avg
        avg = obj.applications.aggregate(Avg('ats_score'))['ats_score__avg']
        return int(avg) if avg is not None else 0

    def get_average_compatibility_score(self, obj):
        from django.db.models import Avg
        avg = obj.applications.aggregate(Avg('compatibility_score'))['compatibility_score__avg']
        return int(avg) if avg is not None else 0

    def get_ai_match_insights(self, obj):
        self._get_skill_comparison(obj)
        analysis = getattr(obj, '_cached_match_analysis', None)
        if analysis:
            return {
                'match_score': analysis['match_score'],
                'ats_score': analysis['ats_score'],
                'skills_breakdown': analysis['skills_breakdown'],
                'why_explanation': analysis['why_explanation']
            }
        return None


class JobApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    resume = serializers.FileField(required=False, allow_null=True)
    
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    qualification = serializers.CharField(required=False, allow_blank=True)
    experience = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('applicant', 'applied_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs
            
        user = request.user
        
        # If it's a creation (POST)
        if request.method == 'POST':
            # Pre-populate fields from job seeker profile if not provided
            if user.is_authenticated and user.role == 'JOB_SEEKER':
                if not attrs.get('full_name'):
                    attrs['full_name'] = user.full_name
                if not attrs.get('email'):
                    attrs['email'] = user.email
                if not attrs.get('phone'):
                    attrs['phone'] = user.phone or 'Not specified'
                if not attrs.get('qualification'):
                    attrs['qualification'] = user.degree or user.education or 'Not specified'
                if not attrs.get('experience'):
                    attrs['experience'] = user.experience or user.years_of_experience or '0 years'
                if not attrs.get('address'):
                    attrs['address'] = user.preferred_location or 'Not specified'
            
            # Validation checks for creation
            if not attrs.get('qualification') or attrs.get('qualification').strip() == '':
                raise serializers.ValidationError({"qualification": "Qualification is required. Please update your profile."})
            if not attrs.get('full_name') or attrs.get('full_name').strip() == '':
                raise serializers.ValidationError({"full_name": "Full name is required."})
            if not attrs.get('email') or attrs.get('email').strip() == '':
                raise serializers.ValidationError({"email": "Email is required."})
            if not attrs.get('phone') or attrs.get('phone').strip() == '':
                raise serializers.ValidationError({"phone": "Phone number is required."})
            if not attrs.get('experience') or attrs.get('experience').strip() == '':
                raise serializers.ValidationError({"experience": "Experience is required."})
        
        # If it's an update (PUT/PATCH)
        else:
            # If the user is a JOB_SEEKER, they should not be allowed to change status
            if user.is_authenticated and user.role == 'JOB_SEEKER' and 'status' in attrs:
                raise serializers.ValidationError({"status": "Job seekers cannot modify application status."})
                
            # Only validate fields if they are explicitly being updated
            if 'qualification' in attrs and (not attrs.get('qualification') or attrs.get('qualification').strip() == ''):
                raise serializers.ValidationError({"qualification": "Qualification cannot be blank."})
            if 'full_name' in attrs and (not attrs.get('full_name') or attrs.get('full_name').strip() == ''):
                raise serializers.ValidationError({"full_name": "Full name cannot be blank."})
            if 'email' in attrs and (not attrs.get('email') or attrs.get('email').strip() == ''):
                raise serializers.ValidationError({"email": "Email cannot be blank."})
            if 'phone' in attrs and (not attrs.get('phone') or attrs.get('phone').strip() == ''):
                raise serializers.ValidationError({"phone": "Phone number cannot be blank."})
            if 'experience' in attrs and (not attrs.get('experience') or attrs.get('experience').strip() == ''):
                raise serializers.ValidationError({"experience": "Experience cannot be blank."})
                
        return attrs


class SwipeHistorySerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), source='job', write_only=True
    )

    class Meta:
        model = SwipeHistory
        fields = ('id', 'job', 'job_id', 'action', 'swiped_at')
        read_only_fields = ('id', 'swiped_at')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
