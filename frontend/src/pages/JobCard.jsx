import React, { useState } from 'react';

export default function JobCard({ job, onSwipeRight, onSwipeLeft }) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div className="glass-card rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-purple-500/10 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{job.title}</h2>
            <p className="text-purple-300 font-semibold text-sm mt-1">{job.company}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/20 whitespace-nowrap">
            {job.job_type?.replace('_', ' ')}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">📍 Location</span>
            <span className="text-white text-xs font-medium">{job.location}</span>
          </div>
          <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">💰 Salary</span>
            <span className="text-white text-xs font-medium">{job.salary || 'Not disclosed'}</span>
          </div>
          <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">🎯 Experience</span>
            <span className="text-white text-xs font-medium">{job.experience || 'Any'}</span>
          </div>
          <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">📅 Posted</span>
            <span className="text-white text-xs font-medium">{new Date(job.posted_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* ATS & Compatibility */}
        {!job.profile_incomplete ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">ATS Match</span>
                <span className={`text-base font-black ${job.ats_score >= 80 ? 'text-emerald-400' : job.ats_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {job.ats_score}%
                </span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Compatibility</span>
                <span className="text-base font-black text-indigo-400">
                  {job.match_score}%
                </span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Competition</span>
                <span className="text-xs font-bold text-gray-300">
                  {job.competition_level || 'LOW'} — {job.application_count || 0} applicants
                </span>
              </div>
            </div>

            {job.matching_skills?.length > 0 && (
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Matching Skills</span>
                <div className="flex flex-wrap gap-1">
                  {job.matching_skills.map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[10px]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {job.missing_skills?.length > 0 && (
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Missing Skills</span>
                <div className="flex flex-wrap gap-1">
                  {job.missing_skills.map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[10px]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {job.recommendation_reason && (
              <p className="text-[11px] text-gray-300 italic"><span className="font-semibold text-white">Why: </span>{job.recommendation_reason}</p>
            )}

            {job.match_score >= 80 && job.application_count <= 5 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-[11px] text-emerald-300 mt-2 font-medium">
                🚀 <span className="font-extrabold uppercase text-[9px] tracking-wider block mb-0.5 text-emerald-400">Smart Opportunity</span>
                This job is {job.match_score}% compatible and has low competition ({job.application_count || 0} applicant(s)). This is an excellent time to apply!
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Competition</span>
                <span className="text-sm font-bold text-gray-300">
                  {job.competition_level || 'LOW'} — {job.application_count || 0} applicants
                </span>
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-2.5 text-[10px] text-amber-300 text-center">
              💡 Complete your profile to view ATS Match & Compatibility Scores.
            </div>
          </div>
        )}

        {/* Skills */}
        {job.skills && (
          <div className="mb-5">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Skills Required</span>
            <div className="flex flex-wrap gap-2">
              {job.skills.split(',').map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View Details Toggle Button */}
        <div className="mb-5 flex justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 font-bold text-xs transition-all uppercase tracking-wider cursor-pointer"
          >
            {showDetails ? 'Hide Details ▲' : 'View Details 💼 ▼'}
          </button>
        </div>

        {/* Expanded Detailed Analysis */}
        {showDetails && (
          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 mb-5 space-y-4 text-left animate-fadeIn">
            {/* Match Score Title */}
            <div className="flex items-center gap-2 text-white font-extrabold text-sm pb-2 border-b border-white/5">
              <span>🎯</span>
              <span>{job.match_score || 0}% Match Score</span>
              <span className="text-[10px] text-gray-500 font-normal uppercase tracking-wider ml-auto">SwipeX AI</span>
            </div>

            {/* Skills Breakdown */}
            {job.ai_match_insights?.skills_breakdown && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detailed Skill Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {job.ai_match_insights.skills_breakdown.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        item.status === 'skill gap' 
                          ? 'bg-red-500/5 border-red-500/10 text-red-300' 
                          : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      <span className="font-bold">{item.icon}</span>
                      <span className="font-semibold truncate">{item.skill}</span>
                      <span className="text-[8px] uppercase tracking-wider ml-auto opacity-70">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why This Job Explanation */}
            {job.ai_match_insights?.why_explanation && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">✨ Why this job matches you</h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {job.ai_match_insights.why_explanation.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Full Job Description */}
            {job.description && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Job Description</h4>
                <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Regular clamped description when collapsed */}
        {!showDetails && job.description && (
          <p className="text-gray-400 text-xs leading-relaxed mb-6 line-clamp-3 text-left">{job.description}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <button
            onClick={onSwipeLeft}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
            title="Pass on this job (Swipe Left)"
          >
            <span className="text-base">←</span> Pass
          </button>
          <button
            onClick={() => onSwipeRight('SAVED')}
            className="w-12 h-12 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-lg font-black transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
            title="Save for Later"
          >
            ★
          </button>
          <button
            onClick={() => onSwipeRight('APPLIED')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
            title="Apply / Interested (Swipe Right)"
          >
            Interested <span className="text-base">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
