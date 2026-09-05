import tempfile
import os
from rest_framework import viewsets, status, generics, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Job, SwipeHistory, JobApplication, Notification
from .serializers import JobSerializer, SwipeHistorySerializer, JobApplicationSerializer, NotificationSerializer
from users.resume_parser import parse_resume


def create_job_notifications(job, seeker):
    skills_str = job.skills or ''
    job_skills = [s.strip() for s in skills_str.split(',') if s.strip()]
    if not job_skills:
        return
        
    seeker_text = f"{seeker.skills or ''} {seeker.extracted_skills or ''} {seeker.experience or ''} {seeker.education or ''}".lower()
    
    matching = []
    missing = []
    for js in job_skills:
        if js.lower() in seeker_text:
            matching.append(js)
        else:
            missing.append(js)
            
    total = len(job_skills)
    ats_score = int((len(matching) / total) * 100) if total > 0 else 100
    compatibility_score = ats_score
    
    if seeker.preferred_location and job.location:
        if seeker.preferred_location.lower() in job.location.lower() or job.location.lower() in seeker.preferred_location.lower():
            compatibility_score += 10
    if seeker.preferred_job_type and job.job_type:
        if seeker.preferred_job_type.upper() == job.job_type.upper():
            compatibility_score += 10
    compatibility_score = min(100, compatibility_score)
    
    is_relevant = len(matching) > 0 or compatibility_score >= 60
    if not is_relevant:
        return
        
    app_count = job.applications.count()
    
    matching_skills_str = ', '.join(matching) if matching else 'None'
    missing_skills_str = ', '.join(missing) if missing else 'None'

    msg_new_job = f"New Job Match 🎯\n{job.title} at {job.company}\nCompatibility: {compatibility_score}%\nMatching skills: {matching_skills_str}\nThis job matches your profile."
    Notification.objects.create(
        recipient=seeker,
        message=msg_new_job,
        notification_type='NEW_JOB',
        related_job=job
    )
    
    if job.company_type in ['STARTUP', 'NEW_STARTUP']:
        msg_startup = f"🚀 Startup Hiring Alert\nA startup is hiring for {job.title}.\nYour profile matches this job by {compatibility_score}%."
        Notification.objects.create(
            recipient=seeker,
            message=msg_startup,
            notification_type='STARTUP_HIRING',
            related_job=job
        )
        
    if app_count <= 3:
        msg_low_comp = f"🔥 Low Competition Opportunity\n{job.title} at {job.company}\nOnly {app_count} applicants so far.\nYour compatibility: {compatibility_score}%."
        Notification.objects.create(
            recipient=seeker,
            message=msg_low_comp,
            notification_type='LOW_COMPETITION',
            related_job=job
        )
        
    if compatibility_score >= 80:
        msg_high_match = f"✨ Strong Job Match\n{job.title} at {job.company}\nCompatibility: {compatibility_score}%\nMatching skills: {matching_skills_str}\nMissing skills: {missing_skills_str}"
        Notification.objects.create(
            recipient=seeker,
            message=msg_high_match,
            notification_type='HIGH_MATCH',
            related_job=job
        )


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        job = serializer.save(posted_by=self.request.user)
        
        from users.models import User
        job_seekers = User.objects.filter(role='JOB_SEEKER')
        for seeker in job_seekers:
            create_job_notifications(job, seeker)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        ordering = request.query_params.get('ordering')
        if ordering in ['latest', 'highest_salary', 'lowest_salary']:
            return response

        if isinstance(response.data, list):
            response.data.sort(
                key=lambda j: (
                    j.get('match_score') if j.get('match_score') is not None else 0,
                    j.get('ats_score') if j.get('ats_score') is not None else 0,
                    j.get('id') or 0
                ),
                reverse=True
            )
        return response

    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.all()

        if user.is_authenticated:
            if user.role == 'RECRUITER':
                queryset = queryset.filter(posted_by=user)
            elif user.role == 'JOB_SEEKER':
                queryset = queryset.filter(is_active=True)
                applied_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
                queryset = queryset.exclude(id__in=applied_ids)
        else:
            queryset = queryset.filter(is_active=True)

        params = self.request.query_params

        location = params.get('location')
        skills = params.get('skills')
        experience = params.get('experience')
        company = params.get('company')
        company_type = params.get('company_type')
        job_type = params.get('job_type')
        search = params.get('search')

        salary_min = params.get('salary_min')
        salary_max = params.get('salary_max')
        remote = params.get('remote')
        ordering = params.get('ordering')

        if location:
            queryset = queryset.filter(location__icontains=location)
        if skills:
            for skill in skills.split(','):
                queryset = queryset.filter(skills__icontains=skill.strip())
        if experience:
            queryset = queryset.filter(experience__icontains=experience)
        if company:
            queryset = queryset.filter(company__icontains=company)
        if company_type:
            queryset = queryset.filter(company_type=company_type)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        if remote == 'true':
            queryset = queryset.filter(job_type='REMOTE')
        if salary_min:
            queryset = queryset.filter(salary_min__gte=salary_min)
        if salary_max:
            queryset = queryset.filter(salary_max__lte=salary_max)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(skills__icontains=search) |
                Q(description__icontains=search)
            )

        if ordering:
            if ordering == 'latest':
                queryset = queryset.order_by('-posted_date')
            elif ordering == 'highest_salary':
                queryset = queryset.order_by('-salary_max', '-salary_min')
            elif ordering == 'lowest_salary':
                queryset = queryset.order_by('salary_min', 'salary_max')
            
        return queryset


class SwipeActionView(generics.CreateAPIView):
    serializer_class = SwipeHistorySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job_id')
        action_type = request.data.get('action')

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_authenticated:
            user = request.user
        else:
            from users.models import User
            user, _ = User.objects.get_or_create(
                email='guest@swipex.app',
                defaults={
                    'full_name': 'Guest Seeker',
                    'role': 'JOB_SEEKER',
                    'skills': 'Python, React, JavaScript, SQL, Git'
                }
            )

        if action_type in ['UNSAVE', 'UNSAVED']:
            SwipeHistory.objects.filter(user=user, job=job, action='SAVED').delete()
            return Response({'message': 'Job unsaved successfully.'}, status=status.HTTP_200_OK)

        if action_type not in ['SAVED', 'APPLIED', 'SKIPPED']:
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'SKIPPED':
            SwipeHistory.objects.filter(user=user, job=job, action='SAVED').delete()
        elif action_type == 'SAVED':
            SwipeHistory.objects.filter(user=user, job=job, action='SKIPPED').delete()

        swipe, created = SwipeHistory.objects.update_or_create(
            user=user,
            job=job,
            action=action_type,
            defaults={}
        )

        serializer = self.get_serializer(swipe)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class SavedJobsView(generics.ListAPIView):
    serializer_class = SwipeHistorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return SwipeHistory.objects.filter(user=self.request.user, action='SAVED')
        from users.models import User
        guest = User.objects.filter(email='guest@swipex.app').first()
        return SwipeHistory.objects.filter(user=guest, action='SAVED') if guest else SwipeHistory.objects.none()


class AppliedJobsView(generics.ListAPIView):
    serializer_class = SwipeHistorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return SwipeHistory.objects.filter(user=self.request.user, action='APPLIED')
        from users.models import User
        guest = User.objects.filter(email='guest@swipex.app').first()
        return SwipeHistory.objects.filter(user=guest, action='APPLIED') if guest else SwipeHistory.objects.none()


class SkippedJobsView(generics.ListAPIView):
    serializer_class = SwipeHistorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return SwipeHistory.objects.filter(user=self.request.user, action='SKIPPED')
        from users.models import User
        guest = User.objects.filter(email='guest@swipex.app').first()
        return SwipeHistory.objects.filter(user=guest, action='SKIPPED') if guest else SwipeHistory.objects.none()


class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'RECRUITER':
            return JobApplication.objects.filter(job__posted_by=user).order_by('-ats_score')
        return JobApplication.objects.filter(applicant=user).order_by('-ats_score')

    def perform_create(self, serializer):
        user = self.request.user
        job = serializer.validated_data.get('job')
        
        if JobApplication.objects.filter(applicant=user, job=job).exists():
            raise serializers.ValidationError({"detail": "You have already applied for this job."})

        resume_file = serializer.validated_data.get('resume')
        
        if not resume_file:
            if user.resume:
                resume_file = user.resume
            else:
                raise serializers.ValidationError({"resume": "Resume is required. Please upload one or add it to your profile."})

        resume_summary = ""
        extracted_skills = []
        if resume_file and resume_file != user.resume:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.name)[1]) as tmp:
                for chunk in resume_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            try:
                parsed_data = parse_resume(tmp_path)
                extracted_skills = parsed_data.get('skills', [])
                resume_summary = parsed_data.get('summary', '')
            finally:
                os.unlink(tmp_path)
        else:
            if user.extracted_skills:
                extracted_skills = [s.strip() for s in user.extracted_skills.split(',') if s.strip()]
            if user.resume_summary:
                resume_summary = user.resume_summary
            elif user.resume:
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(user.resume.name)[1]) as tmp:
                    for chunk in user.resume.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                try:
                    parsed_data = parse_resume(tmp_path)
                    extracted_skills = parsed_data.get('skills', [])
                    resume_summary = parsed_data.get('summary', '')
                finally:
                    os.unlink(tmp_path)

        user_skills = serializer.validated_data.get('skills') or user.skills or ''
        user_experience = serializer.validated_data.get('experience') or user.experience or ''
        user_qualification = serializer.validated_data.get('qualification') or user.degree or user.education or ''
        
        extracted_skills_str = ', '.join(extracted_skills)
        user_text = f"{user_skills} {extracted_skills_str} {user_experience} {user_qualification}".lower()
        
        job_skills = [s.strip() for s in job.skills.split(',') if s.strip()]
        
        matching = []
        missing = []
        for js in job_skills:
            if js.lower() in user_text:
                matching.append(js)
            else:
                missing.append(js)
                
        total = len(job_skills)
        ats_score = int((len(matching) / total) * 100) if total > 0 else 100
        compatibility_score = ats_score
        
        if user.preferred_location and job.location:
            if user.preferred_location.lower() in job.location.lower() or job.location.lower() in user.preferred_location.lower():
                compatibility_score += 10
        if user.preferred_job_type and job.job_type:
            if user.preferred_job_type.upper() == job.job_type.upper():
                compatibility_score += 10
                
        liked_job_ids = SwipeHistory.objects.filter(user=user, action__in=['SAVED', 'APPLIED']).values_list('job_id', flat=True)
        liked_jobs = Job.objects.filter(id__in=liked_job_ids)
        similar_liked = liked_jobs.filter(Q(job_type=job.job_type) | Q(title__icontains=job.title.split()[0])).count()
        if similar_liked > 0:
            compatibility_score += 10
            
        compatibility_score = min(100, compatibility_score)
        
        applied_count = JobApplication.objects.filter(applicant=user).count()
        recommendation_reason = f"Recommended because your resume/profile matches {len(matching)} out of {total} required skills"
        if applied_count > 0:
            recommendation_reason += f" and your previous applications indicate an interest in {job.job_type.replace('_', ' ').title()} positions."
        else:
            recommendation_reason += f" and this role matches your preferred location ({user.preferred_location or 'Remote'})."
            
        recommendation_priority = "MEDIUM"
        if ats_score >= 80:
            recommendation_priority = "HIGH"
        elif ats_score < 50:
            recommendation_priority = "LOW"
        
        application = serializer.save(
            applicant=user,
            resume=resume_file,
            ats_score=ats_score,
            compatibility_score=compatibility_score,
            matched_skills=','.join(matching),
            missing_skills=','.join(missing),
            matched_keywords=','.join(matching),
            missing_keywords=','.join(missing),
            recommendation_reason=recommendation_reason,
            resume_summary=resume_summary,
            extracted_skills=','.join(extracted_skills),
            technologies_found=','.join(extracted_skills),
            recommendation_priority=recommendation_priority
        )
        
        if application.job.posted_by:
            Notification.objects.create(
                recipient=application.job.posted_by,
                message=f"New applicant {self.request.user.full_name} for {application.job.title} (ATS Score: {ats_score}%)",
                notification_type='NEW_APPLICANT',
                related_job=application.job,
                related_application=application
            )
        Notification.objects.create(
            recipient=self.request.user,
            message=f"Application submitted successfully for {application.job.title}",
            notification_type='APPLICATION_SUBMITTED',
            related_job=application.job,
            related_application=application
        )

    def perform_update(self, serializer):
        try:
            old_status = JobApplication.objects.get(id=serializer.instance.id).status
        except JobApplication.DoesNotExist:
            old_status = 'APPLIED'

        application = serializer.save()
        if old_status != application.status:
            status_notif_map = {
                'APPLIED': 'APPLICATION_SUBMITTED',
                'SHORTLISTED': 'SHORTLISTED',
                'INTERVIEW': 'INTERVIEW_SCHEDULED',
                'SELECTED': 'SELECTED',
                'REJECTED': 'REJECTED',
            }
            notif_type = status_notif_map.get(application.status, 'SYSTEM')
            
            missing_skills_str = ', '.join([s.strip() for s in application.missing_skills.split(',') if s.strip()]) if application.missing_skills else 'None'
            missing_keywords_str = ', '.join([s.strip() for s in application.missing_keywords.split(',') if s.strip()]) if application.missing_keywords else 'None'

            msg_map = {
                'SHORTLISTED': f"🎉 Application Shortlisted\n\nYour application for {application.job.title} has been shortlisted by the recruiter.\n\nATS Score: {application.ats_score}%\nCompatibility: {application.compatibility_score}%",
                'INTERVIEW': f"📅 Interview Scheduled\n\nYour application for {application.job.title} has been scheduled for an interview.",
                'SELECTED': f"🎉 Congratulations!\n\nYou have been selected for {application.job.title}.",
                'REJECTED': f"Application Update\n\nYour application for {application.job.title} was not selected.\n\nHow to improve:\n- Improve missing skills: {missing_skills_str}\n- Add relevant keywords: {missing_keywords_str}\n- Add projects\n- Improve resume ATS score: {application.ats_score}%",
            }
            msg = msg_map.get(application.status, f"Your application for {application.job.title} is now {application.get_status_display()}.")

            Notification.objects.create(
                recipient=application.applicant,
                message=msg,
                notification_type=notif_type,
                related_job=application.job,
                related_application=application
            )

class AnalyzeApplicationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        job_id = request.data.get('job')
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        resume_file = request.FILES.get('resume')
        
        resume_summary = ""
        extracted_skills = []
        if resume_file:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.name)[1]) as tmp:
                for chunk in resume_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            
            try:
                parsed_data = parse_resume(tmp_path)
                extracted_skills = parsed_data.get('skills', [])
                resume_summary = parsed_data.get('summary', '')
            finally:
                os.unlink(tmp_path)
        else:
            if user.extracted_skills:
                extracted_skills = [s.strip() for s in user.extracted_skills.split(',') if s.strip()]
            if user.resume_summary:
                resume_summary = user.resume_summary
            elif user.resume:
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(user.resume.name)[1]) as tmp:
                    for chunk in user.resume.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                try:
                    parsed_data = parse_resume(tmp_path)
                    extracted_skills = parsed_data.get('skills', [])
                    resume_summary = parsed_data.get('summary', '')
                finally:
                    os.unlink(tmp_path)

        user_skills = request.data.get('skills') or user.skills or ''
        user_experience = request.data.get('experience') or user.experience or ''
        user_qualification = request.data.get('qualification') or user.degree or user.education or ''
        
        extracted_skills_str = ', '.join(extracted_skills)
        user_text = f"{user_skills} {extracted_skills_str} {user_experience} {user_qualification}".lower()
        
        job_skills = [s.strip() for s in job.skills.split(',') if s.strip()]
        
        matching_skills = []
        missing_skills = []
        
        for js in job_skills:
            if js.lower() in user_text:
                matching_skills.append(js)
            else:
                missing_skills.append(js)

        total = len(job_skills)
        ats_score = int((len(matching_skills) / total) * 100) if total > 0 else 100
        compatibility_score = ats_score
        
        if user.preferred_location and job.location:
            if user.preferred_location.lower() in job.location.lower() or job.location.lower() in user.preferred_location.lower():
                compatibility_score += 10
        if user.preferred_job_type and job.job_type:
            if user.preferred_job_type.upper() == job.job_type.upper():
                compatibility_score += 10
                
        liked_job_ids = SwipeHistory.objects.filter(user=user, action__in=['SAVED', 'APPLIED']).values_list('job_id', flat=True)
        liked_jobs = Job.objects.filter(id__in=liked_job_ids)
        similar_liked = liked_jobs.filter(Q(job_type=job.job_type) | Q(title__icontains=job.title.split()[0])).count()
        if similar_liked > 0:
            compatibility_score += 10
            
        compatibility_score = min(100, compatibility_score)

        ats_score_rating = "Excellent"
        if ats_score < 40:
            ats_score_rating = "Needs Improvement"
        elif ats_score < 60:
            ats_score_rating = "Average"
        elif ats_score < 80:
            ats_score_rating = "Good"

        suggested_courses = []
        suggested_certifications = []
        suggested_projects = []
        
        for skill in missing_skills[:3]:
            suggested_courses.append(f"Complete {skill} Bootcamp on Udemy")
            suggested_projects.append(f"Build a Portfolio Project using {skill}")
            
            sl = skill.lower()
            if 'aws' in sl or 'cloud' in sl:
                suggested_certifications.append("AWS Certified Solutions Architect")
            elif 'kubernetes' in sl or 'docker' in sl:
                suggested_certifications.append("Certified Kubernetes Administrator (CKA)")
            elif 'react' in sl or 'javascript' in sl or 'typescript' in sl:
                suggested_certifications.append("Meta Front-End Developer Certificate")
            elif 'python' in sl or 'machine learning' in sl or 'data' in sl:
                suggested_certifications.append("Google Data Analytics Professional Certificate")
            else:
                suggested_certifications.append(f"Professional Certificate in {skill}")
                
        if not missing_skills:
            suggested_courses.append("Advanced System Design Course")
            suggested_certifications.append("AWS Certified Solutions Architect - Professional")
            suggested_projects.append("Contribute to open-source project or build a microservices app")

        weak_areas = []
        resume_improvements = []
        if ats_score < 80:
            weak_areas.append("Lack of matching keywords in resume")
            if missing_skills:
                weak_areas.append(f"Missing core technical skills: {', '.join(missing_skills[:2])}")
            resume_improvements.append("Add missing keywords directly to your skills section")
            resume_improvements.append("Quantify your impact in your professional experience section")
            resume_improvements.append("Tailor your professional summary to align with the job description")
        else:
            weak_areas.append("None - strong keyword matching!")
            resume_improvements.append("No major improvements needed. Good match.")

        swipe_recommendation = ""
        saved_count = SwipeHistory.objects.filter(user=user, action='SAVED').count()
        applied_count = JobApplication.objects.filter(applicant=user).count()
        
        if applied_count > 0:
            swipe_recommendation = f"Based on your {applied_count} previous applications, this job aligns well with your interest in {job.job_type.replace('_', ' ').title()} roles."
        elif saved_count > 0:
            swipe_recommendation = f"Based on your {saved_count} saved jobs, we recommend applying to this role as it matches your bookmarked preferences."
        else:
            swipe_recommendation = "Build your swipe history by saving or applying to jobs to receive more customized recommendations."

        recommendation_reason = f"Recommended because your resume/profile matches {len(matching_skills)} out of {total} required skills"
        if applied_count > 0:
            recommendation_reason += f" and your previous applications indicate an interest in {job.job_type.replace('_', ' ').title()} positions."
        else:
            recommendation_reason += f" and this role matches your preferred location ({user.preferred_location or 'Remote'})."

        other_jobs = Job.objects.filter(is_active=True).exclude(id=job.id)
        swiped_job_ids = SwipeHistory.objects.filter(user=user).values_list('job_id', flat=True)
        applied_job_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
        other_jobs = other_jobs.exclude(id__in=set(swiped_job_ids).union(set(applied_job_ids)))
        
        similar_jobs = []
        user_skills_list = [s.strip().lower() for s in (user_skills + ',' + ','.join(extracted_skills)).split(',') if s.strip()]
        for oj in other_jobs[:10]:
            oj_skills = [s.strip().lower() for s in oj.skills.split(',') if s.strip()]
            intersection = set(oj_skills).intersection(set(user_skills_list))
            similar_jobs.append((len(intersection), oj))
            
        similar_jobs.sort(key=lambda x: x[0], reverse=True)
        recommended_jobs = []
        for score, oj in similar_jobs[:2]:
            recommended_jobs.append({
                'id': oj.id,
                'title': oj.title,
                'company': oj.company,
                'location': oj.location,
                'match_score': int((score / len(oj.skills.split(','))) * 100) if len(oj.skills.split(',')) > 0 else 75
            })

        return Response({
            'resume_analysis': {
                'resume_summary': resume_summary or "Professional Resume containing technical credentials.",
                'extracted_skills': extracted_skills,
                'education': user_qualification or "Not specified",
                'experience': user_experience or "Not specified",
                'technologies_found': extracted_skills
            },
            'ats_score': ats_score,
            'ats_score_rating': ats_score_rating,
            'compatibility_score': compatibility_score,
            'matched_skills': matching_skills,
            'missing_skills': missing_skills,
            'matched_keywords': matching_skills,
            'missing_keywords': missing_skills,
            'suggested_courses': suggested_courses,
            'suggested_certifications': suggested_certifications,
            'suggested_projects': suggested_projects,
            'weak_areas': weak_areas,
            'resume_improvements': resume_improvements,
            'swipe_recommendation': swipe_recommendation,
            'recommended_jobs': recommended_jobs
        })

class AnalyticsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'RECRUITER':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        jobs = Job.objects.filter(posted_by=request.user)
        total_jobs = jobs.count()
        active_jobs = jobs.filter(is_active=True).count()
        
        applications = JobApplication.objects.filter(job__posted_by=request.user)
        total_applicants = applications.count()
        shortlisted = applications.filter(status='SHORTLISTED').count()
        rejected = applications.filter(status='REJECTED').count()
        pending = applications.filter(status='APPLIED').count()
        interview = applications.filter(status='INTERVIEW').count()
        selected = applications.filter(status='SELECTED').count()
        
        from django.db.models import Avg, Min, Max
        stats = applications.aggregate(
            avg_ats=Avg('ats_score'),
            min_ats=Min('ats_score'),
            max_ats=Max('ats_score'),
            avg_comp=Avg('compatibility_score'),
            min_comp=Min('compatibility_score'),
            max_comp=Max('compatibility_score')
        )
        
        avg_ats = stats['avg_ats'] or 0
        min_ats = stats['min_ats'] or 0
        max_ats = stats['max_ats'] or 0
        avg_comp = stats['avg_comp'] or 0
        min_comp = stats['min_comp'] or 0
        max_comp = stats['max_comp'] or 0

        job_performance = []
        for job in jobs:
            job_apps = job.applications.all()
            job_avg_ats = job_apps.aggregate(Avg('ats_score'))['ats_score__avg'] or 0
            job_avg_comp = job_apps.aggregate(Avg('compatibility_score'))['compatibility_score__avg'] or 0
            
            job_performance.append({
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'applications_count': job_apps.count(),
                'avg_ats_score': int(job_avg_ats),
                'avg_compatibility_score': int(job_avg_comp),
                'shortlisted_count': job_apps.filter(status='SHORTLISTED').count(),
                'rejected_count': job_apps.filter(status='REJECTED').count(),
                'selected_count': job_apps.filter(status='SELECTED').count(),
            })
        
        return Response({
            'total_jobs_posted': total_jobs,
            'active_jobs': active_jobs,
            'total_applicants': total_applicants,
            'shortlisted': shortlisted,
            'rejected': rejected,
            'pending': pending,
            'interview': interview,
            'selected': selected,
            'avg_ats_score': int(avg_ats),
            'min_ats_score': int(min_ats),
            'max_ats_score': int(max_ats),
            'avg_compatibility_score': int(avg_comp),
            'min_compatibility_score': int(min_comp),
            'max_compatibility_score': int(max_comp),
            'status_distribution': {
                'Applied': pending,
                'Shortlisted': shortlisted,
                'Interview': interview,
                'Rejected': rejected,
                'Selected': selected
            },
            'job_performance': job_performance
        })


class JobSeekerAnalyticsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'JOB_SEEKER':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        applications = JobApplication.objects.filter(applicant=user)
        total_applied = applications.count()
        
        from django.db.models import Avg, Max
        avg_ats = applications.aggregate(Avg('ats_score'))['ats_score__avg'] or 0
        avg_comp = applications.aggregate(Avg('compatibility_score'))['compatibility_score__avg'] or 0
        best_ats = applications.aggregate(Max('ats_score'))['ats_score__max'] or 0
        
        shortlisted = applications.filter(status='SHORTLISTED').count()
        interview = applications.filter(status='INTERVIEW').count()
        selected = applications.filter(status='SELECTED').count()
        rejected = applications.filter(status='REJECTED').count()
        saved_count = SwipeHistory.objects.filter(user=user, action='SAVED').count()
        success_rate = int((selected / total_applied) * 100) if total_applied > 0 else 0
        
        fields = [user.skills, user.education, user.experience, user.resume, user.degree, user.linkedin]
        filled = sum(1 for f in fields if f)
        completion_percent = int((filled / len(fields)) * 100) if fields else 0
        
        import collections
        all_matched = []
        all_missing = []
        for app in applications:
            if app.matched_skills:
                all_matched.extend([s.strip() for s in app.matched_skills.split(',') if s.strip()])
            if app.missing_skills:
                all_missing.extend([s.strip() for s in app.missing_skills.split(',') if s.strip()])
        
        matched_counts = collections.Counter(all_matched)
        missing_counts = collections.Counter(all_missing)
        
        strongest_skills = [item[0] for item in matched_counts.most_common(5)]
        frequently_missing = [item[0] for item in missing_counts.most_common(5)]
        
        suggestions = []
        if not user.resume:
            suggestions.append("Upload a resume to automatically extract skills.")
        if not user.skills:
            suggestions.append("Add more skills to your profile to improve match rates.")
        if frequently_missing:
            suggestions.append(f"Your resume frequently misses keywords like: {', '.join(frequently_missing[:2])}. Try adding projects or certificates involving them.")
        if avg_ats < 60 and total_applied > 0:
            suggestions.append("Tailor your summary or skills section to align closer with job requirements.")
        elif avg_ats >= 80 and total_applied > 0:
            suggestions.append("Excellent match rate! Keep sending tailored applications.")
            
        swiped_job_ids = SwipeHistory.objects.filter(user=user).values_list('job_id', flat=True)
        applied_job_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
        exclude_ids = set(swiped_job_ids).union(set(applied_job_ids))
        
        preferred_job_type_display = user.preferred_job_type.replace('_', ' ').title() if user.preferred_job_type else "Backend Development"
        recommended_count = Job.objects.filter(is_active=True).exclude(id__in=exclude_ids).count()
        skipped_count = SwipeHistory.objects.filter(user=user, action='SKIPPED').count()
        total_viewed = SwipeHistory.objects.filter(user=user).values('job_id').distinct().count() + total_applied
        
        active_jobs = Job.objects.filter(is_active=True).exclude(id__in=applied_job_ids)
        jobs_matched = 0
        seeker_text = f"{user.skills or ''} {user.extracted_skills or ''} {user.experience or ''} {user.education or ''}".lower()
        for job in active_jobs:
            job_skills = [s.strip().lower() for s in job.skills.split(',') if s.strip()]
            if not job_skills:
                jobs_matched += 1
                continue
            matching_skills = [js for js in job_skills if js in seeker_text]
            score = int((len(matching_skills) / len(job_skills)) * 100)
            comp = score
            if user.preferred_location and job.location:
                if user.preferred_location.lower() in job.location.lower() or job.location.lower() in user.preferred_location.lower():
                    comp += 10
            if user.preferred_job_type and job.job_type:
                if user.preferred_job_type.upper() == job.job_type.upper():
                    comp += 10
            comp = min(100, comp)
            if comp >= 70:
                jobs_matched += 1
                
        resume_match_rate = int((jobs_matched / recommended_count) * 100) if recommended_count > 0 else 0
        if resume_match_rate >= 50 or jobs_matched >= 5:
            resume_performance_status = "GOOD"
            resume_performance_message = f"Your resume matches {jobs_matched} out of {recommended_count} recommended jobs."
        else:
            resume_performance_status = "IMPROVABLE"
            resume_performance_message = f"Your resume matches only {jobs_matched} out of {recommended_count} recommended jobs."
            
        categories = [job.title for job in active_jobs]
        category_counts = collections.Counter(categories)
        top_categories = [{"category": cat, "count": count} for cat, count in category_counts.most_common(4)]
        
        matching_reasons = [
            f"✓ {len(strongest_skills)} matching skills",
            f"✓ {int(avg_comp) or 75}% average compatibility",
        ]
        if user.preferred_location:
            matching_reasons.append("✓ Matches preferred location")
        if user.preferred_job_type:
            matching_reasons.append("✓ Aligns with preferred job type")
            
        overall_ats_score = 0
        if user.resume:
            overall_ats_score += 30
        if user.skills or user.extracted_skills:
            overall_ats_score += 15
        if user.education:
            overall_ats_score += 15
        if user.experience:
            overall_ats_score += 15
        if user.phone and user.email:
            overall_ats_score += 10
        if user.degree:
            overall_ats_score += 10
        if user.linkedin or user.portfolio:
            overall_ats_score += 5

        return Response({
            'total_applied': total_applied,
            'saved_jobs_count': saved_count,
            'shortlisted_count': shortlisted,
            'interview_count': interview,
            'selected_count': selected,
            'rejected_count': rejected,
            'success_rate': success_rate,
            'avg_ats_score': int(avg_ats),
            'avg_compatibility_score': int(avg_comp),
            'best_ats_match': int(best_ats),
            'profile_completion': completion_percent,
            'recommended_jobs_count': recommended_count,
            'strongest_skills': strongest_skills,
            'frequently_missing': frequently_missing,
            'suggestions': suggestions,
            'total_viewed': total_viewed,
            'jobs_matched': jobs_matched,
            'resume_match_rate': resume_match_rate,
            'resume_performance_status': resume_performance_status,
            'resume_performance_message': resume_performance_message,
            'overall_ats_score': overall_ats_score,
            'resume_uploaded': bool(user.resume),
            'recommendation_insights': {
                'recommended_count': recommended_count,
                'applied_count': total_applied,
                'shortlisted_count': shortlisted,
                'rejected_count': rejected,
                'saved_count': saved_count,
                'skipped_count': skipped_count,
                'matching_reasons': matching_reasons,
                'top_categories': top_categories
            }
        })

class RecommendationView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'JOB_SEEKER':
            return Job.objects.none()

        applied_job_ids = JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True)
        query = Job.objects.filter(is_active=True).exclude(id__in=applied_job_ids)
        return query.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        user = self.request.user
        if not user.is_authenticated or user.role != 'JOB_SEEKER':
            return Response([])

        applied_job_ids = set(JobApplication.objects.filter(applicant=user).values_list('job_id', flat=True))
        saved_job_ids = set(SwipeHistory.objects.filter(user=user, action='SAVED').values_list('job_id', flat=True))
        skipped_job_ids = set(SwipeHistory.objects.filter(user=user, action='SKIPPED').values_list('job_id', flat=True))

        saved_applied_jobs = Job.objects.filter(id__in=applied_job_ids.union(saved_job_ids))
        favored_job_titles = list(saved_applied_jobs.values_list('title', flat=True))

        context = self.get_serializer_context()
        context['favored_job_titles'] = favored_job_titles

        serializer = self.get_serializer(queryset, many=True, context=context)
        data = serializer.data

        has_skills = bool((user.skills or '').strip() or (user.extracted_skills or '').strip())
        has_profile_data = has_skills or bool((user.experience or '').strip() or user.resume or (user.education or '').strip())

        if not has_profile_data:
            return Response(data[:20])

        strong_jobs = [
            j for j in data 
            if ((j.get('ats_score') or 0) > 0 and (j.get('match_score') or 0) >= 35)
            or (not j.get('missing_skills') and (j.get('match_score') or 0) >= 50)
        ]

        if len(strong_jobs) >= 3:
            filtered_data = strong_jobs
        elif len(strong_jobs) > 0:
            weak_jobs = [j for j in data if j not in strong_jobs and (j.get('match_score') or 0) >= 20]
            filtered_data = strong_jobs + weak_jobs
        else:
            filtered_data = data

        def sort_key(j):
            score = j.get('match_score') or 0
            ats = j.get('ats_score') or 0
            jid = j.get('id')
            boost = 2 if jid in saved_job_ids else (-2 if jid in skipped_job_ids else 0)
            return (score + boost, ats, score)

        filtered_data.sort(key=sort_key, reverse=True)

        return Response(filtered_data[:20])


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(recipient=self.request.user)


class AIResumeAnalysisView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user.resume:
            return Response({'error': 'No resume uploaded yet.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if user.resume_score == 0:
            return Response({
                'resume_score': 0,
                'strengths': [],
                'gaps': [],
                'improvements': []
            }, status=status.HTTP_200_OK)
            
        return Response({
            'resume_score': user.resume_score,
            'strengths': [s for s in user.resume_strengths.split('\n') if s],
            'gaps': [g for g in user.resume_gaps.split('\n') if g],
            'improvements': [imp for imp in user.resume_improvements.split('\n') if imp]
        }, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        user = request.user

        if 'resume' in request.FILES:
            uploaded_file = request.FILES['resume']
            import os
            ext = os.path.splitext(uploaded_file.name)[1].lower()
            if ext not in ['.pdf', '.docx', '.doc', '.txt']:
                return Response({'error': 'Unsupported file format. Please upload a PDF or DOCX resume.'}, status=status.HTTP_400_BAD_REQUEST)
            if uploaded_file.size > 5 * 1024 * 1024:
                return Response({'error': 'File size exceeds 5MB limit. Please upload a smaller file.'}, status=status.HTTP_400_BAD_REQUEST)
            if uploaded_file.size == 0:
                return Response({'error': 'The uploaded file is empty. Please upload a valid resume.'}, status=status.HTTP_400_BAD_REQUEST)

            user.resume = uploaded_file
            user.save(update_fields=['resume'])

            try:
                from users.resume_parser import parse_resume
                parsed_data = parse_resume(user.resume.path)
                user.extracted_skills = ', '.join(parsed_data.get('skills', []))
                user.resume_summary = parsed_data.get('summary', '')
                user.save(update_fields=['extracted_skills', 'resume_summary'])
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Resume parsing warning: {e}")

        if not user.resume:
            return Response({'error': 'No resume uploaded yet. Please upload a PDF or DOCX file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from users.resume_parser import extract_text_from_file
            resume_text = extract_text_from_file(user.resume.path)
        except Exception:
            resume_text = ""

        user_profile = {
            'skills': user.skills,
            'experience': user.experience,
            'education': user.education,
        }

        from .ai_service import get_resume_analysis
        result = get_resume_analysis(resume_text, user_profile)

        user.resume_score = result.get('resume_score', 0)
        user.resume_strengths = '\n'.join(result.get('strengths', []))
        user.resume_gaps = '\n'.join(result.get('gaps', []))
        user.resume_improvements = '\n'.join(result.get('improvements', []))
        user.save(update_fields=['resume_score', 'resume_strengths', 'resume_gaps', 'resume_improvements'])

        return Response(result, status=status.HTTP_200_OK)


class AICareerAssistantView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        user_profile = {
            'skills': user.skills,
            'experience': user.experience,
            'education': user.education,
            'degree': user.degree,
            'preferred_location': user.preferred_location,
            'preferred_job_type': user.preferred_job_type
        }
        
        from .ai_service import get_career_assistant_response
        result = get_career_assistant_response(prompt, user_profile)
        return Response(result, status=status.HTTP_200_OK)


class AIGenerateJobDescView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        role = request.data.get('role')
        skills = request.data.get('skills')
        experience = request.data.get('experience')
        
        if not role:
            return Response({'error': 'Role is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from .ai_service import generate_job_description
        result = generate_job_description(role, skills, experience)
        return Response(result, status=status.HTTP_200_OK)

