import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'JOB_SEEKER',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Email format validation: exact regex & standard domain handling
  const validateEmailFormat = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validateField = (name, value) => {
    let err = '';
    if (name === 'fullName') {
      if (!value.trim()) err = 'Full name is required.';
      else if (value.trim().length < 2) err = 'Name must be at least 2 characters.';
    } else if (name === 'email') {
      err = validateEmailFormat(value);
    } else if (name === 'password') {
      if (!value) err = 'Password is required.';
      else if (value.length < 6) err = 'Password must be at least 6 characters.';
    } else if (name === 'confirmPassword') {
      if (!value) err = 'Please confirm your password.';
      else if (value !== formData.password) err = 'Passwords do not match.';
    }
    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If an error is currently displayed on this field, clear it immediately once the input becomes valid
    if (fieldErrors[name]) {
      const err = validateField(name, value);
      if (!err) {
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }

    if (serverError) setServerError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched on submit
    const allTouched = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const errors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    setFieldErrors(errors);

    // Abort if any client-side validation error exists
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setLoading(true);
    setServerError('');
    setSuccess('');

    try {
      await api.post('/api/register/', {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role,
      });

      setSuccess('Account created successfully! Redirecting to sign in...');
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '', role: 'JOB_SEEKER' });
      setFieldErrors({});
      setTouched({});

      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.email) {
          const emailErr = Array.isArray(data.email) ? data.email[0] : data.email;
          setFieldErrors((prev) => ({ ...prev, email: emailErr }));
          setTouched((prev) => ({ ...prev, email: true }));
        } else if (data.password) {
          const pwErr = Array.isArray(data.password) ? data.password[0] : data.password;
          setFieldErrors((prev) => ({ ...prev, password: pwErr }));
          setTouched((prev) => ({ ...prev, password: true }));
        } else if (data.full_name) {
          const fnErr = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name;
          setFieldErrors((prev) => ({ ...prev, fullName: fnErr }));
        } else if (data.detail) {
          setServerError(data.detail);
        } else if (data.error) {
          setServerError(data.error);
        } else {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const firstErr = data[keys[0]];
            setServerError(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
          } else {
            setServerError('Registration failed. Please check your inputs.');
          }
        }
      } else {
        setServerError('Connection error. Please ensure the backend server is reachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg">
              SX
            </div>
            <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              SwipeX
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">Create your account</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Discover tailored career opportunities in seconds</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2">
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center space-x-2">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Jane Doe"
                className={`w-full px-4 py-2.5 rounded-xl glass-input text-sm ${
                  touched.fullName && fieldErrors.fullName ? 'border-red-500/60 focus:border-red-400' : ''
                }`}
                required
              />
              {touched.fullName && fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="jane@example.com"
                className={`w-full px-4 py-2.5 rounded-xl glass-input text-sm ${
                  touched.email && fieldErrors.email ? 'border-red-500/60 focus:border-red-400' : ''
                }`}
                required
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl glass-input text-sm ${
                  touched.password && fieldErrors.password ? 'border-red-500/60 focus:border-red-400' : ''
                }`}
                required
              />
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl glass-input text-sm ${
                  touched.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500/60 focus:border-red-400' : ''
                }`}
                required
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Role Dropdown */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Register As
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer bg-slate-900/80"
                required
              >
                <option value="JOB_SEEKER">Job Seeker (Browse & Apply)</option>
                <option value="RECRUITER">Recruiter (Post & Manage Jobs)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 font-bold text-sm tracking-wide shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 mt-3 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
