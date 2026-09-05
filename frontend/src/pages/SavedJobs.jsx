import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const res = await api.get('/api/saved-jobs/');
      setSavedJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await api.post('/api/swipe/', { job_id: jobId, action: 'UNSAVE' });
      setSavedJobs(prev => prev.filter(entry => entry.job.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading saved jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between border-b border-white/5">
        <Link to="/jobseeker" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">SX</div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">SwipeX</span>
        </Link>
        <nav className="flex items-center space-x-3 text-xs">
          <Link to="/discover" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Discover</Link>
          <Link to="/applied-jobs" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Applied</Link>
          <Link to="/jobseeker" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-grow">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          <span className="text-gradient">★ Saved Jobs</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">Jobs you've bookmarked for later</p>

        {savedJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-purple-500/10">
            <p className="text-gray-400 mb-4">No saved jobs yet. Start discovering!</p>
            <Link to="/discover" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-bold text-sm">
              Discover Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((entry) => (
              <div key={entry.id} className="glass-card rounded-2xl p-6 border border-purple-500/10 hover:border-purple-500/25 transition-all relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{entry.job.title}</h3>
                    <p className="text-purple-300 text-sm font-medium">{entry.job.company}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-500/15 text-yellow-300 border border-yellow-500/20">
                      Saved
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      entry.job.competition_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      entry.job.competition_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      Competition: {entry.job.competition_level} ({entry.job.application_count || 0} applicants)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                  <span>📍 {entry.job.location}</span>
                  <span>💰 {entry.job.salary || 'N/A'}</span>
                  <span>🎯 {entry.job.experience || 'Any'}</span>
                </div>

                {/* Score indicators */}
                {!entry.job.profile_incomplete ? (
                  <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-3 my-4">
                    <div className="text-center border-r border-white/5">
                      <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">ATS Match</span>
                      <span className="text-sm font-bold text-emerald-400">{entry.job.ats_score}%</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Compatibility</span>
                      <span className="text-sm font-bold text-indigo-400">{entry.job.match_score}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 my-3 text-center">
                    Complete profile/resume to view scores
                  </p>
                )}

                {/* Skills breakdown */}
                {!entry.job.profile_incomplete && (
                  <div className="space-y-2 mt-3">
                    {entry.job.matching_skills?.length > 0 && (
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Matching Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {entry.job.matching_skills.map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[9px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.job.missing_skills?.length > 0 && (
                      <div>
                        <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Missing Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {entry.job.missing_skills.map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[9px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-white/5">
                  <button 
                    onClick={() => handleUnsave(entry.job.id)}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors mr-auto"
                  >
                    Unsave
                  </button>
                  <Link 
                    to={`/apply/${entry.job.id}`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
