import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callsAPI } from '../services/api';

function StartCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get template data from navigation state
  const templateData = location.state?.template;

  const [formData, setFormData] = useState({
    phone_number: '',
    language: templateData?.language || 'ru',
    voice: templateData?.voice || 'alloy',
    greeting_message: templateData?.greeting_message || '',
    prompt: templateData?.prompt || '',
    funnel_goal: templateData?.funnel_goal || '',
  });

  // Update form when template changes
  useEffect(() => {
    if (templateData) {
      setFormData({
        phone_number: '',
        language: templateData.language || 'ru',
        voice: templateData.voice || 'alloy',
        greeting_message: templateData.greeting_message || '',
        prompt: templateData.prompt || '',
        funnel_goal: templateData.funnel_goal || '',
      });
    }
  }, [templateData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await callsAPI.createCall(formData);
      navigate(`/call-status/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white mb-3">
            {templateData ? 'Configure & Start Call' : 'Start Demo Call'}
          </h1>
          <p className="text-white/80 text-lg">
            {templateData
              ? 'Review and adjust the template settings, then enter phone number to start'
              : 'Fill in the details to initiate an AI-powered call'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Number */}
          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="phone_number" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="+79019433546"
              value={formData.phone_number}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium text-lg placeholder:text-white/50"
              required
            />
          </div>

          {/* Language & Voice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <label htmlFor="language" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium"
                required
              >
                <option value="ru">Russian</option>
                <option value="uz">Uzbek</option>
                <option value="tj">Tajik</option>
                <option value="auto">Auto-detect</option>
              </select>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <label htmlFor="voice" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Voice Model
              </label>
              <select
                id="voice"
                name="voice"
                value={formData.voice}
                onChange={handleChange}
                className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium"
                required
              >
                <option value="alloy">Alloy (Neutral, balanced)</option>
                <option value="ash">Ash (Clear, articulate)</option>
                <option value="ballad">Ballad (Smooth, calm)</option>
                <option value="coral">Coral (Warm, friendly)</option>
                <option value="echo">Echo (Deep, resonant)</option>
                <option value="sage">Sage (Wise, measured)</option>
                <option value="shimmer">Shimmer (Bright, energetic)</option>
                <option value="verse">Verse (Expressive, dynamic)</option>
              </select>
              <p className="text-xs text-white/60 mt-2">
                All voices support multiple languages
              </p>
            </div>
          </div>

          {/* Greeting Message */}
          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="greeting_message" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Greeting Message
            </label>
            <textarea
              id="greeting_message"
              name="greeting_message"
              rows="3"
              placeholder="Hello! This is HALO AI calling..."
              value={formData.greeting_message}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
          </div>

          {/* Funnel Goal */}
          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="funnel_goal" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Call Goal
            </label>
            <textarea
              id="funnel_goal"
              name="funnel_goal"
              rows="2"
              placeholder="Get customer contact details, Schedule a meeting, etc."
              value={formData.funnel_goal}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
            <p className="text-sm text-white/60 mt-2">
              What is the main objective of this call?
            </p>
          </div>

          {/* AI Prompt */}
          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="prompt" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              AI Instruction Prompt
            </label>
            <textarea
              id="prompt"
              name="prompt"
              rows="8"
              placeholder="You are a helpful sales assistant. Your goal is to..."
              value={formData.prompt}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
            <p className="text-sm text-white/60 mt-2">
              Define the AI's behavior, goals, and conversation strategy
            </p>
          </div>

          {error && (
            <div className="glass-dark rounded-2xl px-6 py-4 border border-red-400/50">
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full text-white font-bold py-5 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed glow-hover transition-smooth"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Starting Call...</span>
              </span>
            ) : (
              'Start Demo Call'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StartCall;
