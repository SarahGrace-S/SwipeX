import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function AppliedJobs() {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  const fetchAppliedJobs = async () => {
    try {
      const res = await api.get('/api/applications/');
      setAppliedJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch applied jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = appliedJobs.filter(entry => {
    if (filter === 'ALL') return true;
    if (filter === 'SHORTLISTED') return entry.status === 'SHORTLISTED';
    if (filter === 'INTERVIEW') return entry.status === 'INTERVIEW';
    if (filter === 'SELECTED') return entry.status === 'SELECTED';
    if (filter === 'REJECTED') return entry.status === 'REJECTED';
    return true;
  });

  const getStatusDisplay = (status) => {
    const statusMap = {
      'APPLIED': 'Applied',
      'SHORTLISTED': 'Shortlisted',
      'INTERVIEW': 'Interview Scheduled',
      'SELECTED': 'Selected',
      'REJECTED': 'Rejected',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading applied jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      
      <header className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between border-b border-white/5">
        <Link to="/jobseeker" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">SX</div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">SwipeX</span>
        </Link>
        <nav className="flex items-center space-x-3 text-xs">
          <Link to="/discover" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Discover</Link>
          <Link to="/saved-jobs" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Saved</Link>
          <Link to="/jobseeker" className="px-3 py-2 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-grow">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          <span className="text-gradient">✓ Applied Jobs</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">Jobs you have applied for and their status tracking</p>

        
        {appliedJobs.length > 0 && (
          <div className="flex border-b border-white/5 mb-6 gap-6 overflow-x-auto pb-1 text-xs">
            {[
              { label: 'All Applications', val: 'ALL' },
              { label: 'Shortlisted', val: 'SHORTLISTED' },
              { label: 'Interviews 📅', val: 'INTERVIEW' },
              { label: 'Offers 🎉', val: 'SELECTED' },
              { label: 'Rejected Applications ❌', val: 'REJECTED' }
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => setFilter(tab.val)}
                className={`pb-2.5 font-bold transition-all relative whitespace-nowrap ${
                  filter === tab.val ? 'text-purple-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {appliedJobs.filter(j => j.status === tab.val).length > 0 && (
                  <span className="ml-1.5 bg-white/10 text-gray-300 text-[9px] px-1.5 py-0.5 rounded-full">
                    {appliedJobs.filter(j => j.status === tab.val).length}
                  </span>
                )}
                {filter === tab.val && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {appliedJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-purple-500/10">
            <p className="text-gray-400 mb-4">No applications submitted yet. Start discovering!</p>
            <Link to="/discover" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all font-bold text-sm">
              Discover Jobs
            </Link>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-purple-500/10">
            <p className="text-gray-400">No applications found under the selected status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((entry) => (
              <div key={entry.id} className="glass-card rounded-2xl p-6 border border-purple-500/10 hover:border-purple-500/25 transition-all relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{entry.job_details?.title}</h3>
                    <p className="text-purple-300 text-sm font-medium">{entry.job_details?.company}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Applied on: {new Date(entry.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      entry.status === 'APPLIED' ? 'bg-blue-500/15 text-blue-300 border-blue-500/20' :
                      entry.status === 'SHORTLISTED' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' :
                      entry.status === 'INTERVIEW' ? 'bg-orange-500/15 text-orange-300 border-orange-500/20' :
                      entry.status === 'SELECTED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' :
                      'bg-red-500/15 text-red-300 border-red-500/20'
                    }`}>
                      {getStatusDisplay(entry.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      entry.job_details?.competition_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      entry.job_details?.competition_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      Competition: {entry.job_details?.competition_level || 'LOW'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                  <span>📍 {entry.job_details?.location}</span>
                  <span>💰 {entry.job_details?.salary || 'N/A'}</span>
                  <span>🎯 {entry.job_details?.experience || 'Any'}</span>
                </div>

                
                <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-3 mt-4">
                  <div className="text-center border-r border-white/5">
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">ATS Score</span>
                    <span className="text-sm font-bold text-emerald-400">{entry.ats_score}%</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Compatibility Score</span>
                    <span className="text-sm font-bold text-indigo-400">{entry.compatibility_score}%</span>
                  </div>
                </div>

                {entry.status === 'INTERVIEW' && entry.interview_date && (
                  <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2 text-xs text-left">
                    <span className="font-bold text-purple-300 block text-[10px] uppercase tracking-wider">📅 Scheduled Interview Details</span>
                    <p><span className="text-gray-400">Date:</span> {entry.interview_date}</p>
                    <p><span className="text-gray-400">Time:</span> {entry.interview_time}</p>
                    {entry.interview_link && (
                      <p><span className="text-gray-400">Meeting Link:</span> <a href={entry.interview_link} target="_blank" rel="noreferrer" className="underline text-indigo-400 font-semibold hover:text-indigo-300">{entry.interview_link}</a></p>
                    )}
                    {entry.interview_message && (
                      <p className="text-gray-300 italic"><span className="text-gray-400 not-italic font-medium">Message:</span> "{entry.interview_message}"</p>
                    )}
                  </div>
                )}

                {entry.status === 'REJECTED' && (
                  <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">💡 Improve Your Chances</h4>
                    <div className="text-xs space-y-2 text-gray-300">
                      {entry.missing_skills && (
                        <p><span className="font-semibold text-white">Missing Skills:</span> {entry.missing_skills.split(',').join(', ')}</p>
                      )}
                      {entry.missing_keywords && (
                        <p><span className="font-semibold text-white">Missing Keywords:</span> {entry.missing_keywords.split(',').join(', ')}</p>
                      )}
                      
                      <div className="pt-1">
                        <span className="font-semibold text-white block mb-1">Tailored Suggestions:</span>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                          {entry.missing_skills ? entry.missing_skills.split(',').map((skill, idx) => (
                            <li key={idx}>Gain hands-on knowledge in <span className="text-white font-medium">{skill.trim()}</span> and feature a practical project showcasing it.</li>
                          )) : (
                            <li>Refine your resume key segments to match the preferred stack.</li>
                          )}
                          <li>Enhance your professional statement to directly cover key technologies.</li>
                          <li>Quantify project success metrics and details under your work listings.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {entry.job_details?.skills && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {entry.job_details.skills.split(',').slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">{s.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
