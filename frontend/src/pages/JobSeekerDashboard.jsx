import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function JobSeekerDashboard() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'JOB_SEEKER') {
      navigate('/login');
      return;
    }

    setUser(parsed);
    fetchAnalytics();
    fetchDashboardData();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/seeker-analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const notificationsRes = await api.get('/api/notifications/');
      setNotifications(notificationsRes.data.slice(0, 5));

      const savedRes = await api.get('/api/saved-jobs/');
      setSavedJobs(savedRes.data.slice(0, 5));

      const appliedRes = await api.get('/api/applied-jobs/');
      setAppliedJobs(appliedRes.data.slice(0, 5));

      const recsRes = await api.get('/api/recommendations/');
      setRecommendedJobs(recsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id}/`, { is_read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to mark all as read', err);
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
      <main className="flex-grow px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, <span className="text-gradient">{user.full_name}</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">Track your applications, resume performance, and match insights.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${user.resume ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
                {user.resume ? 'Resume Linked ✓' : 'Upload Resume to Start'}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Score: {analytics ? `${analytics.avg_ats_score}% ATS` : '...'}
              </span>
            </div>
          </div>

          {/* Personalized Career Dashboard Overview */}
          <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-purple-900/5 text-left space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">👤 Personalized Career Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400">🎯 Profile Match Score</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">{analytics ? `${analytics.overall_ats_score}%` : '0%'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400">👀 Jobs Viewed</span>
                <span className="text-2xl font-black text-white mt-1 block">{analytics?.total_viewed || 0}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400">★ Jobs Liked (Saved)</span>
                <span className="text-2xl font-black text-white mt-1 block">{analytics?.saved_jobs_count || 0}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400">📝 Applications</span>
                <span className="text-2xl font-black text-white mt-1 block">{analytics?.total_applied || 0}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400 mb-2">Top Skills</span>
                {user?.skills || user?.extracted_skills ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set([
                      ...(user.skills || '').split(','), 
                      ...(user.extracted_skills || '').split(',')
                    ]))
                      .map(s => s.trim())
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-bold">{s}</span>
                      ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">No skills listed yet</span>
                )}
              </div>
              
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="block text-xs text-gray-400 mb-2">Recommended Skills to Acquire</span>
                {analytics?.frequently_missing?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.frequently_missing.slice(0, 8).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg text-xs font-bold">{s}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">Looking good! No missing keywords found.</span>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Resume Uploaded</span>
              <span className={`block text-xl font-black mt-1 ${analytics?.resume_uploaded ? 'text-emerald-400' : 'text-amber-400'}`}>
                {analytics?.resume_uploaded ? 'Uploaded ✓' : 'Missing ✕'}
              </span>
              <span className="block text-[9px] text-gray-400 mt-2">ATS source status</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overall ATS Score</span>
              <span className="block text-2xl font-black text-white mt-1">{analytics ? `${analytics.overall_ats_score}%` : '0%'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Resume structure quality</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommended Jobs</span>
              <span className="block text-2xl font-black text-indigo-400 mt-1">{analytics ? analytics.recommended_jobs_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Matched categories</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Applied Jobs</span>
              <span className="block text-2xl font-black text-white mt-1">{analytics ? analytics.total_applied : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Applications submitted</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saved Jobs</span>
              <span className="block text-2xl font-black text-white mt-1">{analytics ? analytics.saved_jobs_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Bookmarked roles</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profile Completion</span>
              <span className="block text-2xl font-black text-purple-400 mt-1">{analytics ? `${analytics.profile_completion}%` : '0%'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Profile detail completeness</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shortlisted</span>
              <span className="block text-2xl font-black text-emerald-400 mt-1">{analytics ? analytics.shortlisted_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Review status shortlists</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rejected</span>
              <span className="block text-2xl font-black text-red-400 mt-1">{analytics ? analytics.rejected_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Not selected roles</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Interview Scheduled</span>
              <span className="block text-2xl font-black text-amber-400 mt-1">{analytics ? analytics.interview_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Scheduled interviews</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/10">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected / Hired</span>
              <span className="block text-2xl font-black text-teal-400 mt-1">{analytics ? analytics.selected_count : '0'}</span>
              <span className="block text-[9px] text-gray-400 mt-2">Offers accepted</span>
            </div>
          </div>

          {/* Middle Analytics Hub: Resume & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Resume Performance & Insights */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-purple-500/10 space-y-6">
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-purple-300">📈 Resume Performance & Tracking</h3>
                  <p className="text-gray-400 text-xs mt-1">Based on keyword parsing & job compatibility parameters.</p>
                </div>
                {analytics && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                    analytics.resume_performance_status === 'GOOD' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' 
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/20'
                  }`}>
                    {analytics.resume_performance_status === 'GOOD' ? '🟢 Good' : '🟠 Needs Improvement'}
                  </span>
                )}
              </div>

              {/* Status Alert Banner */}
              {analytics && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs text-left ${
                  analytics.resume_performance_status === 'GOOD'
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                }`}>
                  <span className="text-lg">{analytics.resume_performance_status === 'GOOD' ? '🟢' : '🟠'}</span>
                  <div>
                    <h4 className="font-bold mb-0.5">
                      {analytics.resume_performance_status === 'GOOD' 
                        ? 'Your resume is performing well!' 
                        : 'Your resume performance can be improved.'}
                    </h4>
                    <p className="opacity-80">{analytics.resume_performance_message}</p>
                    {analytics.resume_performance_status !== 'GOOD' && (
                      <div className="mt-2 text-[11px] space-y-1 opacity-90 border-t border-amber-500/10 pt-2">
                        <span className="font-bold">Key performance constraints detected:</span>
                        <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                          {analytics.frequently_missing?.length > 0 && <li>Missing skills: {analytics.frequently_missing.slice(0, 3).join(', ')}</li>}
                          {analytics.avg_ats_score < 70 && <li>Low average ATS score ({analytics.avg_ats_score}%)</li>}
                          {analytics.total_applied === 0 && <li>No applications sent yet</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real Data Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Jobs Viewed</span>
                  <span className="text-sm font-black text-white mt-1 block">{analytics?.total_viewed || 0}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Jobs Recommended</span>
                  <span className="text-sm font-black text-white mt-1 block">{analytics?.recommended_jobs_count || 0}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Jobs Matched</span>
                  <span className="text-sm font-black text-white mt-1 block">{analytics?.jobs_matched || 0}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Average ATS</span>
                  <span className="text-sm font-black text-emerald-400 mt-1 block">{analytics?.avg_ats_score || 0}%</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Avg Compatibility</span>
                  <span className="text-sm font-black text-indigo-400 mt-1 block">{analytics?.avg_compatibility_score || 0}%</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-bold text-gray-500 uppercase">Match Rate</span>
                  <span className="text-sm font-black text-purple-400 mt-1 block">{analytics?.resume_match_rate || 0}%</span>
                </div>
              </div>

              {/* Skills matching representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">⭐ Strongest Skills</h4>
                  {analytics?.strongest_skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analytics.strongest_skills.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md text-[10px] font-semibold">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">Not enough data. Apply to more jobs.</p>
                  )}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⚠️ Missing technical keywords</h4>
                  {analytics?.frequently_missing?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analytics.frequently_missing.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded-md text-[10px] font-semibold">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">None detected! Excellent keyword coverage.</p>
                  )}
                </div>
              </div>

              {/* CSS Charts representing Hiring Funnel */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Hiring Stages Funnel</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400">Shortlisted for Review</span>
                      <span className="font-semibold text-white">{analytics ? analytics.shortlisted_count : 0} applicants</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics?.total_applied ? (analytics.shortlisted_count / analytics.total_applied) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400">Interviews Scheduled</span>
                      <span className="font-semibold text-white">{analytics ? analytics.interview_count : 0} applicants</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics?.total_applied ? (analytics.interview_count / analytics.total_applied) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Insights Section */}
            <div className="glass-card p-6 rounded-3xl border border-purple-500/10 flex flex-col justify-between">
              <div>
                <div className="border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-purple-300">✨ Recommendation Insights</h3>
                  <p className="text-gray-400 text-xs mt-1">Smart matches derived from swipes, saves and preferences.</p>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Recommended</span>
                    <span className="text-xs font-bold text-white">{analytics?.recommendation_insights?.recommended_count || 0}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Applied</span>
                    <span className="text-xs font-bold text-white">{analytics?.recommendation_insights?.applied_count || 0}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Shortlisted</span>
                    <span className="text-xs font-bold text-yellow-400">{analytics?.recommendation_insights?.shortlisted_count || 0}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Rejected</span>
                    <span className="text-xs font-bold text-red-400">{analytics?.recommendation_insights?.rejected_count || 0}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Saved</span>
                    <span className="text-xs font-bold text-purple-300">{analytics?.recommendation_insights?.saved_count || 0}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-[8px] text-gray-500 uppercase">Skipped</span>
                    <span className="text-xs font-bold text-gray-400">{analytics?.recommendation_insights?.skipped_count || 0}</span>
                  </div>
                </div>

                {/* Recommendation Rationale */}
                <div className="mb-4 text-left">
                  <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2">Why jobs are recommended</h4>
                  <ul className="space-y-1 text-[11px] text-gray-300">
                    {analytics?.recommendation_insights?.matching_reasons?.map((reason, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Categories */}
                <div className="text-left border-t border-white/5 pt-3">
                  <h4 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2">Top Recommended Categories</h4>
                  <div className="space-y-1 text-[11px]">
                    {analytics?.recommendation_insights?.top_categories?.map((cat, idx) => (
                      <div key={idx} className="flex justify-between text-gray-300">
                        <span className="truncate max-w-[130px] inline-block">{cat.category}</span>
                        <span className="font-bold text-white">{cat.count} jobs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link to="/recommendations" className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-center text-xs font-bold rounded-xl transition-all block">
                View Tailored Recommendations
              </Link>
            </div>
          </div>

          {/* Lower Quick Access Hub: Notifications & Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side: Dedicated Notifications Widget (2 columns on lg screens) */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-purple-500/10 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-purple-300">🔔 Latest Notifications</h3>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                      {notifications.filter(n => !n.is_read).length} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {notifications.some(n => !n.is_read) && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                  <Link to="/notifications" className="text-[10px] text-gray-400 hover:text-white font-bold hover:underline">
                    View All →
                  </Link>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No notifications found.</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                        notif.is_read ? 'border-white/5 bg-white/5 opacity-70' : 'border-purple-500/30 bg-purple-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-grow">
                        <span className="text-lg mt-0.5">
                          {notif.notification_type === 'NEW_APPLICANT' || notif.notification_type === 'NEW_APPLICATION' ? '👤' :
                           notif.notification_type === 'APPLICATION_SUBMITTED' ? '✅' :
                           notif.notification_type === 'SHORTLISTED' ? '⭐' :
                           notif.notification_type === 'REJECTED' ? '❌' :
                           notif.notification_type === 'SELECTED' ? '🎉' :
                           notif.notification_type === 'INTERVIEW_SCHEDULED' ? '📅' : 
                           notif.notification_type === 'STARTUP_HIRING' ? '🚀' :
                           notif.notification_type === 'HIGH_MATCH' ? '✨' :
                           notif.notification_type === 'LOW_COMPETITION' ? '🔥' : '💬'}
                        </span>
                        <div className="flex-1">
                          {notif.related_job ? (
                            <button
                              onClick={() => {
                                markAsRead(notif.id);
                                if (['SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(notif.notification_type)) {
                                  navigate('/applied-jobs');
                                } else {
                                  navigate(`/apply/${notif.related_job}`);
                                }
                              }}
                              className="text-left font-semibold text-white hover:text-purple-300 hover:underline block"
                            >
                              {notif.message}
                            </button>
                          ) : (
                            <p className="text-white font-medium">{notif.message}</p>
                          )}
                          <span className="text-[10px] text-gray-500 font-medium block mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline self-center"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right side: Navigation & Optimization Suggestions (1 column on lg screens) */}
            <div className="space-y-6 text-left">
              {/* Action Control Center */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-purple-300">Action Control Center</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <Link to="/discover" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs">Discover Swipe Jobs</h4>
                      <p className="text-[9px] text-gray-500">Swipe right to bookmark/apply</p>
                    </div>
                    <span>⚡</span>
                  </Link>
                  <Link to="/search" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs">Search Jobs Directory</h4>
                      <p className="text-[9px] text-gray-500">Filter jobs using tags</p>
                    </div>
                    <span>🔍</span>
                  </Link>
                  <Link to="/profile" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs">My Profile Setup</h4>
                      <p className="text-[9px] text-gray-500">Configure qualifications & resume</p>
                    </div>
                    <span>👤</span>
                  </Link>
                </div>
              </div>

              {/* Resume optimization suggestions */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-purple-300">💡 Optimization Suggestions</h3>
                {analytics?.suggestions?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.suggestions.map((s, i) => (
                      <div key={i} className="bg-purple-500/5 border border-purple-500/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-purple-200">
                        <span className="text-base mt-0.5">💡</span>
                        <p className="leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300">
                    🎉 All parameters optimized! Your match rankings look perfect.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
