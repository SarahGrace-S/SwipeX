import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function CareerAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your SwipeX AI Career Assistant. Ask me anything about your career path, resume improvement, high-demand skills, or job matches!",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/api/career-assistant/', { prompt: userText });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Sorry, I am temporarily unable to respond. Please make sure the backend server is running and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    // Submit in next tick
    setTimeout(() => {
      document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 50);
  };

  const quickQuestions = [
    "What skills should I learn?",
    "How can I improve my resume?",
    "What jobs should I apply for?",
    "What should I learn next?"
  ];

  return (
    <div className="min-h-screen text-white flex flex-col p-6 max-w-4xl mx-auto h-[calc(100vh-65px)] md:h-screen relative">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🤖</span> SwipeX AI Career Assistant
        </h1>
        <p className="text-gray-400 text-xs mt-1">Personalized career guidance powered by SwipeX intelligence.</p>
      </div>

      {/* Chat Window */}
      <div className="flex-1 glass-card rounded-3xl border border-white/10 flex flex-col overflow-hidden mb-4 min-h-[300px]">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed text-left ${
                  m.sender === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-500/10' 
                    : 'bg-white/5 border border-white/5 text-gray-200 rounded-bl-none'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 text-purple-300 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && !loading && (
          <div className="p-4 border-t border-white/5 flex flex-wrap gap-2 justify-center flex-shrink-0">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form 
          id="chatForm"
          onSubmit={handleSend}
          className="p-4 border-t border-white/5 flex items-center gap-3 bg-black/20 flex-shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about your career path..."
            className="flex-grow px-4 py-3 rounded-xl glass-input text-xs"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
