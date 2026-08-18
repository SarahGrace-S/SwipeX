import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ResumeAnalysis() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      setProfile(res.data);
    } catch (err) {
      setError('Failed to fetch profile analysis.');
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

  const extractedSkills = profile.extracted_skills ? profile.extracted_skills.split(',').map(s => s.trim()) : [];
  const manualSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()) : [];
  const combinedSkills = Array.from(new Set([...extractedSkills, ...manualSkills])).filter(s => s);

  return (
    <div className="min-h-screen text-white flex flex-col p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Resume & ATS Analysis</h1>
          <p className="text-gray-400 text-sm">We've parsed your resume. Here's how ATS systems see you.</p>
        </div>
        <Link to="/profile" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm">
          Edit Profile
        </Link>
      </div>

      {!profile.resume ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-amber-500/30 bg-amber-500/5">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">No Resume Uploaded</h2>
          <p className="text-amber-200/70 mb-6">You need to upload a resume in your profile to see the ATS analysis.</p>
          <Link to="/profile" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all">
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-4">Resume Summary</h2>
              <p className="text-gray-300 leading-relaxed text-sm">
                {profile.resume_summary || "Our ATS parser scanned your resume. We've detected key information used by recruiters to shortlist candidates."}
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-4">Extracted Technologies & Skills</h2>
              {combinedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {combinedSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold shadow-inner">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No specific technical skills were automatically detected.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-3xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Education Match</h2>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Degree</span>
                    <span className="text-sm font-semibold">{profile.degree || <span className="text-red-400">Missing</span>}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Institution</span>
                    <span className="text-sm">{profile.college || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Experience Match</h2>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Years</span>
                    <span className="text-sm font-semibold">{profile.years_of_experience || <span className="text-amber-400">Add to improve score</span>}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Latest Role</span>
                    <span className="text-sm">{profile.previous_company || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Overall ATS Score */}
            <div className="glass-card rounded-3xl p-6 border border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2">Overall Resume ATS Score</span>
              <div className="w-28 h-28 rounded-full border-4 border-purple-500 flex flex-col items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)] bg-black/40">
                <span className="text-3xl font-black text-purple-400">
                  {profile.overall_ats_score || 0}%
                </span>
                <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                  {profile.overall_ats_status === 'EXCELLENT' ? 'EXCELLENT' :
                   profile.overall_ats_status === 'GOOD' ? 'GOOD' :
                   profile.overall_ats_status === 'AVERAGE' ? 'AVERAGE' : 'NEEDS IMPR.'}
                </span>
              </div>
              <h3 className="font-bold text-white mb-1">Resume Structure Score</h3>
              <p className="text-xs text-purple-200/80">Generally optimized for parser structure compatibility</p>
            </div>

            {/* Keyword Optimization */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-black/40">
                <span className="text-xl font-black text-emerald-400">
                  {combinedSkills.length > 5 ? 'High' : (combinedSkills.length > 2 ? 'Med' : 'Low')}
                </span>
              </div>
              <h3 className="font-bold text-white mb-1">Keyword Optimization</h3>
              <p className="text-xs text-emerald-200/80">Based on standard industry keywords</p>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/10">
              <h3 className="font-bold text-white mb-4">Improve Your Score</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                {!profile.degree && (
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">!</span>
                    Add your educational degree
                  </li>
                )}
                {!profile.years_of_experience && (
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">!</span>
                    Quantify your years of experience
                  </li>
                )}
                {extractedSkills.length < 5 && (
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">ℹ</span>
                    Include more standard technologies in your resume text
                  </li>
                )}
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Ensure your resume uses a clean, text-selectable format
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/recommendations" className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/25">
                  View Matching Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
