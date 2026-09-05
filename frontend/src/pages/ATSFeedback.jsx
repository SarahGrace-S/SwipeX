import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ATSFeedback() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/seeker-analytics/');
      setAnalytics(res.data);
    } catch (err) {
      setError('Failed to fetch ATS feedback and analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  
  let atsCategory = "Needs Improvement";
  let atsColor = "text-red-400";
  let atsBg = "bg-red-500/10 border-red-500/30";
  
  if (analytics.avg_ats_score >= 80) {
    atsCategory = "Excellent";
    atsColor = "text-emerald-400";
    atsBg = "bg-emerald-500/10 border-emerald-500/30";
  } else if (analytics.avg_ats_score >= 65) {
    atsCategory = "Good";
    atsColor = "text-blue-400";
    atsBg = "bg-blue-500/10 border-blue-500/30";
  } else if (analytics.avg_ats_score >= 50) {
    atsCategory = "Average";
    atsColor = "text-amber-400";
    atsBg = "bg-amber-500/10 border-amber-500/30";
  }

  return (
    <div className="min-h-screen text-white flex flex-col p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">ATS Feedback & Suggestions</h1>
        <p className="text-gray-400 text-sm">How your profile is performing against Applicant Tracking Systems.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`col-span-1 md:col-span-2 glass-card rounded-3xl p-8 border flex flex-col justify-center ${atsBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Average ATS Score</p>
              <h2 className="text-5xl font-black text-white">{analytics.avg_ats_score}<span className="text-3xl text-gray-500">%</span></h2>
              <p className={`mt-2 font-bold text-lg ${atsColor}`}>{atsCategory}</p>
            </div>
            
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-black/30" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * analytics.avg_ats_score) / 100} className={atsColor} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Total Applications</p>
            <h2 className="text-4xl font-black text-white">{analytics.total_applied}</h2>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Profile Completion</p>
            <div className="w-full bg-black/40 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${analytics.profile_completion}%` }}></div>
            </div>
            <p className="text-right text-xs mt-1 font-bold text-purple-400">{analytics.profile_completion}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3 text-2xl">💡</span> Smart Suggestions
          </h2>
          
          {analytics.suggestions && analytics.suggestions.length > 0 ? (
            <ul className="space-y-4">
              {analytics.suggestions.map((s, idx) => (
                <li key={idx} className="flex p-4 bg-white/5 border border-white/10 rounded-xl items-start">
                  <span className="text-purple-400 mr-3 text-lg leading-none mt-0.5">✦</span>
                  <p className="text-sm text-gray-200">{s}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Your profile is highly optimized. Keep applying!</p>
          )}

          {analytics.avg_ats_score < 80 && (
            <div className="mt-6 p-4 border border-amber-500/30 bg-amber-500/5 rounded-xl">
              <h3 className="text-sm font-bold text-amber-400 mb-2">How to improve?</h3>
              <ul className="text-xs text-amber-200/80 space-y-2 list-disc list-inside">
                <li>Add commonly missing skills to your profile (e.g., Docker, AWS, React)</li>
                <li>Tailor your "Experience" text to include measurable achievements</li>
                <li>Ensure you have a degree and college listed</li>
              </ul>
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3 text-2xl">📚</span> Suggested Upskilling
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-white group-hover:text-purple-400">AWS Certified Cloud Practitioner</h3>
              <p className="text-xs text-gray-400 mt-1">Cloud skills are highly requested in backend & fullstack roles.</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-white group-hover:text-purple-400">Docker & Kubernetes Masterclass</h3>
              <p className="text-xs text-gray-400 mt-1">Boost your ATS score for DevOps and senior engineering roles.</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-white group-hover:text-purple-400">Build a Microservices Project</h3>
              <p className="text-xs text-gray-400 mt-1">Adding project links to your resume significantly improves recruiter callback rates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
