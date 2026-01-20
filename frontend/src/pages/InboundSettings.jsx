import React, { useState, useEffect, useRef } from 'react';
import { inboundAPI } from '../services/api';

function InboundSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);

  // ElevenLabs voices
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
    }
  ];

  const [formData, setFormData] = useState({
    language: 'ru',
    voice: voices[0]?.voiceId || '',
    greeting_message: '',
    prompt: '',
    funnel_goal: '',
    is_active: true,
  });

  // Загрузка конфига при монтировании
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await inboundAPI.getConfig();
      setFormData({
        language: response.data.language || 'ru',
        voice: response.data.voice || voices[0]?.voiceId || '',
        greeting_message: response.data.greeting_message || '',
        prompt: response.data.prompt || '',
        funnel_goal: response.data.funnel_goal || '',
        is_active: response.data.is_active ?? true,
      });
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePlayVoice = (voiceId, e) => {
    e?.stopPropagation();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

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

  const handleVoiceSelect = (voiceId) => {
    setFormData({
      ...formData,
      voice: voiceId,
    });
    setVoiceDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await inboundAPI.updateConfig(formData);
      setSuccess('Настройки успешно сохранены');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white mb-3">
            Настройки входящих звонков
          </h1>
          <p className="text-white/80 text-lg">
            Настройте поведение ИИ-ассистента при входящих звонках
          </p>
        </div>

        {/* Номер для входящих */}
        <div className="glass-card rounded-2xl p-6 mb-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white/70 uppercase tracking-wide mb-1">Номер для входящих звонков</p>
              <p className="text-2xl font-bold text-white">+7 (865) 259-40-87</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-medium text-sm">Активен</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Активность */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-white/80 uppercase tracking-wide">
                  Статус
                </label>
                <p className="text-white/60 text-sm mt-1">
                  Включить обработку входящих звонков
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
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
                    {voices.find(v => v.voiceId === formData.voice)?.label || 'Выберите голос'} ({voices.find(v => v.voiceId === formData.voice)?.description || ''})
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
              placeholder="Здравствуйте! Чем могу помочь?"
              value={formData.greeting_message}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="funnel_goal" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Цель разговора
            </label>
            <textarea
              id="funnel_goal"
              name="funnel_goal"
              rows="2"
              placeholder="Помочь клиенту решить его вопрос"
              value={formData.funnel_goal}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <label htmlFor="prompt" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
              Инструкция для ИИ
            </label>
            <textarea
              id="prompt"
              name="prompt"
              rows="8"
              placeholder="Ты - полезный ассистент. Помогай клиентам с их вопросами..."
              value={formData.prompt}
              onChange={handleChange}
              className="glass-input w-full px-5 py-4 rounded-xl text-white font-medium resize-none placeholder:text-white/50"
              required
            />
            <p className="text-sm text-white/60 mt-2">
              Опишите поведение ИИ при входящих звонках
            </p>
          </div>

          {error && (
            <div className="glass-dark rounded-2xl px-6 py-4 border border-red-400/50">
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="glass-dark rounded-2xl px-6 py-4 border border-green-400/50">
              <p className="text-green-200 font-medium">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="glass-button w-full text-white font-bold py-5 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed glow-hover transition-smooth"
          >
            {saving ? (
              <span className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Сохранение...</span>
              </span>
            ) : (
              'Сохранить настройки'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InboundSettings;
