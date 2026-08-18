import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'READ'
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/`, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id}/`, { is_read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (user?.role === 'RECRUITER') {
      if (notif.related_job) {
        navigate(`/recruiter/applicants?job=${notif.related_job}`);
      }
    } else {
      if (['SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(notif.notification_type)) {
        navigate('/applied-jobs');
      } else if (notif.related_job) {
        navigate(`/apply/${notif.related_job}`);
      }
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center text-white">
        <div className="text-xl font-medium animate-pulse text-purple-300">Loading Notifications...</div>
      </div>
    );
  }

  const isRecruiter = user?.role === 'RECRUITER';
  const themeColor = isRecruiter ? 'indigo' : 'purple';

  return (
    <div className="min-h-screen text-white flex flex-col p-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Notifications</h1>
          <p className="text-gray-400 text-sm">Stay updated with your latest SwipeX activity.</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className={`px-4 py-2 text-xs font-bold rounded-xl border border-${themeColor}-500/30 bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 text-${themeColor}-300 transition-all`}
            >
              Mark all as read
            </button>
          )}
          <div className={`w-12 h-12 bg-${themeColor}-500/20 rounded-full flex items-center justify-center text-xl shadow-lg border border-${themeColor}-500/30 text-${themeColor}-300`}>
            🔔
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-white/5 mb-6 gap-6">
        {['ALL', 'UNREAD', 'READ'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`pb-3 text-sm font-bold transition-all relative ${
              filter === type ? `text-${themeColor}-300` : 'text-gray-400 hover:text-white'
            }`}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
            {type === 'UNREAD' && notifications.some(n => !n.is_read) && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
            {filter === type && (
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${themeColor}-500`}></div>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-4">
        {filteredNotifs.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center border border-white/5">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">No notifications found.</p>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => handleNotifClick(notif)}
              className={`glass-card p-6 rounded-2xl border transition-all relative overflow-hidden flex items-start space-x-4 cursor-pointer hover:border-${themeColor}-500/40 ${
                notif.is_read ? 'border-white/5 opacity-70 hover:opacity-100' : `border-${themeColor}-500/30 bg-${themeColor}-500/5`
              }`}
            >
              <div className="text-2xl mt-1">
                {notif.notification_type === 'NEW_APPLICANT' || notif.notification_type === 'NEW_APPLICATION' ? '👤' :
                 notif.notification_type === 'APPLICATION_SUBMITTED' ? '✅' :
                 notif.notification_type === 'SHORTLISTED' ? '⭐' :
                 notif.notification_type === 'REJECTED' ? '❌' :
                 notif.notification_type === 'SELECTED' ? '🎉' :
                 notif.notification_type === 'INTERVIEW_SCHEDULED' ? '📅' : 
                 notif.notification_type === 'STARTUP_HIRING' ? '🚀' :
                 notif.notification_type === 'HIGH_MATCH' ? '✨' :
                 notif.notification_type === 'LOW_COMPETITION' ? '🔥' : '💬'}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${notif.is_read ? 'text-gray-300' : 'text-white font-semibold'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                  
                  {/* Action Link for Seeker notifications */}
                  {!isRecruiter && notif.related_job && (
                    <span 
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline"
                    >
                      → View & Apply
                    </span>
                  )}

                  {/* Action Link for Recruiter notifications */}
                  {isRecruiter && notif.related_job && (
                    <span 
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      → View Applicants
                    </span>
                  )}
                </div>
              </div>

              {!notif.is_read && (
                <div className="flex flex-col items-end justify-between self-stretch">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className={`mt-4 text-[10px] font-bold text-gray-400 hover:text-${themeColor}-300 hover:underline`}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
