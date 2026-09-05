import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Sidebar({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/notifications/');
        const unread = res.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds for instant alerts
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isRecruiter = user?.role === 'RECRUITER';

  const guestLinks = [
    { name: 'Discover Jobs', path: '/', icon: '⚡' },
    { name: 'Search Jobs', path: '/search', icon: '🔍' },
    { name: 'Saved Jobs', path: '/saved-jobs', icon: '★' },
    { name: 'Applied Jobs', path: '/applied-jobs', icon: '✓' },
  ];

  const seekerLinks = [
    { name: 'Dashboard', path: '/jobseeker', icon: '📊' },
    { name: 'Discover Jobs', path: '/discover', icon: '⚡' },
    { name: 'Recommended', path: '/recommendations', icon: '✨' },
    { name: 'Saved Jobs', path: '/saved-jobs', icon: '★' },
    { name: 'Applied Jobs', path: '/applied-jobs', icon: '✓' },
    { name: 'Resume Analysis', path: '/resume-analysis', icon: '📄' },
    { name: 'Career Assistant', path: '/career-assistant', icon: '🤖' },
    { name: 'My Profile', path: '/profile', icon: '👤' },
    { name: 'Notifications', path: '/notifications', icon: '🔔' },
  ];

  const recruiterLinks = [
    { name: 'Dashboard', path: '/recruiter', icon: '📊' },
    { name: 'Post Job', path: '/recruiter/post-job', icon: '✍️' },
    { name: 'My Jobs', path: '/recruiter/jobs', icon: '📁' },
    { name: 'Applicants', path: '/recruiter/applicants', icon: '👥' },
    { name: 'Analytics', path: '/recruiter/analytics', icon: '📈' },
    { name: 'Company Profile', path: '/recruiter/company-profile', icon: '🏢' },
    { name: 'Notifications', path: '/notifications', icon: '🔔' },
  ];

  const links = !user ? guestLinks : isRecruiter ? recruiterLinks : seekerLinks;
  const themeColor = isRecruiter ? 'indigo' : 'purple';

  return (
    <div className={`w-64 border-r border-white/5 bg-slate-950/90 md:bg-black/30 backdrop-blur-xl flex flex-col h-screen fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Sidebar Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-${themeColor}-500 to-${themeColor}-400 flex items-center justify-center font-bold text-base shadow-md text-white`}>
            SX
          </div>
          <span className={`font-extrabold text-xl tracking-wider bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-300 bg-clip-text text-transparent`}>
            SwipeX
          </span>
        </Link>
        <button 
          onClick={onClose}
          className="md:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10"
        >
          ✕
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2.5 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                isActive
                  ? `bg-${themeColor}-500/20 border border-${themeColor}-500/30 text-${themeColor}-200 font-bold shadow-sm`
                  : `text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent`
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span className="flex-1 flex justify-between items-center truncate">
                <span className="truncate">{link.name}</span>
                {link.name === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                    {unreadCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-white/5 bg-black/20">
        {user ? (
          <>
            <div className="flex items-center space-x-2.5 mb-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.full_name}</p>
                <p className="text-[10px] text-gray-400 truncate leading-tight">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 text-xs font-semibold cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2.5 mb-2.5 px-1">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                G
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">Guest Explorer</p>
                <p className="text-[10px] text-gray-400 truncate leading-tight">SwipeX Demo</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all shadow-sm"
            >
              <span>Sign In / Register</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
