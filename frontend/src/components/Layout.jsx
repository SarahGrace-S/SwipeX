import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-bg text-white flex flex-col md:flex-row">
      
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white">SX</div>
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">SwipeX</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 text-white font-bold"
        >
          ☰
        </button>
      </div>

      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all"
        ></div>
      )}
      
      
      <div className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen relative">
        {children}
      </div>
    </div>
  );
}
