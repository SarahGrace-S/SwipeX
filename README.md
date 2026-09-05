# SwipeX — Smart Job Discovery & Recruitment Platform

SwipeX is a full-stack recruitment platform designed to connect job seekers and recruiters through a single, role-based web application.

Job seekers can discover and apply for relevant opportunities, while recruiters can publish jobs, manage their postings, review applicants, and monitor recruitment activity.

The project demonstrates a complete full-stack workflow involving a React frontend, Django REST backend, PostgreSQL database, authentication, REST APIs, role-based access, and cloud deployment.

---

## 🌐 Live Demo

**Live Application:**  
https://swipe-x-sage.vercel.app/

**Backend:**  
https://swipe-x-w580.onrender.com/

**Source Code:**  
https://github.com/SarahGrace-S/SwipeX

---
#### 👨‍💻 Job Seeker

**Username / Email:** jobseeker123@gmail.com 
**Password:** seeker@123

#### 🏢 Recruiter

**Username / Email:** recruiter123@gmail.com 
**Password:** recruiter@123

> These credentials are provided for demonstration purposes so reviewers can explore both Job Seeker and Recruiter workflows.

## 🎯 Problem Statement

Traditional job portals often provide large numbers of job listings without providing a focused experience for both candidates and recruiters.

SwipeX aims to simplify this process by providing:

- A dedicated experience for job seekers
- A dedicated recruiter dashboard
- Centralized job posting and management
- Job discovery and application tracking
- Resume/profile-based job matching
- Applicant management for recruiters

---

## ✨ Key Features

### 👨‍💻 Job Seeker

- User registration and authentication
- Profile management
- Resume management
- Browse available jobs
- Search and filter jobs
- View detailed job information
- Apply for jobs
- Track submitted applications
- View relevant job opportunities

### 🏢 Recruiter

- Recruiter registration and authentication
- Recruiter dashboard
- Create and publish job postings
- Manage posted jobs
- View applicants
- Manage company profile
- Recruitment analytics
- Notifications

### 🔐 Role-Based Access

SwipeX supports two primary user roles:

```text
                    SwipeX
                      |
             ┌────────┴────────┐
             |                 |
        Job Seeker          Recruiter
             |                 |
        Browse Jobs        Post Jobs
        Apply Jobs         Manage Jobs
        Resume             Applicants
        Applications       Analytics
