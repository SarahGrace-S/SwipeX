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
        request = self.context.get('request')
        is_authenticated_seeker = bool(request and request.user.is_authenticated and request.user.role == 'JOB_SEEKER')
        job_skills = [s.strip() for s in obj.skills.split(',') if s.strip()]

        if is_authenticated_seeker:
            user = request.user
            # Check if profile is incomplete
            if not user.skills and not user.resume and not user.experience and not user.education:
                return 0, 0, [], [], "Complete your profile or upload your resume to receive personalized recommendations.", True
            user_text = f"{user.skills} {user.extracted_skills} {user.experience} {user.education}".lower()
        else:
            # Baseline candidate skills for unauthenticated guest visitors
            user_text = "python javascript react typescript node sql postgresql git docker rest apis problem solving communication cloud"

        if not job_skills:
            return 85, 88, [], [], "This role requires general problem solving and analytical thinking.", False

        matching_original = []
        missing_original = []
        
        for js in job_skills:
            if js.lower() in user_text:
                matching_original.append(js)
            else:
                missing_original.append(js)

        # Base ATS Score calculation based on skills matching
        total_skills = len(job_skills)
        if is_authenticated_seeker:
            score = int((len(matching_original) / total_skills) * 100) if total_skills > 0 else 100
        else:
            if not matching_original and total_skills > 0:
                matching_original = [job_skills[0]]
                missing_original = job_skills[1:]
            score = max(68, min(92, int((len(matching_original) / total_skills) * 100) if total_skills > 0 else 80))
            compatibility_score = min(96, max(75, score + 6))
            reason = f"Strong alignment with role requirements ({len(matching_original)} of {total_skills} core skills match)."
            return score, compatibility_score, matching_original, missing_original, reason, False
        
        # Compatibility Score adjustments from swipe behaviour
        favored_skills = self.context.get('favored_skills')
        if favored_skills is None:
            from .models import SwipeHistory, JobApplication
            applied_job_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
            saved_job_ids = SwipeHistory.objects.filter(user=user, action='SAVED').values_list('job_id', flat=True)
            saved_applied_jobs = Job.objects.filter(id__in=set(applied_job_ids).union(set(saved_job_ids)))
            
            favored_skills = set()
            favored_job_types = set()
            for j in saved_applied_jobs:
                favored_job_types.add(j.job_type)
                for s in j.skills.split(','):
                    if s.strip():
                        favored_skills.add(s.strip().lower())
                for word in j.title.split():
                    if len(word) > 3:
                        favored_skills.add(word.lower())

            skipped_job_ids = SwipeHistory.objects.filter(user=user, action='SKIPPED').values_list('job_id', flat=True)
            skipped_jobs = Job.objects.filter(id__in=skipped_job_ids)
            disliked_skills = set()
            disliked_job_types = set()
            for j in skipped_jobs:
                disliked_job_types.add(j.job_type)
                for s in j.skills.split(','):
                    if s.strip():
                        disliked_skills.add(s.strip().lower())
                for word in j.title.split():
                    if len(word) > 3:
                        disliked_skills.add(word.lower())
        else:
            favored_job_types = self.context.get('favored_job_types', set())
            disliked_skills = self.context.get('disliked_skills', set())
            disliked_job_types = self.context.get('disliked_job_types', set())
        
        bonus = 0
        if obj.job_type in favored_job_types:
            bonus += 10
            
        for js in job_skills:
            if js.lower() in favored_skills:
                bonus += 5
                
        # Title words match bonus
        for word in obj.title.split():
            wl = word.lower()
            if wl in favored_skills:
                bonus += 10
                
        penalty = 0
        if obj.job_type in disliked_job_types:
            penalty += 15
            
        for js in job_skills:
            if js.lower() in disliked_skills:
                penalty += 5
                
        # Title words match penalty
        for word in obj.title.split():
            wl = word.lower()
            if wl in disliked_skills:
                penalty += 15
                
        # Cap the compatibility score between 0 and 100
        compatibility_score = max(0, min(100, score + bonus - penalty))
        
        reason = f"Recommended because your profile matches {len(matching_original)} of the required skills."
        if bonus > 0:
            reason += " Based on your swipe history, this role aligns with your preferences."
        if penalty > 0:
            reason += " (Note: Adjusted based on skipped job types)."
            
        if compatibility_score == 0:
            reason = "This job is trending in your area."
        
        return score, compatibility_score, matching_original, missing_original, reason, False

    def get_ats_score(self, obj):
        ats, _, _, _, _, _ = self._get_skill_comparison(obj)
        return ats

    def get_match_score(self, obj):
        insights = self.get_ai_match_insights(obj)
        if insights and insights.get('match_score', 0) >= 60:
            return insights['match_score']
        _, comp, _, _, _, _ = self._get_skill_comparison(obj)
        return comp if comp else 82

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
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'JOB_SEEKER':
            user = request.user
            user_profile = {
                'skills': user.skills,
                'extracted_skills': user.extracted_skills,
                'experience': user.experience,
                'education': user.education,
                'degree': user.degree,
                'preferred_location': user.preferred_location,
                'preferred_job_type': user.preferred_job_type
            }
        else:
            # Guest / Demo profile for unauthenticated visitors
            user_profile = {
                'skills': 'Python, JavaScript, React, SQL, Git, REST APIs, System Design',
                'extracted_skills': 'Problem Solving, Agile, Cloud, Communication',
                'experience': '2+ years engineering experience',
                'education': 'Bachelor of Science in Computer Science',
                'degree': 'B.S. Computer Science',
                'preferred_location': obj.location,
                'preferred_job_type': obj.job_type
            }
        job_details = {
            'title': obj.title,
            'company': obj.company,
            'location': obj.location,
            'skills': obj.skills,
            'description': obj.description,
            'experience': obj.experience,
            'job_type': obj.job_type
        }
        
        from .ai_service import get_fallback_analysis
        return get_fallback_analysis(user_profile, job_details)


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
