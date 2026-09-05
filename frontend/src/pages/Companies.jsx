import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get('type') || 'MNC'; 
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetchJobs();
  }, [activeType, navigate]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/jobs/?company_type=${activeType}`);
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs by company type:', err);
    } finally {
      setLoading(false);
    }
  };

  const setCompanyType = (type) => {
    setSearchParams({ type });
  };

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      
      <header className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between border-b border-white/5">
        <Link to="/jobseeker" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">SX</div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">SwipeX</span>
        </Link>
        <nav className="flex items-center space-x-3 text-xs">
          <Link to="/discover" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Discover</Link>
          <Link to="/search" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Search</Link>
          <Link to="/jobseeker" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-grow">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          <span className="text-gradient">Explore Companies</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">Filter opportunities by company environment</p>

        
        <div className="grid grid-cols-3 gap-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setCompanyType('MNC')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeType === 'MNC'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            MNC Jobs
          </button>
          <button
            onClick={() => setCompanyType('STARTUP')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeType === 'STARTUP'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Startup Jobs
          </button>
          <button
            onClick={() => setCompanyType('NEW_STARTUP')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeType === 'NEW_STARTUP'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            New Startups
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/10">
            <p className="text-gray-400">No jobs found in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="glass-card rounded-2xl p-6 border border-purple-500/10 hover:border-purple-500/25 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                    <p className="text-purple-300 text-sm font-medium">{job.company}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/15">
                    {job.job_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary || 'N/A'}</span>
                  <span>🎯 {job.experience || 'Any'}</span>
                </div>
                {job.skills && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills.split(',').map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">{s.trim()}</span>
                    ))}
                  </div>
                )}
                {job.description && (
                  <p className="text-gray-400 text-xs mt-4 leading-relaxed line-clamp-2">{job.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
