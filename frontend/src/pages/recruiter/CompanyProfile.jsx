import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function CompanyProfile() {
  const [profile, setProfile] = useState({
    company_name: '',
    company_website: '',
    company_industry: '',
    company_location: '',
    company_size: '',
    company_description: '',
    hr_contact_email: '',
    hr_contact_number: '',
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      setProfile(res.data);
    } catch (err) {
      setError('Failed to fetch company profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    const data = new FormData();
    Object.keys(profile).forEach(key => {
      if (profile[key] !== null) {
        data.append(key, profile[key]);
      }
    });
    if (logo) {
      data.append('company_logo', logo);
    }

    try {
      const res = await api.patch('/api/profile/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      setMessage('Company profile updated successfully!');
    } catch (err) {
      setError('Failed to update company profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">


      <main className="max-w-3xl mx-auto w-full px-6 py-12 flex-grow">
        <div className="glass-card p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-white">Company Profile</h1>
            <p className="text-gray-400 text-sm mb-8">Update your company information visible to job seekers.</p>

            {message && <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm">{message}</div>}
            {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                  <input type="text" name="company_name" value={profile.company_name || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Industry</label>
                  <input type="text" name="company_industry" value={profile.company_industry || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location (HQ)</label>
                  <input type="text" name="company_location" value={profile.company_location || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Size</label>
                  <input type="text" name="company_size" value={profile.company_size || ''} onChange={handleChange} placeholder="e.g. 50-200 Employees" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Website</label>
                  <input type="url" name="company_website" value={profile.company_website || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">HR Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">HR Email</label>
                    <input type="email" name="hr_contact_email" value={profile.hr_contact_email || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">HR Phone Number</label>
                    <input type="tel" name="hr_contact_number" value={profile.hr_contact_number || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {profile.company_logo && (
                    <img src={profile.company_logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-white/5 border border-white/10" />
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-500/20 file:text-indigo-300 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Company Description</label>
                <textarea name="company_description" value={profile.company_description || ''} onChange={handleChange} rows="5" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"></textarea>
              </div>

              <div className="pt-4">
                <button disabled={submitting} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
