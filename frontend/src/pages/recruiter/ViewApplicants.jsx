import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';

export default function ViewApplicants() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('ATS');
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    link: '',
    message: ''
  });

  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'COMPATIBILITY') {
      return b.compatibility_score - a.compatibility_score;
    }
    if (sortBy === 'LATEST') {
      return new Date(b.applied_at) - new Date(a.applied_at);
    }
    return b.ats_score - a.ats_score;
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/api/applications/');
      const query = new URLSearchParams(window.location.search);
      const jobIdFilter = query.get('job');
      let data = res.data;
      if (jobIdFilter) {
        data = data.filter(app => app.job === parseInt(jobIdFilter));
      }
      setApplications(data);
    } catch (err) {
      setError('Failed to fetch applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await api.patch(`/api/applications/${appId}/`, { status: newStatus });
      setApplications(applications.map(app => app.id === appId ? res.data : app));
      toast.success(`Application status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleScheduleSubmit = async (e, appId) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/api/applications/${appId}/`, {
        status: 'INTERVIEW',
        interview_date: interviewForm.date || null,
        interview_time: interviewForm.time || null,
        interview_link: interviewForm.link,
        interview_message: interviewForm.message
      });
      setApplications(applications.map(app => app.id === appId ? res.data : app));
      setSchedulingAppId(null);
      setInterviewForm({ date: '', time: '', link: '', message: '' });
      toast.success('Interview scheduled successfully!');
    } catch (err) {
      toast.error('Failed to schedule interview.');
    }
  };

  if (loading) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col">
      <header className="max-w-7xl mx-auto px-6 py-4 w-full flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">SX</div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">SwipeX</span>
        </div>
        <nav className="flex items-center space-x-3 text-xs">
          <Link to="/recruiter" className="px-3 py-2 rounded-lg border border-white/10 hover:border-indigo-400 hover:bg-white/5 transition-all text-gray-300">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Applicant <span className="text-gradient text-indigo-400">Management</span></h1>
          
          {applications.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-bold uppercase">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 [&>option]:bg-gray-900"
              >
                <option value="ATS">Highest ATS Score</option>
                <option value="COMPATIBILITY">Highest Compatibility Score</option>
                <option value="LATEST">Latest Application</option>
              </select>
            </div>
          )}
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

        {applications.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-indigo-500/10">
            <p className="text-gray-400 mb-4">No applications received yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sortedApplications.map(app => (
              <div key={app.id} className="glass-card rounded-2xl p-6 border border-indigo-500/10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{app.full_name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      app.status === 'APPLIED' ? 'bg-blue-500/15 text-blue-300 border-blue-500/20' :
                      app.status === 'SHORTLISTED' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' :
                      app.status === 'SELECTED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' :
                      app.status === 'REJECTED' ? 'bg-red-500/15 text-red-300 border-red-500/20' :
                      'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-indigo-300 text-sm font-semibold mb-1">Applied for: {app.job_details?.title}</p>
                  <p className="text-gray-400 text-xs mb-3">📅 Applied Date: {new Date(app.applied_at).toLocaleDateString()}</p>
                  
                  
                  {/* ATS Analytics */}
                  <div className="mt-3 mb-3 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center gap-4 flex-wrap border-b border-white/5 pb-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ATS Match</span>
                        <span className={`text-base font-black ${app.ats_score >= 80 ? 'text-emerald-400' : app.ats_score >= 60 ? 'text-blue-400' : app.ats_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {app.ats_score}%
                        </span>
                      </div>
                      <div className="h-6 w-px bg-white/10"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Compatibility</span>
                        <span className="text-base font-black text-indigo-400">
                          {app.compatibility_score}%
                        </span>
                      </div>
                      <div className="h-6 w-px bg-white/10"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Priority</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          app.recommendation_priority === 'HIGH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          app.recommendation_priority === 'LOW' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {app.recommendation_priority}
                        </span>
                      </div>
                    </div>

                    {/* Resume Analysis Summary & Snapshot */}
                    <div className="text-xs text-gray-300 space-y-1.5 pt-1">
                      {app.resume_summary && (
                        <p><span className="font-semibold text-white">Summary:</span> {app.resume_summary}</p>
                      )}
                      {app.extracted_skills && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="font-semibold text-white text-[10px]">Extracted Skills:</span>
                          {app.extracted_skills.split(',').map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[9px] border border-indigo-500/20">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                      {app.technologies_found && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="font-semibold text-white text-[10px]">Technologies:</span>
                          {app.technologies_found.split(',').map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[9px] border border-purple-500/20">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Keyword Match details */}
                    <div className="flex flex-col gap-1 text-[11px] border-t border-white/5 pt-2">
                      {app.matched_skills && (
                        <p className="text-gray-300"><span className="text-emerald-400 font-bold">✓ Matched Keywords:</span> {app.matched_skills.split(',').join(', ')}</p>
                      )}
                      {app.missing_skills && (
                        <p className="text-gray-300"><span className="text-red-400 font-bold">✗ Missing Keywords:</span> {app.missing_skills.split(',').join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1 mt-3">
                    <p>📧 {app.email} | 📱 {app.phone}</p>
                    <p>🎓 {app.qualification}</p>
                    <p>💼 {app.experience}</p>
                    {app.linkedin && <p>🔗 <a href={app.linkedin} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">LinkedIn</a></p>}
                    {app.portfolio && <p>🎨 <a href={app.portfolio} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Portfolio</a></p>}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 w-full md:w-48">
                  {app.resume && (
                    <a href={app.resume} target="_blank" rel="noreferrer" className="w-full py-2 px-4 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors text-center text-xs font-bold">
                      📄 View Resume
                    </a>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => handleStatusChange(app.id, 'SHORTLISTED')} className="py-2 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors text-xs font-bold border border-yellow-500/20">
                      Shortlist
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'REJECTED')} className="py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-xs font-bold border border-red-500/20">
                      Reject
                    </button>
                    <button onClick={() => {
                      setSchedulingAppId(app.id);
                      setInterviewForm({
                        date: app.interview_date || '',
                        time: app.interview_time || '',
                        link: app.interview_link || '',
                        message: app.interview_message || ''
                      });
                    }} className="col-span-2 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-xs font-bold border border-purple-500/20">
                      Schedule Interview
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'SELECTED')} className="col-span-2 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs font-bold border border-emerald-500/20">
                      Select / Hire 🎉
                    </button>
                  </div>

                  {app.status === 'INTERVIEW' && app.interview_date && (
                    <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] space-y-1">
                      <span className="font-bold text-purple-300 block">📅 Scheduled Interview</span>
                      <p><span className="text-gray-400">Date:</span> {app.interview_date}</p>
                      <p><span className="text-gray-400">Time:</span> {app.interview_time}</p>
                      {app.interview_link && (
                        <p className="truncate"><span className="text-gray-400">Link:</span> <a href={app.interview_link} target="_blank" rel="noreferrer" className="underline text-indigo-400 hover:text-indigo-300">{app.interview_link}</a></p>
                      )}
                    </div>
                  )}

                  {schedulingAppId === app.id && (
                    <form onSubmit={(e) => handleScheduleSubmit(e, app.id)} className="mt-3 p-3 bg-black/40 border border-purple-500/30 rounded-xl space-y-2 text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-1">Interview Setup</span>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <label className="block text-[9px] text-gray-400 mb-0.5">Date</label>
                          <input required type="date" value={interviewForm.date} onChange={(e) => setInterviewForm({...interviewForm, date: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 mb-0.5">Time</label>
                          <input required type="time" value={interviewForm.time} onChange={(e) => setInterviewForm({...interviewForm, time: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 mb-0.5">Meeting Link</label>
                          <input type="url" placeholder="https://zoom.us/..." value={interviewForm.link} onChange={(e) => setInterviewForm({...interviewForm, link: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-400 mb-0.5">Message</label>
                          <textarea rows="2" placeholder="Message..." value={interviewForm.message} onChange={(e) => setInterviewForm({...interviewForm, message: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" className="flex-1 py-1 rounded bg-purple-600 text-white font-bold text-[9px] hover:bg-purple-500">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setSchedulingAppId(null)} className="flex-1 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white font-bold text-[9px]">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
