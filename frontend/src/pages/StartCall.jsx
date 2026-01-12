import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callsAPI } from '../services/api';

function StartCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);
  const voiceButtonRef = useRef(null);

  const voices = [
    { value: 'alloy', label: 'Alloy', description: 'нейтральный, сбалансированный' },
    { value: 'ash', label: 'Ash', description: 'чёткий, разборчивый' },
    { value: 'ballad', label: 'Ballad', description: 'мягкий, спокойный' },
    { value: 'coral', label: 'Coral', description: 'тёплый, дружелюбный' },
    { value: 'echo', label: 'Echo', description: 'глубокий, насыщенный' },
    { value: 'sage', label: 'Sage', description: 'спокойный, уверенный' },
    { value: 'shimmer', label: 'Shimmer', description: 'яркий, энергичный' },
    { value: 'verse', label: 'Verse', description: 'выразительный, динамичный' },
  ];

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (voiceButtonRef.current && voiceDropdownOpen) {
        const rect = voiceButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (voiceDropdownOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
    }

    const handleClickOutside = (event) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target) &&
          voiceButtonRef.current && !voiceButtonRef.current.contains(event.target)) {
        setVoiceDropdownOpen(false);
      }
    };

    if (voiceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [voiceDropdownOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlayVoice = (voiceName, e) => {
    e?.stopPropagation(); // Prevent dropdown from closing when clicking play button
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // If clicking the same voice that's playing, stop it
    if (playingVoice === voiceName) {
      setPlayingVoice(null);
      return;
    }

    // Play the selected voice
    const audio = new Audio(`/voices/${voiceName}.mp3`);
    audioRef.current = audio;
    setPlayingVoice(voiceName);

    audio.play().catch((err) => {
      console.error('Failed to play audio:', err);
      setPlayingVoice(null);
    });

    audio.onended = () => {
      setPlayingVoice(null);
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      setPlayingVoice(null);
    };
  };

  const handleVoiceSelect = (voiceValue) => {
    setFormData({
      ...formData,
      voice: voiceValue,
    });
    setVoiceDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await callsAPI.createCall(formData);
      navigate(`/call-status/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось запустить звонок');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white mb-3">
            {templateData ? 'Настроить и запустить звонок' : 'Запустить демо-звонок'}
          </h1>
          <p className="text-white/80 text-lg">
            {templateData
              ? 'Проверьте и при необходимости измените настройки шаблона, затем введите номер телефона'
              : 'Заполните данные, чтобы запустить звонок с ИИ-ассистентом'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="phone_number" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Номер телефона
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="+79277654321"
              value={formData.phone_number}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium text-lg placeholder:text-white/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <label htmlFor="language" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Язык
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium"
                required
              >
                <option value="ru">Русский</option>
                <option value="uz">Узбекский</option>
                <option value="tj">Таджикский</option>
                <option value="auto">Автоопределение</option>
              </select>
            </div>

            <div className="glass-card rounded-2xl p-6 relative">
              <label className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Голосовая модель
              </label>
              <div className="relative">
                <button
                  ref={voiceButtonRef}
                  type="button"
                  onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                  className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium text-left flex items-center justify-between hover:bg-purple-500/20 transition-colors"
                >
                  <span>
                    {voices.find(v => v.value === formData.voice)?.label} ({voices.find(v => v.value === formData.voice)?.description})
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${voiceDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {voiceDropdownOpen && (
                <div 
                  ref={voiceDropdownRef}
                  className="fixed glass-card rounded-xl overflow-hidden shadow-2xl max-h-96 overflow-y-auto" 
                  style={{ 
                    zIndex: 9999,
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`
                  }}
                >
                    {voices.map((voice) => (
                      <div
                        key={voice.value}
                        className={`flex items-center justify-between px-5 py-4 hover:bg-white/10 transition-colors cursor-pointer ${
                          formData.voice === voice.value ? 'bg-purple-500/30' : ''
                        }`}
                        onClick={() => handleVoiceSelect(voice.value)}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white">{voice.label}</div>
                          <div className="text-sm text-white/70">{voice.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handlePlayVoice(voice.value, e)}
                          className={`ml-3 p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                            playingVoice === voice.value
                              ? 'bg-purple-500 text-white animate-pulse'
                              : 'bg-white/10 text-white hover:bg-purple-500/80'
                          }`}
                          title={playingVoice === voice.value ? 'Остановить' : 'Прослушать'}
                        >
                          {playingVoice === voice.value ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              )}
              <p className="text-xs text-white/60 mt-2">
                Все голоса поддерживают несколько языков. Нажмите кнопку проигрывания, чтобы прослушать голос
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="greeting_message" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Приветственное сообщение
            </label>
            <textarea
              id="greeting_message"
              name="greeting_message"
              rows="3"
              placeholder="Здравствуйте! Вас приветствует HALO AI..."
              value={formData.greeting_message}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="funnel_goal" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Цель звонка
            </label>
            <textarea
              id="funnel_goal"
              name="funnel_goal"
              rows="2"
              placeholder="Получить контакты клиента, договориться о встрече и т.п."
              value={formData.funnel_goal}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
            <p className="text-sm text-white/60 mt-2">
              Какова основная цель этого звонка?
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="prompt" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Инструкция для ИИ
            </label>
            <textarea
              id="prompt"
              name="prompt"
              rows="8"
              placeholder="Ты — полезный ассистент по продажам. Твоя задача..."
              value={formData.prompt}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
            <p className="text-sm text-white/60 mt-2">
              Опишите поведение ИИ, его цели и стратегию разговора
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
                <span>Запуск звонка...</span>
              </span>
            ) : (
              'Запустить демо-звонок'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StartCall;
