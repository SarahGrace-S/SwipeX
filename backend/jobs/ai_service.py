import os
import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

def get_ai_analysis(user_profile, job_details):
    """
    Calls Gemini API to generate:
    1. A match score (0-100)
    2. A list of skill matches with ratings (strong match, good match, skill gap)
    3. An explanation of why the job matches ("Why this job?")
    
    If the API key is not set or the call fails, it falls back to a rules-based generator.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return get_fallback_analysis(user_profile, job_details)
        
    try:
        # Construct prompt
        prompt = f"""
        You are an advanced AI recruitment assistant. Analyze the following User Profile and Job Details, then return a JSON object with:
        1. "match_score": an integer between 0 and 100 indicating how well the user fits the job based on skills, experience, and education.
        2. "skills_breakdown": a list of objects, each containing "skill" (string), "status" (either "strong match", "good match", or "skill gap"), and "icon" (either "✓" or "⚠").
        3. "why_explanation": a list of 3-5 bullet points (strings) explaining why this job matches the user, including details from their experience, skills, and qualifications.

        User Profile:
        Skills: {user_profile.get('skills')}
        Experience: {user_profile.get('experience')}
        Education: {user_profile.get('education')}
        Degree: {user_profile.get('degree')}
        Preferred Location: {user_profile.get('preferred_location')}
        Preferred Job Type: {user_profile.get('preferred_job_type')}

        Job Details:
        Title: {job_details.get('title')}
        Company: {job_details.get('company')}
        Location: {job_details.get('location')}
        Skills Required: {job_details.get('skills')}
        Description: {job_details.get('description')}
        Experience Required: {job_details.get('experience')}

        Return ONLY a raw JSON object matching the format below. Do not wrap it in markdown code blocks or add any other text.
        Example JSON:
        {{
          "match_score": 87,
          "skills_breakdown": [
            {{"skill": "Python", "status": "strong match", "icon": "✓"}},
            {{"skill": "Django", "status": "strong match", "icon": "✓"}},
            {{"skill": "React", "status": "good match", "icon": "✓"}},
            {{"skill": "AWS", "status": "skill gap", "icon": "⚠"}}
          ],
          "why_explanation": [
            "Your React experience matches the role.",
            "Your Django experience is relevant.",
            "Your current skills align with the job requirements.",
            "AWS appears to be a skill you could improve."
          ]
        }}
        """
        
        # Call Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        data = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            
        content_text = res_body['candidates'][0]['content']['parts'][0]['text']
        parsed_result = json.loads(content_text.strip())
        return parsed_result
        
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}. Falling back to rules-based analysis.")
        return get_fallback_analysis(user_profile, job_details)

def get_fallback_analysis(user_profile, job_details):
    """
    A smart, rules-based fallback engine that calculates the match score,
    skill breakdown, and matches reasons using string matching.
    """
    user_skills = [s.strip().lower() for s in (user_profile.get('skills') or '').split(',') if s.strip()]
    user_ext_skills = [s.strip().lower() for s in (user_profile.get('extracted_skills') or '').split(',') if s.strip()]
    all_user_skills = set(user_skills + user_ext_skills)
    
    job_skills = [s.strip() for s in (job_details.get('skills') or '').split(',') if s.strip()]
    
    # Also look at user's experience/education for text matching
    user_text = f"{user_profile.get('skills') or ''} {user_profile.get('extracted_skills') or ''} {user_profile.get('experience') or ''} {user_profile.get('education') or ''}".lower()
    
    skills_breakdown = []
    matched_count = 0
    
    for skill in job_skills:
        skill_lower = skill.lower()
        if skill_lower in all_user_skills:
            skills_breakdown.append({"skill": skill, "status": "strong match", "icon": "✓"})
            matched_count += 1
        elif skill_lower in user_text:
            skills_breakdown.append({"skill": skill, "status": "good match", "icon": "✓"})
            matched_count += 1
        else:
            skills_breakdown.append({"skill": skill, "status": "skill gap", "icon": "⚠"})
            
    total_skills = len(job_skills)
    base_score = int((matched_count / total_skills) * 80) if total_skills > 0 else 75
    
    # Additional checks
    # Location
    location_match = False
    if user_profile.get('preferred_location') and job_details.get('location'):
        u_loc = user_profile.get('preferred_location').lower()
        j_loc = job_details.get('location').lower()
        if u_loc in j_loc or j_loc in u_loc:
            base_score += 10
            location_match = True
            
    # Job Type
    job_type_match = False
    if user_profile.get('preferred_job_type') and job_details.get('job_type'):
        if user_profile.get('preferred_job_type').upper() == job_details.get('job_type').upper():
            base_score += 10
            job_type_match = True
            
    match_score = min(99, max(20, base_score))
    
    # Generate custom explanations based on actual matched/missing items
    why_explanation = []
    
    # Check if we have strong match skills
    strong_matches = [item['skill'] for item in skills_breakdown if item['status'] == 'strong match']
    good_matches = [item['skill'] for item in skills_breakdown if item['status'] == 'good match']
    gaps = [item['skill'] for item in skills_breakdown if item['status'] == 'skill gap']
    
    if strong_matches:
        why_explanation.append(f"Your experience in {', '.join(strong_matches[:2])} directly matches the role requirements.")
    elif good_matches:
        why_explanation.append(f"Your background includes familiarity with {', '.join(good_matches[:2])}.")
        
    if location_match:
        why_explanation.append(f"The job location ({job_details.get('location')}) aligns with your preferred location ({user_profile.get('preferred_location')}).")
    else:
        why_explanation.append(f"This role offers an opportunity in {job_details.get('location')}.")
        
    if job_type_match:
        why_explanation.append(f"The job type aligns with your preferred work format.")
        
    if gaps:
        why_explanation.append(f"{', '.join(gaps[:2])} appears to be a skill area you can focus on improving.")
    else:
        why_explanation.append("Your skills highly align with the job description.")
        
    return {
        "match_score": match_score,
        "skills_breakdown": skills_breakdown,
        "why_explanation": why_explanation
    }

def get_resume_analysis(resume_text, user_profile):
    """
    Analyses the user's resume text and returns:
    - Score (0-100)
    - Strengths
    - Gaps
    - Suggested improvements
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return get_fallback_resume_analysis(resume_text, user_profile)
        
    try:
        prompt = f"""
        You are an advanced resume reviewer. Analyze the following Resume Text and User Profile, then return a JSON object with:
        1. "resume_score": an integer between 0 and 100.
        2. "strengths": a list of 2-4 strings indicating strengths.
        3. "gaps": a list of 2-4 strings indicating gaps.
        4. "improvements": a list of 3-5 suggested improvements.

        Resume Text:
        {resume_text}

        User Profile:
        Skills: {user_profile.get('skills')}
        Experience: {user_profile.get('experience')}
        Education: {user_profile.get('education')}

        Return ONLY a raw JSON object matching the format below.
        Example JSON:
        {{
          "resume_score": 74,
          "strengths": [
            "Strong technical skills",
            "Good project experience"
          ],
          "gaps": [
            "Weak professional summary",
            "Missing key metrics"
          ],
          "improvements": [
            "Strengthen the professional summary",
            "Add measurable achievements",
            "Add relevant keywords",
            "Highlight relevant projects"
          ]
        }}
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            
        content_text = res_body['candidates'][0]['content']['parts'][0]['text']
        parsed_result = json.loads(content_text.strip())
        return parsed_result
        
    except Exception as e:
        logger.error(f"Gemini resume analysis failed: {e}. Falling back to rules-based resume analysis.")
        return get_fallback_resume_analysis(resume_text, user_profile)

def get_fallback_resume_analysis(resume_text, user_profile):
    """
    Fallback rules-based resume analyzer.
    """
    score = 65
    strengths = []
    gaps = []
    improvements = []
    
    if len(resume_text or '') > 500:
        score += 15
        strengths.append("Detailed content structure with good depth.")
    else:
        score += 5
        gaps.append("Brief resume content.")
        improvements.append("Expand on your job descriptions and add more bullet points.")
        
    skills = [s.strip() for s in (user_profile.get('skills') or '').split(',') if s.strip()]
    if len(skills) >= 5:
        score += 15
        strengths.append("Comprehensive skills list.")
    else:
        score += 5
        gaps.append("Limited list of skills.")
        improvements.append("Add more technical and soft skills to improve keyword matching.")
        
    if user_profile.get('experience'):
        score += 10
        strengths.append("Experience section populated.")
    else:
        gaps.append("Missing or incomplete experience details.")
        improvements.append("Add bullet points detailing specific responsibilities and achievements in your experience section.")
        
    if user_profile.get('education'):
        score += 10
        strengths.append("Education details clearly specified.")
    else:
        improvements.append("Ensure your degree, college name, and graduation year are correctly filled out.")
        
    # Standard improvements
    improvements.append("Add measurable achievements (e.g. 'Improved efficiency by 20%').")
    improvements.append("Strengthen your professional summary with a strong hook.")
    
    if not strengths:
        strengths.append("Baseline profile set up successfully.")
        
    return {
        "resume_score": min(98, score),
        "strengths": strengths[:3],
        "gaps": gaps[:3],
        "improvements": improvements[:4]
    }

def get_career_assistant_response(prompt, user_profile):
    """
    Generates a career assistant response using Gemini API or a smart rules-based chatbot.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return get_fallback_career_assistant_response(prompt, user_profile)
        
    try:
        # Construct system context
        system_instruction = f"""
        You are the SwipeX AI Career Assistant. Help the user with career advice, job recommendations, skills, and resume improvement.
        Keep your tone supportive, professional, and concise. Refer directly to the user's profile where relevant.

        User Profile:
        Skills: {user_profile.get('skills')}
        Experience: {user_profile.get('experience')}
        Education: {user_profile.get('education')}
        Degree: {user_profile.get('degree')}
        Preferred Location: {user_profile.get('preferred_location')}
        Preferred Job Type: {user_profile.get('preferred_job_type')}
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        contents = [
            {
                "role": "user",
                "parts": [{"text": f"System context:\n{system_instruction}\n\nUser Question:\n{prompt}"}]
            }
        ]
        
        data = {
            "contents": contents
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            
        content_text = res_body['candidates'][0]['content']['parts'][0]['text']
        return {"response": content_text}
        
    except Exception as e:
        logger.error(f"Gemini assistant failed: {e}. Falling back to rules-based chatbot.")
        return get_fallback_career_assistant_response(prompt, user_profile)

def get_fallback_career_assistant_response(prompt, user_profile):
    """
    A smart rules-based fallback response generator for common questions.
    """
    prompt_lower = prompt.lower()
    skills = user_profile.get('skills') or 'none'
    
    if "resume" in prompt_lower or "cv" in prompt_lower:
        response = "To improve your resume, make sure you use the **STAR method** (Situation, Task, Action, Result) for describing your project bullet points. For example, instead of 'Wrote Django code', use 'Developed secure Django APIs that reduced latency by 15%'. Ensure you match the keywords from target job descriptions."
    elif "shortlist" in prompt_lower or "interview" in prompt_lower:
        response = "To increase your shortlisting rate, focus on: 1) Tailoring your skills to match the exact keywords in job postings, 2) Ensuring your ATS score is above 80% on our Resume Analysis page, and 3) Applying early to new jobs where competition is still low (under 5 applicants)."
    elif "backend" in prompt_lower:
        response = "For backend developer roles, core industry requirements include: strong proficiency in **Python (Django/FastAPI)** or **Node.js/Go**, relational databases (**PostgreSQL**), caching (**Redis**), API design (**REST/GraphQL**), and cloud basics (**AWS/Docker**)."
    elif "skill" in prompt_lower or "learn" in prompt_lower:
        response = f"Based on your profile, you have skills like **{skills}**. To stand out in today's job market, we recommend focusing on high-demand cloud and backend tools such as **AWS**, **Docker**, and modern container orchestration. Additionally, practicing **System Design** concepts will help you clear technical rounds."
    elif "job" in prompt_lower or "apply" in prompt_lower:
        pref_job = user_profile.get('preferred_job_type') or 'Software Development'
        pref_loc = user_profile.get('preferred_location') or 'remote'
        response = f"Since your preferred job type is **{pref_job}** and your preferred location is **{pref_loc}**, you should browse matching roles in our Discover tab! We have calculated compatibility scores on your recommended jobs list to help you target roles where you have a strong match."
    else:
        response = "I am the SwipeX AI Career Assistant. I can help you with resume tips, skill recommendations, and matching insights! Try asking me: 'How can I improve my resume?', 'What skills should I learn?', or 'What jobs should I apply for?'."
        
    return {"response": response}

def generate_job_description(role, skills, experience):
    """
    Generates a structured job description using Gemini API or a rules-based generator.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return get_fallback_job_description(role, skills, experience)
        
    try:
        prompt = f"""
        Generate a professional, structured job description for the following details:
        Role: {role}
        Skills: {skills}
        Experience: {experience}

        Format the output clearly using markdown under these sections:
        - Job Overview
        - Key Responsibilities
        - Required Skills & Qualifications
        - Preferred Skills
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            
        content_text = res_body['candidates'][0]['content']['parts'][0]['text']
        return {"description": content_text}
        
    except Exception as e:
        logger.error(f"Gemini job description generation failed: {e}. Falling back to rules-based description.")
        return get_fallback_job_description(role, skills, experience)

def get_fallback_job_description(role, skills, experience):
    """
    Rules-based fallback generator.
    """
    description = f"""### Job Overview
We are looking for a skilled **{role}** to join our growing team. You will be responsible for designing, developing, and maintaining high-quality systems aligned with our business goals.

### Key Responsibilities
- Collaborate with cross-functional teams to define, design, and ship new features.
- Build clean, scalable, and maintainable code.
- Optimize systems for maximum speed and scalability.
- Debug issues and fix bugs reported by clients or monitoring systems.

### Required Skills & Qualifications
- Experience level: **{experience}**.
- Hands-on experience with: **{skills}**.
- Strong problem-solving skills and attention to detail.
- Excellent communication and teamwork skills.

### Preferred Skills
- Experience with cloud infrastructure (AWS/GCP/Azure).
- Understanding of containerization tools (Docker/Kubernetes).
"""
    return {"description": description.strip()}
