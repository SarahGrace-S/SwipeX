import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import JobCard from './JobCard';

export default function JobDiscovery() {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [animating, setAnimating] = useState('');
  const [hasToken, setHasToken] = useState(Boolean(localStorage.getItem('access_token')));
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    setHasToken(Boolean(localStorage.getItem('access_token')));
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/jobs/');
      const rawJobs = Array.isArray(res.data) ? res.data : [];
      const sortedJobs = [...rawJobs].sort((a, b) => {
        const compA = a.match_score != null ? a.match_score : 0;
        const compB = b.match_score != null ? b.match_score : 0;
        if (compB !== compA) return compB - compA;

        const atsA = a.ats_score != null ? a.ats_score : 0;
        const atsB = b.ats_score != null ? b.ats_score : 0;
        if (atsB !== atsA) return atsB - atsA;

        return (b.id || 0) - (a.id || 0);
      });
      setJobs(sortedJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    const job = jobs[currentIndex];
    if (!job) return;

    if (action === 'APPLIED') {
      navigate(`/apply/${job.id}`);
      return;
    }

    setAnimating(action === 'SKIPPED' ? 'left' : 'right');

    try {
      await api.post('/api/swipe/', { job_id: job.id, action });
      setFeedback(action === 'SKIPPED' ? 'Skipped!' : '★ Saved!');
    } catch (err) {
      console.error('Swipe failed:', err);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setAnimating('');
      setFeedback('');
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading Jobs...</div>
      </div>
    );
  }

  const currentJob = jobs[currentIndex];

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      
      <header className="max-w-7xl mx-auto px-6 py-3.5 w-full flex items-center justify-between border-b border-white/5">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-base shadow-lg">
            SX
          </div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            SwipeX
          </span>
        </Link>
        <nav className="flex items-center space-x-2.5 text-xs">
          <Link to="/search" className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Search</Link>
          <Link to="/saved-jobs" className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Saved</Link>
          <Link to="/applied-jobs" className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Applied</Link>
          {hasToken ? (
            <Link to="/jobseeker" className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
          ) : (
            <Link to="/login" className="px-3.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-semibold transition-all">Sign In</Link>
          )}
        </nav>
      </header>

      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-3 md:py-5 w-full">
        <div className="text-center mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            <span className="text-gradient">Job Discovery</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">Swipe right to save or apply, swipe left to pass</p>
        </div>

        
        {feedback && (
          <div className="mb-3 px-5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold animate-pulse">
            {feedback}
          </div>
        )}

        {currentJob ? (
          <div
            className={`w-full max-w-[760px] flex justify-center transition-all duration-300 ${
              animating === 'left' ? 'translate-x-[-120%] opacity-0 rotate-[-8deg]' :
              animating === 'right' ? 'translate-x-[120%] opacity-0 rotate-[8deg]' : ''
            }`}
          >
            <JobCard
              job={currentJob}
              onSwipeRight={(action) => handleSwipe(action)}
              onSwipeLeft={() => handleSwipe('SKIPPED')}
            />
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center max-w-md border border-purple-500/10">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
            <p className="text-gray-400 text-sm mb-6">You've seen all available jobs. Check back later for new opportunities.</p>
            <Link to="/saved-jobs" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-bold text-sm">
              View Saved Jobs
            </Link>
          </div>
        )}

        {currentJob && (
          <p className="mt-3 text-gray-500 text-xs font-semibold">
            {currentIndex + 1} of {jobs.length} jobs
          </p>
        )}
      </main>
    </div>
  );
}
