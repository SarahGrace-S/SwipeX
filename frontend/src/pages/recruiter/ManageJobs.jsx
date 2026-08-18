import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      // For now, recruiter fetches all jobs they posted. Wait, our JobViewSet /api/jobs/ returns all jobs.
      // We should filter jobs by the recruiter. Let's pass a query param or filter client side.
      // We will fetch all jobs and filter by user role/id if needed, but since we updated the backend, 
      // let's assume we can fetch all jobs and filter here for now, or use a custom endpoint.
      // Actually, since JobViewSet returns all jobs, and posted_by is included in JobSerializer.
      const res = await api.get('/api/jobs/');
      const user = JSON.parse(localStorage.getItem('user'));
      const myJobs = res.data.filter(j => j.posted_by === user.id);
      setJobs(myJobs);
    } catch (err) {
      setError('Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/api/jobs/${jobId}/`);
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      alert('Failed to delete job.');
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
          <Link to="/recruiter/post-job" className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-bold">Post New Job</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-grow">
        <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Manage <span className="text-gradient text-indigo-400">Posted Jobs</span></h1>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

        {jobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-indigo-500/10">
            <p className="text-gray-400 mb-4">You haven't posted any jobs yet.</p>
            <Link to="/recruiter/post-job" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all font-bold text-sm text-white">
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="glass-card rounded-2xl p-6 border border-indigo-500/10 hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{job.title}</h3>
                    <p className="text-indigo-300 text-sm font-medium">{job.location}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                    {job.job_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
                  <span>💰 {job.salary || 'N/A'}</span>
                  <span>📅 {new Date(job.posted_date).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                  <div className="bg-black/20 p-2 rounded-lg text-gray-400">
                    <span className="block text-[8px] font-bold text-gray-500 uppercase">Applicants</span>
                    <span className="font-bold text-white">{job.application_count || 0}</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-gray-400">
                    <span className="block text-[8px] font-bold text-gray-500 uppercase">Competition</span>
                    <span className={`font-bold ${job.competition_level === 'LOW' ? 'text-emerald-400' : job.competition_level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}`}>{job.competition_level || 'LOW'}</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-gray-400">
                    <span className="block text-[8px] font-bold text-gray-500 uppercase">Avg ATS Score</span>
                    <span className="font-bold text-indigo-400">{job.average_ats_score || 0}%</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg text-gray-400">
                    <span className="block text-[8px] font-bold text-gray-500 uppercase">Avg Compatibility</span>
                    <span className="font-bold text-purple-400">{job.average_compatibility_score || 0}%</span>
                  </div>
                </div>
                <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-white/5">
                  <Link to={`/recruiter/applicants?job=${job.id}`} className="text-xs font-bold text-indigo-400 hover:underline">View Applicants</Link>
                  <Link to={`/recruiter/edit-job/${job.id}`} className="text-xs font-bold text-purple-400 hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(job.id)} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
