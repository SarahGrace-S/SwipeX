import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchRecentApplicants();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics/');
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch analytics.');
    }
  };

  const fetchRecentApplicants = async () => {
    try {
      const res = await api.get('/api/applications/');
      
      setRecentApplicants(res.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-white flex flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your jobs and applicants.</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Jobs Posted" value={data.total_jobs_posted} icon="📁" color="indigo" />
          <StatCard title="Active Jobs" value={data.active_jobs} icon="🟢" color="emerald" />
          <StatCard title="Total Applicants" value={data.total_applicants} icon="👥" color="purple" />
          <StatCard title="Shortlisted" value={data.shortlisted} icon="⭐" color="amber" />
        </div>
      )}

      {data && (
        <div className="space-y-8 mb-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-4">📊 Application Status Breakdown</h2>
                <p className="text-gray-400 text-xs mb-6">Real-time status tracking for posted roles.</p>
                <div className="space-y-4">
                  <ProgressBar label="Pending" value={data.pending} total={data.total_applicants} color="blue" />
                  <ProgressBar label="Shortlisted" value={data.shortlisted} total={data.total_applicants} color="amber" />
                  <ProgressBar label="Interview" value={data.interview} total={data.total_applicants} color="emerald" />
                  <ProgressBar label="Selected / Hired" value={data.selected || 0} total={data.total_applicants} color="teal" />
                  <ProgressBar label="Rejected" value={data.rejected} total={data.total_applicants} color="red" />
                </div>
              </div>
            </div>
            
            
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 flex flex-col justify-between">
              <div className="w-full text-left">
                <h2 className="text-lg font-bold mb-1">🎯 Hiring Funnel</h2>
                <p className="text-gray-400 text-xs mb-6">Percentage conversion across status stages.</p>
              </div>
              
              <div className="flex flex-col items-center justify-center my-2">
                <div className="w-36 h-36 rounded-full border-8 border-indigo-500/30 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 border-8 border-indigo-500 rounded-full border-t-transparent animate-spin-slow"></div>
                  <span className="text-3xl font-extrabold text-indigo-400">
                    {data.total_applicants > 0 ? Math.round(((data.selected || 0) / data.total_applicants) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Hired Rate</span>
                </div>
              </div>
              
              <div className="w-full space-y-2 text-xs text-gray-300 mt-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                  <span>📁 Applications:</span>
                  <span className="font-bold text-white">{data.total_applicants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>⭐ Shortlisted:</span>
                  <span className="font-semibold text-amber-300">
                    {data.shortlisted} ({data.total_applicants > 0 ? Math.round((data.shortlisted / data.total_applicants) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>📅 Interviewed:</span>
                  <span className="font-semibold text-emerald-300">
                    {data.interview} ({data.total_applicants > 0 ? Math.round((data.interview / data.total_applicants) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🎉 Selected/Hired:</span>
                  <span className="font-semibold text-teal-300">
                    {data.selected || 0} ({data.total_applicants > 0 ? Math.round(((data.selected || 0) / data.total_applicants) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">⚡ Match Distributions</h2>
                <p className="text-gray-400 text-xs mb-6">ATS and compatibility distributions.</p>
              </div>

              <div className="space-y-4">
                
                <div className="border-b border-white/5 pb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300 font-semibold">ATS Scores</span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data.avg_ats_score}%` }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">Low</span>
                      <span className="font-bold text-red-400">{data.min_ats_score || 0}%</span>
                    </div>
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">Avg</span>
                      <span className="font-bold text-emerald-400">{data.avg_ats_score || 0}%</span>
                    </div>
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">High</span>
                      <span className="font-bold text-emerald-300">{data.max_ats_score || 0}%</span>
                    </div>
                  </div>
                </div>
                
                
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300 font-semibold">Compatibility Scores</span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${data.avg_compatibility_score}%` }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">Low</span>
                      <span className="font-bold text-red-400">{data.min_compatibility_score || 0}%</span>
                    </div>
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">Avg</span>
                      <span className="font-bold text-indigo-400">{data.avg_compatibility_score || 0}%</span>
                    </div>
                    <div className="bg-white/5 p-1 rounded">
                      <span className="block text-gray-500">High</span>
                      <span className="font-bold text-indigo-300">{data.max_compatibility_score || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-2 mt-4 text-center text-[10px]">
                <span className="text-gray-400">Match health:</span> <span className="font-bold text-emerald-300">{data.avg_ats_score >= 70 ? 'Excellent Match Rate' : 'Healthy Pipeline'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {data && data.job_performance && (
        <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 mb-8">
          <h2 className="text-xl font-bold mb-2 text-left">📈 Job Performance</h2>
          <p className="text-gray-400 text-xs mb-6 text-left">Performance metrics across all your posted jobs.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-4 px-4">Job Title</th>
                  <th className="pb-4 px-4 text-center">Applications</th>
                  <th className="pb-4 px-4 text-center">Avg ATS</th>
                  <th className="pb-4 px-4 text-center">Avg Compatibility</th>
                  <th className="pb-4 px-4 text-center">Shortlisted</th>
                  <th className="pb-4 px-4 text-center">Rejected</th>
                  <th className="pb-4 px-4 text-center">Selected</th>
                </tr>
              </thead>
              <tbody>
                {data.job_performance.map(job => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-all text-xs">
                    <td className="py-4 px-4 font-semibold text-white">{job.title}</td>
                    <td className="py-4 px-4 text-center text-gray-300 font-bold">{job.applications_count}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-bold mb-1">{job.avg_ats_score}%</span>
                        <div className="w-16 bg-emerald-950/40 border border-emerald-900/30 rounded-full h-1.5 overflow-hidden p-[1px]">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${job.avg_ats_score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-indigo-400 font-bold mb-1">{job.avg_compatibility_score}%</span>
                        <div className="w-16 bg-indigo-950/40 border border-indigo-900/30 rounded-full h-1.5 overflow-hidden p-[1px]">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${job.avg_compatibility_score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-yellow-400 font-bold">{job.shortlisted_count}</td>
                    <td className="py-4 px-4 text-center text-red-400 font-bold">{job.rejected_count}</td>
                    <td className="py-4 px-4 text-center text-teal-400 font-bold">{job.selected_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-3xl border border-indigo-500/20">
        <h2 className="text-xl font-bold mb-6">Recent Applicants</h2>
        {recentApplicants.length === 0 ? (
          <p className="text-gray-400 text-sm">No applicants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-4 px-4">Applicant</th>
                  <th className="pb-4 px-4">Job</th>
                  <th className="pb-4 px-4">Experience</th>
                  <th className="pb-4 px-4">Status</th>
                  <th className="pb-4 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.map(app => (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 px-4">
                      <p className="font-bold text-white text-sm">{app.full_name}</p>
                      <p className="text-xs text-gray-500">{app.email}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">{app.job_details?.title}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{app.experience}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'APPLIED' ? 'bg-blue-500/20 text-blue-300' :
                        app.status === 'SHORTLISTED' ? 'bg-amber-500/20 text-amber-300' :
                        app.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {app.resume && (
                        <a href={app.resume} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold underline">
                          Resume
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      bgGlow: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      iconBg: 'bg-indigo-500/25 border-indigo-500/30',
      text: 'text-indigo-400'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      iconBg: 'bg-emerald-500/25 border-emerald-500/30',
      text: 'text-emerald-400'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bgGlow: 'bg-purple-500/10 group-hover:bg-purple-500/20',
      iconBg: 'bg-purple-500/25 border-purple-500/30',
      text: 'text-purple-400'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconBg: 'bg-amber-500/25 border-amber-500/30',
      text: 'text-amber-400'
    }
  };

  const selected = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card p-6 rounded-3xl border ${selected.border} flex items-center space-x-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${selected.bgGlow} rounded-full blur-2xl transition-all`}></div>
      <div className={`w-14 h-14 rounded-2xl ${selected.iconBg} flex items-center justify-center text-2xl border`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-3xl font-extrabold ${selected.text}`}>{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  const colorMap = {
    blue: {
      bg: 'bg-blue-500 shadow-blue-500/25',
      track: 'bg-blue-950/40 border-blue-900/30'
    },
    amber: {
      bg: 'bg-amber-500 shadow-amber-500/25',
      track: 'bg-amber-950/40 border-amber-900/30'
    },
    purple: {
      bg: 'bg-purple-500 shadow-purple-500/25',
      track: 'bg-purple-950/40 border-purple-900/30'
    },
    emerald: {
      bg: 'bg-emerald-500 shadow-emerald-500/25',
      track: 'bg-emerald-950/40 border-emerald-900/30'
    },
    teal: {
      bg: 'bg-teal-500 shadow-teal-500/25',
      track: 'bg-teal-950/40 border-teal-900/30'
    },
    red: {
      bg: 'bg-red-500 shadow-red-500/25',
      track: 'bg-red-950/40 border-red-900/30'
    },
    indigo: {
      bg: 'bg-indigo-500 shadow-indigo-500/25',
      track: 'bg-indigo-950/40 border-indigo-900/30'
    }
  };

  const selectedColors = colorMap[color] || colorMap.blue;

  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2 text-gray-300">
        <span>{label} ({value})</span>
        <span>{percentage}%</span>
      </div>
      <div className={`w-full ${selectedColors.track} border rounded-full h-3 overflow-hidden backdrop-blur-sm p-[2px]`}>
        <div 
          className={`${selectedColors.bg} h-full rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
