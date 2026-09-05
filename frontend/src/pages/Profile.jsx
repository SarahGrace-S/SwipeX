import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

export default function Profile() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    skills: '',
    education: '',
    degree: '',
    college: '',
    graduation_year: '',
    cgpa: '',
    experience: '',
    previous_company: '',
    years_of_experience: '',
    linkedin: '',
    github: '',
    portfolio: '',
    projects: '',
    certificates: '',
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      setProfile(res.data);
    } catch (err) {
      toast.error('Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.keys(profile).forEach(key => {
      if (profile[key] !== null) {
        data.append(key, profile[key]);
      }
    });
    if (resume) {
      data.append('resume', resume);
    }

    try {
      const res = await api.patch('/api/profile/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Loading...
      </div>
    );
  }

  
  const profileFields = [
    'full_name', 'phone', 'skills', 'degree', 'college', 'graduation_year', 'cgpa',
    'previous_company', 'years_of_experience', 'linkedin', 'github', 'portfolio', 'projects', 'certificates'
  ];
  let filledFields = 0;
  profileFields.forEach(field => {
    if (profile[field]) filledFields++;
  });
  if (profile.resume) filledFields++;
  const completionPercentage = Math.round((filledFields / (profileFields.length + 1)) * 100);

  return (
    <div className="flex flex-col h-full w-full">

      <main className="max-w-2xl mx-auto w-full px-6 py-12 flex-grow">
        <div className="glass-card p-8 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-white">My Profile</h1>
            <p className="text-gray-400 text-sm mb-8">Update your personal information and resume.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                  <input disabled type="email" name="email" value={profile.email || ''} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" title="Email cannot be changed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 cursor-pointer" />
                  {profile.resume && (
                    <p className="mt-2 text-xs text-purple-300 flex items-center space-x-4">
                      <span>Current: <a href={profile.resume} target="_blank" rel="noreferrer" className="underline hover:text-purple-400">View Resume</a></span>
                      <Link to="/resume-analysis" className="underline text-emerald-400 hover:text-emerald-300">View ATS Analysis ✨</Link>
                    </p>
                  )}
                </div>
              </div>

              
              <div className="mb-6 bg-black/20 rounded-full h-2 w-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-emerald-400 font-bold mb-8 text-right">Profile Completion: {completionPercentage}%</p>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</label>
                <input type="text" name="skills" value={profile.skills || ''} onChange={handleChange} placeholder="e.g. React, Python, Management (Comma separated)" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Degree</label>
                    <input type="text" name="degree" value={profile.degree || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">College/University</label>
                    <input type="text" name="college" value={profile.college || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Graduation Year</label>
                    <input type="text" name="graduation_year" value={profile.graduation_year || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CGPA</label>
                    <input type="text" name="cgpa" value={profile.cgpa || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Company</label>
                    <input type="text" name="previous_company" value={profile.previous_company || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Years of Experience</label>
                    <input type="text" name="years_of_experience" value={profile.years_of_experience || ''} onChange={handleChange} placeholder="e.g. 2.5 Years" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detailed Experience</label>
                  <textarea name="experience" value={profile.experience || ''} onChange={handleChange} rows="3" placeholder="Describe your roles and achievements..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"></textarea>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Projects & Certifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Projects</label>
                    <textarea name="projects" value={profile.projects || ''} onChange={handleChange} rows="3" placeholder="Describe key projects..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Certifications</label>
                    <textarea name="certificates" value={profile.certificates || ''} onChange={handleChange} rows="3" placeholder="Describe key certifications..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn</label>
                    <input type="url" name="linkedin" value={profile.linkedin || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">GitHub</label>
                    <input type="url" name="github" value={profile.github || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portfolio Website</label>
                    <input type="url" name="portfolio" value={profile.portfolio || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button disabled={submitting} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
