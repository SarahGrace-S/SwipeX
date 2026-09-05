import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api from '../../api';

export default function PostJob() {
  const { jobId } = useParams();
  const isEdit = !!jobId;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    experience: '',
    job_type: 'FULL_TIME',
    company_type: 'MNC',
    skills: '',
    description: '',
  });

  useEffect(() => {
    if (isEdit) {
      const fetchJobDetails = async () => {
        try {
          const res = await api.get(`/api/jobs/${jobId}/`);
          setFormData({
            title: res.data.title,
            company: res.data.company,
            location: res.data.location,
            salary: res.data.salary,
            experience: res.data.experience,
            job_type: res.data.job_type,
            company_type: res.data.company_type,
            skills: res.data.skills,
            description: res.data.description,
          });
        } catch (err) {
          setError('Failed to fetch job details for editing.');
        }
      };
      fetchJobDetails();
    }
  }, [jobId, isEdit]);

  const [aiDescription, setAiDescription] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);

  const handleGenerateAIDescription = async () => {
    if (!formData.title) {
      alert("Please enter a Job Title first to help the AI generate the description.");
      return;
    }
    setGeneratingDesc(true);
    setShowAIPreview(true);
    try {
      const res = await api.post('/api/generate-job-description/', {
        role: formData.title,
        skills: formData.skills,
        experience: formData.experience
      });
      setAiDescription(res.data.description);
    } catch (err) {
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleAcceptDescription = () => {
    setFormData({ ...formData, description: aiDescription });
    setShowAIPreview(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isEdit) {
        await api.put(`/api/jobs/${jobId}/`, formData);
      } else {
        await api.post('/api/jobs/', formData);
      }
      navigate('/recruiter/jobs');
    } catch (err) {
      setError(`Failed to ${isEdit ? 'update' : 'post'} job. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white py-12 px-4">
      <div className="max-w-3xl mx-auto glass-card p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {isEdit ? 'Edit Job Listing' : 'Post a New Job'}
            </h1>
            <Link to="/recruiter" className="text-indigo-300 hover:text-white transition-colors text-sm font-semibold">
              ← Dashboard
            </Link>
          </div>

          {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job Title *</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name *</label>
                <input required type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location *</label>
                <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Salary</label>
                <input type="text" name="salary" placeholder="e.g. $80,000 - $100,000" value={formData.salary} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience Required</label>
                <input type="text" name="experience" placeholder="e.g. 2+ Years" value={formData.experience} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job Type</label>
                <select name="job_type" value={formData.job_type} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="REMOTE">Remote</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Type</label>
                <select name="company_type" value={formData.company_type} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900">
                  <option value="MNC">MNC</option>
                  <option value="STARTUP">Startup</option>
                  <option value="NEW_STARTUP">New Startup</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Required Skills</label>
                <input type="text" name="skills" placeholder="Comma separated" value={formData.skills} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Job Description *</label>
                <button
                  type="button"
                  onClick={handleGenerateAIDescription}
                  className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  ✨ AI Description Draft
                </button>
              </div>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="5" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" required></textarea>
            </div>

            {showAIPreview && (
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 mb-5 space-y-4 text-left animate-fadeIn">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <span>✨</span> Generated Job Description Draft
                  </h4>
                  <span className="text-[10px] text-gray-500">Recruiter AI Assistant</span>
                </div>
                {generatingDesc ? (
                  <div className="text-xs text-indigo-300 animate-pulse py-4">Drafting description...</div>
                ) : (
                  <>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows="8"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateAIDescription}
                        className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAIPreview(false)}
                        className="px-4 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptDescription}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Accept & Insert
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-4">
              <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50">
                {loading ? (isEdit ? 'Updating...' : 'Posting...') : (isEdit ? 'Update Job' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
