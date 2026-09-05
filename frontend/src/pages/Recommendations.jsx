import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Recommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/api/recommendations/');
      setJobs(res.data);
    } catch (err) {
      setError('Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId) => {
    window.location.href = `/apply/${jobId}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-white flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Recommended Jobs</h1>
        <p className="text-gray-400 text-sm">Jobs tailored specifically to your skills and preferences.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-xl font-bold mb-2">No recommendations yet</h2>
          <p className="text-gray-400 text-sm text-center max-w-md">
            Update your profile with more skills or swipe on some jobs so we can learn what you like.
          </p>
          <Link to="/profile" className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all">
            Update Profile
          </Link>
        </div>
      ) : (
        <>
          {jobs.length > 0 && jobs[0].profile_incomplete && (
            <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <h2 className="text-lg font-bold text-amber-400 mb-2">Action Required</h2>
              <p className="text-amber-200">Complete your profile or upload your resume to receive personalized recommendations.</p>
              <Link to="/profile" className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all">
                Complete Profile
              </Link>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="glass-card rounded-3xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{job.title}</h3>
                  <p className="text-sm font-medium text-purple-300">{job.company}</p>
                </div>
                {job.match_score !== undefined && !job.profile_incomplete && (
                  <div className="flex flex-col gap-1 items-end">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${job.match_score >= 80 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : job.match_score >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                      {job.match_score}% Compatible
                    </div>
                    {job.ats_score !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${job.ats_score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : job.ats_score >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                        {job.ats_score}% ATS
                      </div>
                    )}
                    {job.competition_level && (
                      <div className={`px-3 py-1 rounded-full text-[9px] font-bold border mt-1 text-center bg-white/5 border-white/10 text-gray-300`}>
                        Comp: {job.competition_level === 'LOW' ? 'Low' : job.competition_level === 'MEDIUM' ? 'Moderate' : 'High'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-xs text-gray-400">
                  <span className="w-5">📍</span>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="w-5">💰</span>
                  <span>{job.salary || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="w-5">💼</span>
                  <span>{job.experience || 'Any experience'}</span>
                </div>
              </div>

              
              {job.matching_skills && job.matching_skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Matching Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.matching_skills.slice(0, 5).map(skill => (
                      <span key={skill} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                        {skill} ✓
                      </span>
                    ))}
                    {job.matching_skills.length > 5 && <span className="text-[10px] text-gray-500">+{job.matching_skills.length - 5} more</span>}
                  </div>
                </div>
              )}
              {job.missing_skills && job.missing_skills.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.missing_skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold">
                        {skill} ✕
                      </span>
                    ))}
                    {job.missing_skills.length > 3 && <span className="text-[10px] text-gray-500">+{job.missing_skills.length - 3} more</span>}
                  </div>
                </div>
              )}

              {job.recommendation_reason && (
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Reason:</p>
                  <p className="text-sm text-gray-300">{job.recommendation_reason}</p>
                </div>
              )}
              <button 
                onClick={() => handleApply(job.id)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-purple-600 text-white font-bold text-sm transition-all border border-white/10 hover:border-purple-500"
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
