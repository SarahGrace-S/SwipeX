import React, { useState } from 'react';

export default function JobCard({ job, onSwipeRight, onSwipeLeft }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

  if (!job) return null;

  // Process required skills list
  const requiredSkillsList = Array.isArray(job.skills)
    ? job.skills
    : job.skills
    ? job.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Process missing skills list
  let missingSkillsList = Array.isArray(job.missing_skills) ? job.missing_skills : [];
  if (missingSkillsList.length === 0 && job.ai_match_insights?.skills_breakdown) {
    missingSkillsList = job.ai_match_insights.skills_breakdown
      .filter((item) => item.status === 'skill gap')
      .map((item) => item.skill);
  }

  // Process matching explanations
  const whyPoints = job.ai_match_insights?.why_explanation && Array.isArray(job.ai_match_insights.why_explanation)
    ? job.ai_match_insights.why_explanation
    : job.recommendation_reason
    ? [job.recommendation_reason]
    : [];

  // Scores
  const atsScore = job.ats_score != null ? job.ats_score : (job.match_score || 82);
  const matchScore = job.match_score || (job.ai_match_insights?.match_score || 85);
  const compLevel = job.competition_level || 'LOW';
  const appCount = job.application_count || 0;

  // Formatted date
  const formattedDate = job.posted_date
    ? new Date(job.posted_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <>
      <div className="glass-card rounded-3xl p-5 sm:p-6 w-full max-w-[760px] mx-auto shadow-2xl border border-purple-500/20 relative overflow-hidden select-none transition-all duration-300">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-3">
          {/* 1. Header: Job Title, Company, Job Type badge */}
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight text-left leading-snug line-clamp-2" title={job.title}>
                {job.title}
              </h2>
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm mt-0.5">
                {job.job_type ? job.job_type.replace('_', ' ') : 'FULL TIME'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-left">
              <span className="text-purple-300 font-bold text-sm sm:text-base tracking-wide">
                {job.company}
              </span>
              {job.company_type && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
                  {job.company_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* 2. Metadata Grid: Location | Salary | Experience | Posted Date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">📍 Location</span>
              <span className="text-white text-xs font-semibold truncate mt-0.5" title={job.location || 'Remote'}>
                {job.location || 'Remote'}
              </span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">💰 Salary</span>
              <span className="text-emerald-400 text-xs font-bold truncate mt-0.5" title={job.salary || 'Competitive'}>
                {job.salary || 'Competitive'}
              </span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">🎯 Experience</span>
              <span className="text-white text-xs font-semibold truncate mt-0.5">
                {job.experience || 'Not specified'}
              </span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">📅 Posted</span>
              <span className="text-gray-300 text-xs font-semibold truncate mt-0.5">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* 3. Scores: ATS Match score | Compatibility score | Competition level */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-inner">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ATS Match</span>
              <span className={`text-base font-black ${atsScore >= 80 ? 'text-emerald-400' : atsScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {atsScore}%
              </span>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Compatibility</span>
              <span className="text-base font-black text-indigo-400">
                {matchScore}%
              </span>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Competition</span>
              <span className="text-xs font-extrabold text-gray-200">
                <span className={`${compLevel === 'HIGH' ? 'text-red-400' : compLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {compLevel}
                </span>
                <span className="text-gray-400 font-medium ml-1">({appCount} applicant{appCount === 1 ? '' : 's'})</span>
              </span>
            </div>

            {matchScore >= 80 && appCount <= 5 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold tracking-wide">
                🚀 High Opportunity
              </span>
            )}
          </div>

          {/* 4. Missing Skills (highlight skill gaps) */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠</span> Missing Skills (Skill Gaps)
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {missingSkillsList.length > 0 ? `${missingSkillsList.length} gap(s)` : 'Fully Aligned'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkillsList.length > 0 ? (
                missingSkillsList.map((skill, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                  ✓ Core skills align with role requirements — No critical skill gaps identified!
                </span>
              )}
            </div>
          </div>

          {/* 5. Why this job matches you (SwipeX AI explanation) */}
          <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-3 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>✨</span> Why this job matches you
              </span>
              <span className="text-[9px] uppercase tracking-wider text-purple-400/80 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                SwipeX AI
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-300 leading-relaxed">
              {whyPoints.length > 0 ? (
                whyPoints.slice(0, 2).map((point, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-bold leading-none mt-0.5">•</span>
                    <span className="line-clamp-2">{point}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic">
                  {job.recommendation_reason || 'Strong candidate alignment with role requirements and team expectations.'}
                </p>
              )}
            </div>
          </div>

          {/* 6. Skills Required */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Skills Required
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{requiredSkillsList.length} skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requiredSkillsList.length > 0 ? (
                requiredSkillsList.map((skill, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-200 border border-indigo-500/20">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">General qualifications</span>
              )}
            </div>
          </div>

          {/* 7. View Details (expand/collapse additional info without card exploding) */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2 px-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/30 flex items-center justify-between text-xs font-semibold text-purple-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>📄</span> {isExpanded ? 'Hide Details' : 'View Details & Description'}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {isExpanded ? '▲ Collapse' : '▼ Expand'}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-black/25 border border-white/10 text-xs text-gray-300 leading-relaxed space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Full Job Description</span>
                  {job.description && (
                    <button
                      type="button"
                      onClick={() => setShowFullModal(true)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
                    >
                      Open Fullscreen Modal
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-line text-xs text-gray-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                  {job.description || 'No detailed description provided for this position.'}
                </div>
              </div>
            )}
          </div>

          {/* 8. Action buttons: Pass (left), Star (middle), Interested (right) */}
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={onSwipeLeft}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
              title="Pass on this job (Swipe Left)"
            >
              <span className="text-lg leading-none">←</span> Pass
            </button>

            <button
              type="button"
              onClick={() => onSwipeRight('SAVED')}
              className="w-12 h-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-black transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-md shrink-0"
              title="Save for Later"
            >
              ★
            </button>

            <button
              type="button"
              onClick={() => onSwipeRight('APPLIED')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
              title="Apply / Interested (Swipe Right)"
            >
              Interested <span className="text-lg leading-none">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Description Modal */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <p className="text-xs text-purple-300 font-medium">{job.company} • {job.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {job.description || 'No detailed description provided for this position.'}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
