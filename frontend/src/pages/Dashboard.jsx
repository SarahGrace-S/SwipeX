import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      // Clear anything left and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg text-white flex items-center justify-center">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">
            SX
          </div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            SwipeX
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl border border-white/10 hover:border-red-400 hover:bg-red-500/10 text-gray-300 hover:text-red-200 transition-all duration-300 font-medium text-xs uppercase tracking-wider"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex-grow w-full flex flex-col items-center justify-center">
        <div className="glass-card rounded-3xl p-10 md:p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden border border-purple-500/10">
          {/* Subtle background glows inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            {/* User Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/20 mx-auto mb-6">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Welcome to <span className="text-gradient">SwipeX</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md mx-auto">
              Your platform for swipe-based intelligent job discovery and career assistance.
            </p>

            <hr className="border-white/5 my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto">
              <div className="bg-white/2 bg-opacity-10 border border-white/5 p-4 rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</span>
                <span className="text-white font-semibold text-sm">{user.full_name}</span>
              </div>
              <div className="bg-white/2 bg-opacity-10 border border-white/5 p-4 rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</span>
                <span className="text-white font-semibold text-sm break-all">{user.email}</span>
              </div>
              <div className="bg-white/2 bg-opacity-10 border border-white/5 p-4 rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Account Role</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20 mt-1">
                  {user.role}
                </span>
              </div>
              <div className="bg-white/2 bg-opacity-10 border border-white/5 p-4 rounded-2xl">
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Created At</span>
                <span className="text-white font-semibold text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="mt-10 p-4 rounded-2xl border border-white/5 bg-white/1 text-left text-xs text-gray-400 flex items-start space-x-3">
              <span className="text-lg">📢</span>
              <div>
                <strong className="text-gray-300">Platform Status:</strong> You are viewing SwipeX Milestone 1 (Week 1 & 2 Core Auth and Setup). Swipe cards, recommendations, resume analysis and other dashboards will release in later milestones!
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} SwipeX Inc. All rights reserved. Designed for intelligent job search.</p>
      </footer>
    </div>
  );
}
