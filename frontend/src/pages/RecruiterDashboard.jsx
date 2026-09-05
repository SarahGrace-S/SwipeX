import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function RecruiterDashboard() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'RECRUITER') {
      navigate('/login');
      return;
    }

    setUser(parsed);
    fetchAnalytics();
    fetchRecentData();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentData = async () => {
    try {
      const jobsRes = await api.get('/api/jobs/');
      setRecentJobs(jobsRes.data.slice(0, 5));

      const appsRes = await api.get('/api/applications/');
      setRecentApplicants(appsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">
            SX
          </div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            SwipeX
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl border border-white/10 hover:border-red-400 hover:bg-red-500/10 text-gray-300 hover:text-red-200 transition-all duration-300 font-medium text-xs uppercase tracking-wider"
        >
          Sign Out
        </button>
      </header>

      {/* Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="glass-card rounded-3xl p-8 md:p-12 w-full max-w-6xl shadow-2xl border border-indigo-500/10 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
              Welcome back, <span className="text-gradient">{user.full_name}</span>
            </h1>
            <h2 className="text-xl font-semibold text-indigo-300">Recruiter Control Center</h2>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jobs Posted</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.total_jobs_posted : '...'}
              </span>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Applications</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.total_applicants : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg ATS Score</span>
              <span className="text-xl font-black mt-1 text-emerald-400">
                {analytics ? `${analytics.avg_ats_score}%` : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Compatibility</span>
              <span className="text-xl font-black mt-1 text-indigo-400">
                {analytics ? `${analytics.avg_compatibility_score}%` : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pending</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.pending : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Shortlisted</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.shortlisted : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Interviews</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.interview : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Jobs</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.active_jobs : '...'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Rejected</span>
              <span className="text-xl font-black mt-1 text-white">
                {analytics ? analytics.rejected : '...'}
              </span>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Status</span>
              <span className="text-sm font-bold mt-2 text-emerald-300">ONLINE ✓</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-indigo-300 mb-2 text-left">Quick Navigation</h3>
              <div className="grid grid-cols-1 gap-4 text-left">
                <Link to="/recruiter/post-job" className="p-4 rounded-2xl glass-card border border-indigo-500/20 hover:border-indigo-400 transition-all flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">Post a Job</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">Create a new job listing</p>
                  </div>
                  <span className="text-lg">✍️</span>
                </Link>
                <Link to="/recruiter/jobs" className="p-4 rounded-2xl glass-card border border-indigo-500/20 hover:border-indigo-400 transition-all flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">Manage Jobs</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">View and edit your postings</p>
                  </div>
                  <span className="text-lg">📁</span>
                </Link>
                <Link to="/recruiter/applicants" className="p-4 rounded-2xl glass-card border border-indigo-500/20 hover:border-indigo-400 transition-all flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">View Applicants</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">Review and manage candidates</p>
                  </div>
                  <span className="text-lg">👥</span>
                </Link>
                <Link to="/recruiter/company-profile" className="p-4 rounded-2xl glass-card border border-indigo-500/20 hover:border-indigo-400 transition-all flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">Company Profile</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5">Update your company details</p>
                  </div>
                  <span className="text-lg">🏢</span>
                </Link>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="lg:col-span-1 space-y-4 text-left">
              <h3 className="text-lg font-bold text-indigo-300 mb-2">Recent Applicants</h3>
              {recentApplicants.length === 0 ? (
                <div className="glass-card p-4 rounded-2xl border border-white/5 text-gray-400 text-xs">
                  No applicants received yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplicants.map((app) => (
                    <div key={app.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{app.full_name}</p>
                        <p className="text-[10px] text-gray-400">{app.job_details?.title}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
                        {app.ats_score}% ATS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="lg:col-span-1 space-y-4 text-left">
              <h3 className="text-lg font-bold text-indigo-300 mb-2">Recent Jobs</h3>
              {recentJobs.length === 0 ? (
                <div className="glass-card p-4 rounded-2xl border border-white/5 text-gray-400 text-xs">
                  No jobs posted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{job.title}</p>
                        <p className="text-[10px] text-gray-400">{job.location} • {job.job_type.replace('_', ' ')}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded font-bold uppercase text-[9px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
