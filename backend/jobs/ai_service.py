import os
import urllib.request
import json
import logging
import re

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

def calculate_recommendation_match(user_profile, job_details, user_history=None):
    """
    Multidimensional candidate-to-job recommendation & matching engine:
    - Skills / ATS match: 40% weight
    - Role/title relevance: 25% weight
    - Experience compatibility: 15% weight
    - Location preference: 10% weight
    - Job type/work-format preference: 10% weight

    Guarantees:
    - Skills & ATS relevance has the highest priority.
    - Location or work preferences cannot override a severe skill mismatch.
    - Jobs with 0% skill match cannot receive an artificially inflated score.
    - All reasons and explanations are derived strictly from actual profile and job data.
    """
    user_skills_raw = (user_profile.get('skills') or '')
    user_ext_raw = (user_profile.get('extracted_skills') or '')
    user_skills_list = [s.strip().lower() for s in user_skills_raw.split(',') if s.strip()]
    user_ext_list = [s.strip().lower() for s in user_ext_raw.split(',') if s.strip()]
    all_user_skills = set(user_skills_list + user_ext_list)
    has_skills = bool(all_user_skills)

    user_exp_raw = (user_profile.get('experience') or '')
    user_edu_raw = f"{user_profile.get('education') or ''} {user_profile.get('degree') or ''}"
    user_projects = (user_profile.get('projects') or '')
    user_text = f"{user_skills_raw} {user_ext_raw} {user_exp_raw} {user_edu_raw} {user_projects}".lower()

    # Check if profile is incomplete
    is_profile_empty = not has_skills and not user_exp_raw.strip() and not user_profile.get('resume') and not user_edu_raw.strip()

    # 1. Skills / ATS Match (40% weight)
    raw_job_skills = [s.strip() for s in (job_details.get('skills') or '').split(',') if s.strip()]
    skills_breakdown = []
    matching_skills = []
    missing_skills = []

    for s in raw_job_skills:
        s_clean = s.strip()
        s_lower = s_clean.lower()
        if not s_clean:
            continue
        if s_lower in all_user_skills:
            skills_breakdown.append({"skill": s_clean, "status": "strong match", "icon": "✓"})
            matching_skills.append(s_clean)
        elif s_lower in user_text:
            skills_breakdown.append({"skill": s_clean, "status": "good match", "icon": "✓"})
            matching_skills.append(s_clean)
        else:
            skills_breakdown.append({"skill": s_clean, "status": "skill gap", "icon": "⚠"})
            missing_skills.append(s_clean)

    total_skills = len(raw_job_skills)
    if is_profile_empty:
        ats_score = 0
        skills_weight_score = 0.0
    elif total_skills == 0:
        ats_score = 65 if has_skills else 40
        skills_weight_score = (ats_score / 100.0) * 40.0
    else:
        ats_score = int(round((len(matching_skills) / total_skills) * 100))
        skills_weight_score = (ats_score / 100.0) * 40.0

    # 2. Role / Title Relevance (25% weight)
    stopwords = {'and', 'or', 'the', 'for', 'at', 'in', 'of', 'to', 'a', 'an', 'senior', 'junior', 'lead', 'intern', 'fresher', 'associate', 'staff', 'principal', 'company', 'test'}
    title_words = [w.lower() for w in re.findall(r'[A-Za-z0-9+#]+', job_details.get('title') or '') if len(w) > 1 and w.lower() not in stopwords]

    role_pct = 0.0
    if is_profile_empty:
        role_pct = 0.0
    else:
        for tw in title_words:
            if tw in all_user_skills or tw in user_text:
                role_pct += 40.0
            elif tw in ['software', 'engineer', 'developer', 'programmer', 'fullstack', 'full', 'stack'] and any(k in all_user_skills for k in ['python', 'java', 'react', 'c++', 'javascript', 'django', 'spring', 'node', 'sql', 'git']):
                role_pct += 35.0
            elif tw in ['backend'] and any(k in all_user_skills for k in ['python', 'java', 'sql', 'django', 'spring', 'postgres', 'mysql', 'node', 'go']):
                role_pct += 40.0
            elif tw in ['frontend'] and any(k in all_user_skills for k in ['react', 'javascript', 'typescript', 'html', 'css', 'vue', 'angular']):
                role_pct += 40.0
            elif tw in ['data', 'analyst', 'scientist'] and any(k in all_user_skills for k in ['python', 'sql', 'pandas', 'excel', 'ml', 'machine learning']):
                role_pct += 40.0
            elif tw in ['cloud', 'devops'] and any(k in all_user_skills for k in ['aws', 'docker', 'kubernetes', 'linux', 'cloud', 'ci/cd']):
                role_pct += 40.0
            elif tw in ['ui', 'ux', 'designer'] and any(k in all_user_skills for k in ['figma', 'adobe', 'ui', 'ux', 'design', 'prototyping']):
                role_pct += 40.0

        if user_history:
            for ht in user_history.get('job_titles', []):
                if any(w in ht.lower() for w in title_words):
                    role_pct += 20.0

        role_pct = min(100.0, role_pct)
    role_weight_score = (role_pct / 100.0) * 25.0

    # 3. Experience Match (15% weight)
    cand_exp_text = f"{user_profile.get('years_of_experience') or ''} {user_exp_raw}"
    cand_years_match = re.search(r'(\d+)', cand_exp_text)
    cand_years = float(cand_years_match.group(1)) if cand_years_match else 0.0

    job_exp_str = (job_details.get('experience') or '').lower()
    exp_range = re.findall(r'(\d+)', job_exp_str)
    if not exp_range or 'any' in job_exp_str or job_exp_str.strip() in ['0', '0 years', '']:
        exp_pct = 100.0
    elif len(exp_range) >= 2:
        min_exp, max_exp = float(exp_range[0]), float(exp_range[1])
        if min_exp <= cand_years <= (max_exp + 1.5):
            exp_pct = 100.0
        elif cand_years >= (min_exp - 1.0):
            exp_pct = 75.0
        elif cand_years >= (min_exp - 2.0):
            exp_pct = 40.0
        else:
            exp_pct = 0.0
    else:
        req_exp = float(exp_range[0])
        if abs(cand_years - req_exp) <= 1.0:
            exp_pct = 100.0
        elif cand_years >= (req_exp - 2.0):
            exp_pct = 60.0
        else:
            exp_pct = 10.0

    if is_profile_empty:
        exp_pct = 0.0
    exp_weight_score = (exp_pct / 100.0) * 15.0

    # 4. Location Preference (10% weight)
    user_loc = (user_profile.get('preferred_location') or '').strip().lower()
    job_loc = (job_details.get('location') or '').strip().lower()
    if not user_loc:
        loc_pct = 60.0
    elif user_loc in job_loc or job_loc in user_loc:
        loc_pct = 100.0
    elif 'remote' in job_loc:
        loc_pct = 90.0
    else:
        loc_pct = 10.0
    loc_weight_score = (loc_pct / 100.0) * 10.0

    # 5. Job Type Preference (10% weight)
    user_type = (user_profile.get('preferred_job_type') or '').strip().upper()
    job_type = (job_details.get('job_type') or '').strip().upper()
    if not user_type:
        type_pct = 60.0
    elif user_type == job_type:
        type_pct = 100.0
    else:
        type_pct = 20.0
    type_weight_score = (type_pct / 100.0) * 10.0

    # Total Score Calculation
    total_raw = skills_weight_score + role_weight_score + exp_weight_score + loc_weight_score + type_weight_score

    # SEVERE SKILL MISMATCH GATING:
    # If candidate has technical skills, but 0% match this job's requirements:
    if has_skills and total_skills > 0 and ats_score == 0:
        total_raw = min(total_raw, 25.0)
    elif has_skills and total_skills > 0 and ats_score < 30:
        total_raw = min(total_raw, 45.0)
    elif is_profile_empty:
        total_raw = 0.0

    rec_score = int(round(total_raw))
    rec_score = max(0, min(99, rec_score))

    # Accurate, explainable reasons
    why_explanation = []
    if is_profile_empty:
        reason = "Complete your profile or upload your resume to receive personalized recommendations."
        why_explanation.append("Add your skills and experience to unlock personalized AI job recommendations.")
    elif total_skills > 0 and ats_score == 0:
        missing_preview = ', '.join(missing_skills[:3])
        reason = f"Lower suitability: You are missing core required skills ({missing_preview}) for this role."
        why_explanation.append(f"Skill gap: {missing_preview} are required for this position.")
        if loc_pct >= 90 and user_profile.get('preferred_location'):
            why_explanation.append(f"Location aligns with your preference ({user_profile.get('preferred_location')}), but key skills are missing.")
    elif ats_score >= 80:
        match_preview = ', '.join(matching_skills[:3])
        reason = f"Recommended because your {match_preview} skills closely match the required qualifications."
        if loc_pct >= 90 and user_profile.get('preferred_location'):
            reason += f" Position matches your preferred location ({user_profile.get('preferred_location')})."
        why_explanation.append(f"Your experience with {match_preview} directly matches role requirements.")
        if loc_pct >= 90 and user_profile.get('preferred_location'):
            why_explanation.append(f"Location matches your preferred city ({user_profile.get('preferred_location')}).")
        if exp_pct >= 90:
            why_explanation.append(f"Your experience level aligns with the {job_details.get('experience') or 'required'} experience.")
        if missing_skills:
            why_explanation.append(f"Note: {', '.join(missing_skills[:2])} is a skill you could highlight or brush up on.")
    elif matching_skills and missing_skills:
        match_preview = ', '.join(matching_skills[:2])
        missing_preview = ', '.join(missing_skills[:2])
        reason = f"Recommended because your {match_preview} skills match {len(matching_skills)} of {total_skills} requirements. Missing: {missing_preview}."
        why_explanation.append(f"Your {match_preview} background aligns with core role requirements.")
        why_explanation.append(f"Skill gap: {missing_preview} is required for this role.")
        if loc_pct >= 90 and user_profile.get('preferred_location'):
            why_explanation.append(f"Job location aligns with your preference ({user_profile.get('preferred_location')}).")
    elif matching_skills:
        match_preview = ', '.join(matching_skills[:3])
        reason = f"Recommended because your {match_preview} skills align with this role."
        why_explanation.append(f"Role requirements match your {match_preview} skills.")
    elif role_pct >= 60:
        missing_preview = ', '.join(missing_skills[:2]) if missing_skills else 'see description'
        reason = f"Role matches your engineering background, but requires learning: {missing_preview}."
        why_explanation.append("Title alignment with your career focus.")
        if missing_skills:
            why_explanation.append(f"Requires building skills in {missing_preview}.")
    else:
        missing_preview = ', '.join(missing_skills[:2]) if missing_skills else 'see description'
        reason = f"Partial match based on role and format; required skills ({missing_preview}) differ from your profile."
        why_explanation.append("Job matches general work format preference.")

    return {
        "match_score": rec_score,
        "ats_score": ats_score,
        "recommendation_score": rec_score,
        "compatibility_score": rec_score,
        "skills_breakdown": skills_breakdown,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "why_explanation": why_explanation,
        "recommendation_reason": reason,
        "profile_incomplete": is_profile_empty,
    }

def get_fallback_analysis(user_profile, job_details):
    """
    A smart, rules-based engine that calculates the match score,
    skill breakdown, and matches reasons using multi-factor profile analysis.
    """
    analysis = calculate_recommendation_match(user_profile, job_details)
    return {
        "match_score": analysis["match_score"],
        "ats_score": analysis["ats_score"],
        "skills_breakdown": analysis["skills_breakdown"],
        "why_explanation": analysis["why_explanation"],
        "recommendation_reason": analysis["recommendation_reason"],
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
