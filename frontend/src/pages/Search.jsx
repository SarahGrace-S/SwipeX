import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Search() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    skills: '',
    experience: '',
    company: '',
    company_type: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
    remote: false,
    ordering: 'latest',
  });
  const navigate = useNavigate();

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      const res = await api.get(`/api/jobs/?${queryParams.toString()}`);
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs with filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters({
      ...filters,
      [e.target.name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      skills: '',
      experience: '',
      company: '',
      company_type: '',
      job_type: '',
      salary_min: '',
      salary_max: '',
      remote: false,
      ordering: 'latest',
    });
  };

  return (
    <div className="flex flex-col h-full w-full">

      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-purple-500/10 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Filters</h2>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Keyword</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleInputChange}
                placeholder="Job title, skills..."
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleInputChange}
                placeholder="e.g. Bangalore, Remote"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Skills</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleInputChange}
                placeholder="e.g. React, Python"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Experience</label>
              <input
                type="text"
                name="experience"
                value={filters.experience}
                onChange={handleInputChange}
                placeholder="e.g. 2+ years"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Company</label>
              <input
                type="text"
                name="company"
                value={filters.company}
                onChange={handleInputChange}
                placeholder="e.g. Google"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Company Type</label>
              <select
                name="company_type"
                value={filters.company_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="MNC">MNC</option>
                <option value="STARTUP">Startup</option>
                <option value="NEW_STARTUP">New Startup</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Job Type</label>
              <select
                name="job_type"
                value={filters.job_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none cursor-pointer"
              >
                <option value="">All Modes</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Min Salary</label>
                <input type="number" name="salary_min" value={filters.salary_min} onChange={handleInputChange} placeholder="₹ Min" className="w-full px-3 py-2 rounded-lg glass-input text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Max Salary</label>
                <input type="number" name="salary_max" value={filters.salary_max} onChange={handleInputChange} placeholder="₹ Max" className="w-full px-3 py-2 rounded-lg glass-input text-xs" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remote" name="remote" checked={filters.remote} onChange={handleInputChange} className="rounded border-white/10 bg-black/20 text-purple-500 focus:ring-purple-500" />
              <label htmlFor="remote" className="text-xs text-gray-400 font-bold uppercase tracking-wider">Remote Only</label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Sort By</label>
              <select name="ordering" value={filters.ordering} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none cursor-pointer">
                <option value="latest">Latest</option>
                <option value="highest_salary">Highest Salary</option>
                <option value="lowest_salary">Lowest Salary</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSearch}
                className="flex-grow py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all text-xs font-bold shadow-md shadow-purple-600/10"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results Pane */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Search Results ({jobs.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 animate-pulse">Searching jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/10">
              <p className="text-gray-400">No jobs match your search parameters. Try clearing some filters.</p>
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
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/15">
                        {job.job_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary || 'N/A'}</span>
                    <span>🎯 {job.experience || 'Any'}</span>
                  </div>

                  {/* ATS & Compatibility Details */}
                  {!job.profile_incomplete ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-4 text-xs space-y-2 text-left">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase">ATS Score</span>
                          <span className={`font-black ${job.ats_score >= 80 ? 'text-emerald-400' : job.ats_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {job.ats_score}%
                          </span>
                        </div>
                        <div className="h-6 w-px bg-white/10"></div>
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase">Compatibility</span>
                          <span className="font-black text-indigo-400">
                            {job.match_score}%
                          </span>
                        </div>
                        <div className="h-6 w-px bg-white/10"></div>
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase">Competition</span>
                          <span className="font-bold text-gray-300">
                            {job.competition_level === 'LOW' ? 'Low' : job.competition_level === 'MEDIUM' ? 'Moderate' : 'High'} ({job.application_count || 0} applicants)
                          </span>
                        </div>
                      </div>

                      {job.matching_skills?.length > 0 && (
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Matching Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {job.matching_skills.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[9px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {job.missing_skills?.length > 0 && (
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Missing Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {job.missing_skills.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[9px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {job.recommendation_reason && (
                        <p className="text-[10px] text-gray-300 italic"><span className="font-semibold text-white">Why: </span>{job.recommendation_reason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-4 text-xs text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="block text-[8px] font-bold text-gray-500 uppercase">Competition</span>
                          <span className="font-bold text-gray-300">
                            {job.competition_level === 'LOW' ? 'Low' : job.competition_level === 'MEDIUM' ? 'Moderate' : 'High'} ({job.application_count || 0} applicants)
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-300 mt-2">💡 Complete your profile to view ATS Match & Compatibility Scores.</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <Link to={`/apply/${job.id}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all">
                      View & Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
