import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
            SX
          </div>
          <span className="font-extrabold text-2xl tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            SwipeX
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all duration-300 font-medium text-sm"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:-translate-y-0.5"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-grow flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
          Swipe Your Way to <br />
          <span className="text-gradient">Intelligent Discovery</span>
        </h1>

        <p className="text-gray-400 max-w-2xl text-lg md:text-xl leading-relaxed mb-10">
          Welcome to SwipeX, the next-generation career discovery platform. Swipe-based job matches, AI-powered resume analysis, and real-time career assistance—all designed to accelerate your growth.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center w-full max-w-md">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 font-bold text-base shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 text-center transform hover:-translate-y-1"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 hover:border-purple-400 hover:bg-white/5 transition-all duration-300 font-bold text-base text-center transform hover:-translate-y-1"
          >
            Explore Dashboard
          </Link>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="glass-card p-8 rounded-2xl text-left hover:border-purple-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Swipe Discovery</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Find opportunities with intuitive, responsive card gestures. Swipe right to save, swipe left to pass.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              🤖
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">AI-Driven Insights</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Unlock smart recommendation algorithms tailored to your resume, qualifications, and personal career goals.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left hover:border-pink-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              💼
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Career Assistance</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Review real-time analytics, ATS matching reports, and interactive toolkits to keep your application cycle ahead.
            </p>
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
