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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/jobs/');
      setJobs(res.data);
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
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between border-b border-white/5">
        <Link to="/jobseeker" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">
            SX
          </div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            SwipeX
          </span>
        </Link>
        <nav className="flex items-center space-x-3 text-xs">
          <Link to="/search" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Search</Link>
          <Link to="/saved-jobs" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Saved</Link>
          <Link to="/applied-jobs" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Applied</Link>
          <Link to="/jobseeker" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-8">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-center">
          <span className="text-gradient">Job Discovery</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8 text-center">Swipe right to save or apply, swipe left to skip</p>

        {/* Feedback Toast */}
        {feedback && (
          <div className="mb-4 px-6 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm font-semibold animate-pulse">
            {feedback}
          </div>
        )}

        {currentJob ? (
          <div
            className={`transition-all duration-300 ${
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
          <div className="glass-card rounded-3xl p-12 text-center max-w-md border border-purple-500/10">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
            <p className="text-gray-400 text-sm mb-6">You've seen all available jobs. Check back later for new opportunities.</p>
            <Link to="/saved-jobs" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-bold text-sm">
              View Saved Jobs
            </Link>
          </div>
        )}

        {/* Counter */}
        {currentJob && (
          <p className="mt-6 text-gray-500 text-xs">
            {currentIndex + 1} of {jobs.length} jobs
          </p>
        )}
      </main>
    </div>
  );
}
