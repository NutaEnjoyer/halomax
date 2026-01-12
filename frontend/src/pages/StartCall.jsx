import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callsAPI } from '../services/api';

function StartCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const audioRef = useRef(null);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlayVoice = (voiceName) => {
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

            <div className="glass-card rounded-2xl p-6">
              <label htmlFor="voice" className="block text-sm font-bold text-white/80 mb-3 uppercase tracking-wide">
                Голосовая модель
              </label>
              <div className="flex gap-3">
                <select
                  id="voice"
                  name="voice"
                  value={formData.voice}
                  onChange={handleChange}
                  className="glass-input flex-1 px-5 py-4 rounded-xl text-white font-medium"
                  required
                >
                  <option value="alloy">Alloy (нейтральный, сбалансированный)</option>
                  <option value="ash">Ash (чёткий, разборчивый)</option>
                  <option value="ballad">Ballad (мягкий, спокойный)</option>
                  <option value="coral">Coral (тёплый, дружелюбный)</option>
                  <option value="echo">Echo (глубокий, насыщенный)</option>
                  <option value="sage">Sage (спокойный, уверенный)</option>
                  <option value="shimmer">Shimmer (яркий, энергичный)</option>
                  <option value="verse">Verse (выразительный, динамичный)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handlePlayVoice(formData.voice)}
                  className={`px-4 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center min-w-[56px] ${
                    playingVoice === formData.voice
                      ? 'bg-purple-500 text-white animate-pulse'
                      : 'glass-button text-white hover:bg-purple-500/80'
                  }`}
                  title={playingVoice === formData.voice ? 'Остановить' : 'Прослушать голос'}
                >
                  {playingVoice === formData.voice ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
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
