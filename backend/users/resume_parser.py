import os
import re
from PyPDF2 import PdfReader
from docx import Document

# A predefined list of common skills for simple keyword matching
COMMON_SKILLS = [
    'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'go', 'rust', 'kotlin', 'typescript',
    'react', 'angular', 'vue', 'django', 'spring', 'spring boot', 'flask', 'express', 'node.js', 'laravel', 'ruby on rails',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle', 'elasticsearch',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd',
    'machine learning', 'data science', 'ai', 'deep learning', 'nlp', 'computer vision', 'data analysis', 'pandas', 'numpy',
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
    'agile', 'scrum', 'jira', 'confluence', 'project management', 'communication', 'teamwork', 'leadership'
]

def extract_text_from_file(file_path):
    text = ""
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
        elif ext in ['.docx', '.doc']:
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + " "
        else:
            # If it's a txt or unknown, try simple read
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
    except Exception as e:
        print(f"Error parsing resume: {e}")
    return text

def parse_resume(file_path):
    text = extract_text_from_file(file_path)
    if not text:
        return {
            'skills': [],
            'summary': 'Could not extract text from the resume.'
        }

    text_lower = text.lower()
    found_skills = set()
    
    # Very basic keyword matching
    for skill in COMMON_SKILLS:
        # Use regex to match word boundaries to avoid partial matches (e.g., 'go' in 'good')
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    skills_list = list(found_skills)
    
    # Generate a simple summary based on findings
    if len(skills_list) > 10:
        summary = f"Highly technical resume with extensive skills ({len(skills_list)} detected). Looks like a strong candidate."
    elif len(skills_list) > 5:
        summary = f"Solid resume demonstrating proficiency in {', '.join(skills_list[:3])} and others."
    elif len(skills_list) > 0:
        summary = f"Found a few key skills: {', '.join(skills_list)}."
    else:
        summary = "No standard technical skills detected. This might be a non-technical resume or in a different format."

    return {
        'skills': [s.title() for s in skills_list],  # Capitalize for display
        'summary': summary
    }
