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

  if (!user) return null;

  const isRecruiter = user.role === 'RECRUITER';

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

  const links = isRecruiter ? recruiterLinks : seekerLinks;
  const themeColor = isRecruiter ? 'indigo' : 'purple';

  return (
    <div className={`w-64 border-r border-white/5 bg-slate-950 md:bg-black/20 flex flex-col h-screen fixed md:sticky top-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-${themeColor}-500 to-${themeColor}-400 flex items-center justify-center font-bold text-lg shadow-lg text-white`}>
            SX
          </div>
          <span className={`font-extrabold text-2xl tracking-wider bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-300 bg-clip-text text-transparent`}>
            SwipeX
          </span>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? `bg-${themeColor}-500/20 border border-${themeColor}-500/30 text-${themeColor}-300 font-bold`
                  : `text-gray-400 hover:bg-white/5 hover:text-white border border-transparent`
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm flex-1 flex justify-between items-center">
                <span>{link.name}</span>
                {link.name === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white uppercase">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
}
