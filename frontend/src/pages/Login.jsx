import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogle();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogle();
      };
      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn("VITE_GOOGLE_CLIENT_ID is missing.");
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", width: "100%" }
        );
      } catch (err) {
        console.error("Google initialize failed:", err);
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/google-auth/', {
        credential: response.credential,
        role: 'JOB_SEEKER'
      });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'RECRUITER') {
        navigate('/recruiter');
      } else {
        navigate('/jobseeker');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/login/', {
        email: email,
        password: password,
      });

      // Save tokens and user info in local storage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on user role
      const userRole = response.data.user.role;
      if (userRole === 'RECRUITER') {
        navigate('/recruiter');
      } else {
        navigate('/jobseeker');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          setError(data.detail);
        } else {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const firstError = data[keys[0]];
            setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
          } else {
            setError('Invalid email or password.');
          }
        }
      } else {
        setError('Connection error. Please make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">
              SX
            </div>
            <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              SwipeX
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold mt-4 tracking-tight">Welcome back</h2>
          <p className="text-gray-400 text-sm mt-2">Sign in to discover your next career step</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 font-bold text-sm tracking-wide shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 border-t border-white/5"></div>
            <span className="relative px-3 bg-slate-900 text-xs text-gray-500 font-bold uppercase tracking-widest">or</span>
          </div>

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <button
              onClick={() => alert("Google Client ID is missing. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.")}
              className="w-full py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <span className="text-base">🌐</span> Continue with Google (Mock)
            </button>
          ) : (
            <div id="googleSignInDiv" className="w-full flex justify-center"></div>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
