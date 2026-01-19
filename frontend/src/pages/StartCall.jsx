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
  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);

  // ElevenLabs voices
  // label - отображаемое название
  // voiceId - ID голоса в ElevenLabs
  // description - описание голоса
  // mp3 - название файла в /public/voices/ (без расширения)
  const voices = [
    {
      label: 'Николай',
      voiceId: '3EuKHIEZbSzrHGNmdYsx',
      description: 'Уверенный и чёткий',
      mp3: 'Nikolay'
    },
    {
      label: 'Марина',
      voiceId: 'ymDCYd8puC7gYjxIamPt',
      description: 'Мягкий и тёплый',
      mp3: 'Marina'
    },
    {
      label: 'Денис',
      voiceId: '0BcDz9UPwL3MpsnTeUlO',
      description: 'Приятный и дружелюбный',
      mp3: 'Denis'
    },
    {
      label: 'Кари',
      voiceId: 'Jbte7ht1CqapnZvc4KpK',
      description: 'Тёплый и дружелюбный',
      mp3: 'Kari'
    },
    {
      label: 'Мария',
      voiceId: 'EDpEYNf6XIeKYRzYcx4I',
      description: 'Спокойный и размеренный',
      mp3: 'Maria'
    },
    {
      label: 'Максим',
      voiceId: 'HcaxAsrhw4ByUo4CBCBN',
      description: 'Спокойный и нейтральный',
      mp3: 'Maxim'
    }
  ];

  // Get template data from navigation state
  const templateData = location.state?.template;

  const [formData, setFormData] = useState({
    phone_number: '',
    language: templateData?.language || 'ru',
    voice: templateData?.voice || voices[0]?.voiceId || '',
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
        voice: templateData.voice || voices[0]?.voiceId || '',
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target)) {
        setVoiceDropdownOpen(false);
      }
    };

    if (voiceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [voiceDropdownOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlayVoice = (voiceId, e) => {
    e?.stopPropagation(); // Prevent dropdown from closing when clicking play button

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // If clicking the same voice that's playing, stop it
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

    // Find voice and play its mp3
    const voice = voices.find(v => v.voiceId === voiceId);
    if (!voice) return;

    const audio = new Audio(`/voices/${voice.mp3}.mp3`);
    audioRef.current = audio;
    setPlayingVoice(voiceId);

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

            <div className="glass-card rounded-2xl p-6 relative" style={{ zIndex: voiceDropdownOpen ? 50 : 1 }}>
              <label className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Голосовая модель
              </label>
              <div className="relative" ref={voiceDropdownRef}>
                <button
                  type="button"
                  onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                  className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium text-left flex items-center justify-between hover:bg-purple-500/20 transition-colors"
                >
                  <span>
                    {voices.find(v => v.voiceId === formData.voice)?.label} ({voices.find(v => v.voiceId === formData.voice)?.description})
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
                
                {voiceDropdownOpen && (
                  <div className="absolute z-[100] w-full mt-2 glass-card rounded-xl overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
                    {voices.map((voice) => (
                      <div
                        key={voice.voiceId}
                        className={`flex items-center justify-between px-5 py-4 hover:bg-white/10 transition-colors cursor-pointer ${
                          formData.voice === voice.voiceId ? 'bg-purple-500/30' : ''
                        }`}
                        onClick={() => handleVoiceSelect(voice.voiceId)}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white">{voice.label}</div>
                          <div className="text-sm text-white/70">{voice.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handlePlayVoice(voice.voiceId, e)}
                          className={`ml-3 p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                            playingVoice === voice.voiceId
                              ? 'bg-purple-500 text-white animate-pulse'
                              : 'bg-white/10 text-white hover:bg-purple-500/80'
                          }`}
                          title={playingVoice === voice.voiceId ? 'Остановить' : 'Прослушать'}
                        >
                          {playingVoice === voice.voiceId ? (
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
              </div>
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
