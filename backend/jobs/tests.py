from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Job, SwipeHistory
from .ai_service import (
    get_fallback_analysis,
    get_fallback_resume_analysis,
    get_fallback_career_assistant_response,
    get_fallback_job_description,
)

User = get_user_model()


class JobAIFeaturesTests(APITestCase):
    def setUp(self):
        # Create Seeker
        self.seeker = User.objects.create_user(
            email='seeker@example.com',
            full_name='Test Seeker',
            password='password123',
            role='JOB_SEEKER',
            skills='Python, Django, React, PostgreSQL',
            experience='2 years backend development',
            education='B.Tech Computer Science',
            preferred_location='Bangalore',
            preferred_job_type='FULL_TIME'
        )

        # Create Recruiter
        self.recruiter = User.objects.create_user(
            email='recruiter@example.com',
            full_name='Test Recruiter',
            password='password123',
            role='RECRUITER'
        )

        # Create Sample Job
        self.job = Job.objects.create(
            title='Full Stack Developer',
            company='TechCorp',
            location='Bangalore',
            skills='Python, React, AWS, Docker',
            description='Exciting full stack role working with Python and React.',
            job_type='FULL_TIME',
            posted_by=self.recruiter
        )

    def test_job_match_fallback_engine(self):
        user_profile = {
            'skills': self.seeker.skills,
            'extracted_skills': '',
            'experience': self.seeker.experience,
            'education': self.seeker.education,
            'preferred_location': self.seeker.preferred_location,
            'preferred_job_type': self.seeker.preferred_job_type,
        }
        job_details = {
            'title': self.job.title,
            'company': self.job.company,
            'location': self.job.location,
            'skills': self.job.skills,
            'description': self.job.description,
            'experience': '1-3 years',
            'job_type': self.job.job_type,
        }

        insights = get_fallback_analysis(user_profile, job_details)
        self.assertIn('match_score', insights)
        self.assertGreaterEqual(insights['match_score'], 20)
        self.assertLessEqual(insights['match_score'], 100)

        # Verify skills breakdown
        breakdown = insights['skills_breakdown']
        matched_skills = [item['skill'] for item in breakdown if item['status'] in ['strong match', 'good match']]
        gap_skills = [item['skill'] for item in breakdown if item['status'] == 'skill gap']

        # Python and React should match
        self.assertIn('Python', matched_skills)
        self.assertIn('React', matched_skills)
        # AWS and Docker are gaps
        self.assertIn('AWS', gap_skills)
        self.assertIn('Docker', gap_skills)

        # Verify Why explanation
        self.assertTrue(len(insights['why_explanation']) > 0)

    def test_resume_analysis_fallback_engine(self):
        user_profile = {
            'skills': self.seeker.skills,
            'experience': self.seeker.experience,
            'education': self.seeker.education,
        }
        resume_text = "Experienced software developer skilled in Python, Django, React, and SQL database optimization."
        analysis = get_fallback_resume_analysis(resume_text, user_profile)

        self.assertIn('resume_score', analysis)
        self.assertGreater(analysis['resume_score'], 0)
        self.assertIn('strengths', analysis)
        self.assertIn('improvements', analysis)
        self.assertTrue(len(analysis['strengths']) > 0)
        self.assertTrue(len(analysis['improvements']) > 0)

    def test_career_assistant_endpoint(self):
        self.client.force_authenticate(user=self.seeker)
        url = reverse('ai-career-assistant')

        # Test skills query
        response = self.client.post(url, {'prompt': 'What skills should I learn?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response', response.data)
        self.assertTrue(len(response.data['response']) > 10)

        # Test resume query
        response = self.client.post(url, {'prompt': 'How can I improve my resume?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('STAR', response.data['response'])

        # Test empty prompt error
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_job_description_endpoint(self):
        self.client.force_authenticate(user=self.recruiter)
        url = reverse('ai-generate-job-description')

        data = {
            'role': 'Backend Developer',
            'skills': 'Python, Django, PostgreSQL',
            'experience': '1-3 years'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('description', response.data)
        desc = response.data['description']
        self.assertIn('Job Overview', desc)
        self.assertIn('Key Responsibilities', desc)
        self.assertIn('Required Skills & Qualifications', desc)

        # Missing role error
        response = self.client.post(url, {'skills': 'Python'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_swipe_actions(self):
        self.client.force_authenticate(user=self.seeker)
        url = reverse('swipe-action')

        # Test Save
        res_save = self.client.post(url, {'job_id': self.job.id, 'action': 'SAVED'}, format='json')
        self.assertIn(res_save.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(SwipeHistory.objects.filter(user=self.seeker, job=self.job, action='SAVED').exists())

        # Test Skip
        res_skip = self.client.post(url, {'job_id': self.job.id, 'action': 'SKIPPED'}, format='json')
        self.assertIn(res_skip.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # Test Invalid action
        res_invalid = self.client.post(url, {'job_id': self.job.id, 'action': 'INVALID_ACTION'}, format='json')
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seeker_analytics(self):
        self.client.force_authenticate(user=self.seeker)
        url = reverse('seeker-analytics')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overall_ats_score', response.data)
        self.assertIn('total_applied', response.data)
        self.assertIn('saved_jobs_count', response.data)
        self.assertIn('total_viewed', response.data)

        # Recruiter forbidden check
        self.client.force_authenticate(user=self.recruiter)
        recruiter_response = self.client.get(url)
        self.assertEqual(recruiter_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_guest_discovery_and_swiping(self):
        # 1. Unauthenticated GET /api/jobs/
        res_jobs = self.client.get('/api/jobs/')
        self.assertEqual(res_jobs.status_code, status.HTTP_200_OK)
        self.assertGreater(len(res_jobs.data), 0)
        first_job = res_jobs.data[0]
        self.assertIsNotNone(first_job.get('ats_score'))
        self.assertIsNotNone(first_job.get('match_score'))
        self.assertIsNotNone(first_job.get('ai_match_insights'))
        self.assertFalse(first_job.get('profile_incomplete', False))

        # 2. Unauthenticated POST /api/swipe/ (guest swipe)
        url = reverse('swipe-action')
        res_swipe = self.client.post(url, {'job_id': self.job.id, 'action': 'SAVED'}, format='json')
        self.assertIn(res_swipe.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # 3. Unauthenticated GET /api/saved-jobs/
        res_saved = self.client.get(reverse('saved-jobs'))
        self.assertEqual(res_saved.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_saved.data), 1)

