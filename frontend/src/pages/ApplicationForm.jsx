import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [atsData, setAtsData] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    qualification: '',
    experience: '',
    linkedin: '',
    portfolio: '',
    cover_letter: '',
  });
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jobRes = await api.get(`/api/jobs/${jobId}/`);
        setJob(jobRes.data);

        const profileRes = await api.get('/api/profile/');
        setProfile(profileRes.data);
        setFormData({
          full_name: profileRes.data.full_name || '',
          email: profileRes.data.email || '',
          phone: profileRes.data.phone || '',
          address: profileRes.data.preferred_location || '',
          qualification: profileRes.data.degree || profileRes.data.education || '',
          experience: profileRes.data.experience || '',
          linkedin: profileRes.data.linkedin || '',
          portfolio: profileRes.data.portfolio || '',
          cover_letter: '',
        });
      } catch (err) {
        setError('Failed to load application details.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [jobId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const data = new FormData();
    data.append('job', jobId);
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (resume) {
      data.append('resume', resume);
    }

    try {
      if (step === 1) {
        // Step 1: Analyze ATS
        const res = await api.post('/api/applications/analyze/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAtsData(res.data);
        setStep(2);
      } else {
        // Step 2: Final Submit
        await api.post('/api/applications/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate('/applied-jobs');
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'An error occurred. Please try again.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          const firstVal = err.response.data[firstKey];
          if (Array.isArray(firstVal)) {
            errMsg = `${firstKey === 'non_field_errors' ? '' : firstKey + ': '}${firstVal[0]}`;
          } else if (typeof firstVal === 'string') {
            errMsg = `${firstKey === 'non_field_errors' ? '' : firstKey + ': '}${firstVal}`;
          } else {
            errMsg = err.response.data.detail || err.response.data.error || JSON.stringify(err.response.data);
          }
        }
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto glass-card p-8 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Apply for {job?.title}
            </h1>
            <Link to="/discover" className="text-purple-300 hover:text-white transition-colors text-sm font-semibold">
              ← Back
            </Link>
          </div>
          
          <p className="text-gray-300 mb-8 text-sm">
            Company: <span className="font-semibold text-white">{job?.company}</span><br/>
            Location: <span className="font-semibold text-white">{job?.location}</span>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Details Summary */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider border-b border-white/10 pb-1.5">👤 Preloaded Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div><span className="text-gray-400 block">Full Name</span><span className="font-semibold text-white">{profile?.full_name}</span></div>
                  <div><span className="text-gray-400 block">Email Address</span><span className="font-semibold text-white">{profile?.email}</span></div>
                  <div><span className="text-gray-400 block">Phone Number</span><span className="font-semibold text-white">{profile?.phone || 'Not specified'}</span></div>
                  <div><span className="text-gray-400 block">Highest Qualification</span><span className="font-semibold text-white">{profile?.degree || profile?.education || 'Not specified'}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-400 block">Key Skills</span><span className="font-semibold text-white">{profile?.skills || 'Not specified'}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-400 block">Work Experience</span><p className="font-semibold text-white whitespace-pre-line">{profile?.experience || 'Not specified'}</p></div>
                  {profile?.linkedin && <div><span className="text-gray-400 block">LinkedIn</span><a href={profile?.linkedin} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline font-semibold">{profile?.linkedin}</a></div>}
                  {profile?.portfolio && <div><span className="text-gray-400 block">Portfolio</span><a href={profile?.portfolio} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline font-semibold">{profile?.portfolio}</a></div>}
                </div>
              </div>

              {/* Resume Handling */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider border-b border-white/10 pb-1.5">📄 Resume Attachment</h3>
                {profile?.resume ? (
                  <div className="text-xs text-gray-300 space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-400 text-lg">✓</span> 
                      <span>Current Profile Resume: <a href={profile.resume} target="_blank" rel="noreferrer" className="text-purple-400 underline font-semibold hover:text-purple-300">View/Download Resume</a></span>
                    </p>
                    <p className="text-[10px] text-gray-400 italic">This resume will be automatically attached to your application.</p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400">⚠️ No profile resume found. Please upload one below to apply.</p>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {profile?.resume ? 'Replace Resume' : 'Upload Resume *'}
                  </label>
                  <input 
                    required={!profile?.resume} 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer" 
                  />
                  {profile?.resume && (
                    <p className="text-[10px] text-gray-500 mt-1">If you upload a new file, it will be used only for this application. Your profile resume will remain unchanged.</p>
                  )}
                </div>
              </div>

              {/* Optional Cover Letter */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cover Letter (Optional)</label>
                <textarea name="cover_letter" value={formData.cover_letter} onChange={handleChange} rows="4" placeholder="Add any details or introduction for the recruiter..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"></textarea>
              </div>

              <div className="pt-4">
                <button disabled={submitting} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50">
                  {submitting ? 'Analyzing...' : 'Analyze & Review Application'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-black/30 border border-indigo-500/30 rounded-2xl p-6 space-y-6">
                <h3 className="text-xl font-bold text-indigo-300 mb-2 border-b border-white/10 pb-2">ATS Analysis & Suitability Report</h3>
                
                {/* 2. ATS Score & Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">ATS Score</span>
                    <span className={`text-3xl font-black ${atsData?.ats_score >= 80 ? 'text-emerald-400' : atsData?.ats_score >= 60 ? 'text-blue-400' : atsData?.ats_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {atsData?.ats_score}%
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                      Status: {atsData?.ats_score_rating}
                    </span>
                  </div>
                  {/* 5. Compatibility Score */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Compatibility</span>
                    <span className="text-3xl font-black text-indigo-400">
                      {atsData?.compatibility_score}%
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                      Match Rating
                    </span>
                  </div>
                </div>

                {/* 1. Resume Analysis */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">📄 Resume Analysis Snapshot</h4>
                  <div className="text-xs space-y-2 text-gray-300">
                    <p><span className="font-semibold text-white">Summary:</span> {atsData?.resume_analysis?.resume_summary}</p>
                    <p><span className="font-semibold text-white">Education:</span> {atsData?.resume_analysis?.education}</p>
                    <p><span className="font-semibold text-white">Experience:</span> {atsData?.resume_analysis?.experience}</p>
                    <div>
                      <span className="font-semibold text-white block mb-1">Skills Extracted:</span>
                      <div className="flex flex-wrap gap-1">
                        {atsData?.resume_analysis?.extracted_skills?.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[10px] border border-indigo-500/20">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold text-white block mb-1">Technologies Found:</span>
                      <div className="flex flex-wrap gap-1">
                        {atsData?.resume_analysis?.technologies_found?.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] border border-purple-500/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Keyword Match */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {atsData?.matched_keywords?.length > 0 ? atsData.matched_keywords.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[10px]">{k}</span>
                      )) : <span className="text-xs text-gray-500">None matching</span>}
                    </div>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {atsData?.missing_keywords?.length > 0 ? atsData.missing_keywords.map((k, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[10px]">{k}</span>
                      )) : <span className="text-xs text-gray-500">None missing!</span>}
                    </div>
                  </div>
                </div>

                {/* 4. Missing Skills & Learn Recommendation */}
                {atsData?.missing_skills?.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Missing Required Skills</h4>
                    <p className="text-xs text-gray-300 mb-2">The selected job requires the following skills that were not found in your profile or resume. We highly recommend acquiring or showcasing these skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {atsData.missing_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10. Recommendation Reason & Swipe Recommendation */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase">💡 Match Rationale</h4>
                  <p className="text-xs text-gray-300"><span className="font-semibold text-white">Why Recommended:</span> {atsData?.recommendation_reason}</p>
                  <p className="text-xs text-gray-300"><span className="font-semibold text-white">Swipe Behavior Alignment:</span> {atsData?.swipe_recommendation}</p>
                </div>

                {/* 7. Smart Suggestions */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase">🎯 Smart Career Suggestions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-white block border-b border-white/5 pb-1">Recommended Courses</span>
                      <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                        {atsData?.suggested_courses?.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-white block border-b border-white/5 pb-1">Suggested Certs</span>
                      <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                        {atsData?.suggested_certifications?.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-white block border-b border-white/5 pb-1">Suggested Projects</span>
                      <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                        {atsData?.suggested_projects?.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 8. ATS Feedback (If ATS Score < 80) */}
                {atsData?.ats_score < 80 && (
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-red-400 uppercase">⚠️ Resume Improvement Suggestions</h4>
                    <p className="text-xs text-gray-400">Your ATS score is under 80%. Here are specific areas of improvement to optimize your candidacy:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-white block mb-1">Weak Areas</span>
                        <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                          {atsData?.weak_areas?.map((wa, i) => <li key={i}>{wa}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-white block mb-1">Improvements</span>
                        <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                          {atsData?.resume_improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Personalized Recommendations (Similar jobs) */}
                {atsData?.recommended_jobs?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase">✨ Other Jobs You Might Like</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {atsData.recommended_jobs.map((rj) => (
                        <div key={rj.id} className="bg-black/20 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-white">{rj.title}</p>
                            <p className="text-[10px] text-gray-400">{rj.company} • {rj.location}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                            {rj.match_score}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold transition-all">
                  Edit Details
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
