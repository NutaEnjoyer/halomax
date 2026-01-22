import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callsAPI } from '../services/api';
import { Phone, Play, Pause, ChevronDown, AlertCircle, Volume2 } from 'lucide-react';

// ElevenLabs voices
const voices = [
  {
    label: 'Николай',
    voiceId: '3EuKHIEZbSzrHGNmdYsx',
    description: 'Уверенный и чёткий',
    mp3: 'Nikolay',
  },
  {
    label: 'Марина',
    voiceId: 'ymDCYd8puC7gYjxIamPt',
    description: 'Мягкий и тёплый',
    mp3: 'Marina',
  },
];

export default function StartCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);

  // Get template data from navigation state
  const templateData = location.state?.template;

  const [formData, setFormData] = useState({
    phone_number: '',
    language: templateData?.language || 'ru',
    voice: templateData?.voice || voices[0]?.voiceId || '',
    greeting_message: templateData?.greeting_message || '',
    prompt: templateData?.prompt || '',
    funnel_goal: templateData?.funnel_goal || '',
    stability: 0.5,
    speed: 1.0,
    similarity_boost: 0.75,
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
        stability: 0.5,
        speed: 1.0,
        similarity_boost: 0.75,
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
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'range' ? parseFloat(value) : value,
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

    const voice = voices.find((v) => v.voiceId === voiceId);
    if (!voice) return;

    const audio = new Audio(`/voices/${voice.mp3}.mp3`);
    audioRef.current = audio;
    setPlayingVoice(voiceId);

    audio.play().catch((err) => {
      console.error('Failed to play audio:', err);
      setPlayingVoice(null);
    });

    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => setPlayingVoice(null);
  };

  const handleVoiceSelect = (voiceValue) => {
    setFormData({ ...formData, voice: voiceValue });
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

  const selectedVoice = voices.find((v) => v.voiceId === formData.voice);

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">
          {templateData ? 'Настроить и запустить звонок' : 'Исходящий звонок'}
        </h1>
        <p className="page-subtitle">
          {templateData
            ? 'Проверьте настройки шаблона и введите номер телефона'
            : 'Настройте параметры и запустите звонок с ИИ-ассистентом'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone Number */}
        <div className="card">
          <label className="label">Номер телефона</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="phone_number"
              type="tel"
              placeholder="+79277654321"
              value={formData.phone_number}
              onChange={handleChange}
              className="input pl-10"
              required
            />
          </div>
        </div>

        {/* Language and Voice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <label className="label">Язык</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="select"
              required
            >
              <option value="ru">Русский</option>
              <option value="uz">Узбекский</option>
              <option value="tj">Таджикский</option>
              <option value="auto">Автоопределение</option>
            </select>
          </div>

          <div className="card relative" ref={voiceDropdownRef}>
            <label className="label">Голосовая модель</label>
            <button
              type="button"
              onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
              className="input text-left flex items-center justify-between"
            >
              <span>
                {selectedVoice?.label} — {selectedVoice?.description}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  voiceDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {voiceDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {voices.map((voice) => (
                  <div
                    key={voice.voiceId}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      formData.voice === voice.voiceId ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleVoiceSelect(voice.voiceId)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{voice.label}</div>
                      <div className="text-sm text-gray-500">{voice.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handlePlayVoice(voice.voiceId, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        playingVoice === voice.voiceId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {playingVoice === voice.voiceId ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Нажмите кнопку воспроизведения, чтобы прослушать голос
            </p>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Настройки голоса</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stability */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Стабильность</label>
                <span className="text-sm font-semibold text-gray-900">
                  {formData.stability.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                name="stability"
                min="0"
                max="1"
                step="0.01"
                value={formData.stability}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">Выше = стабильнее</p>
            </div>

            {/* Speed */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Скорость</label>
                <span className="text-sm font-semibold text-gray-900">
                  {formData.speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                name="speed"
                min="0.5"
                max="2"
                step="0.01"
                value={formData.speed}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">Скорость речи</p>
            </div>

            {/* Similarity Boost */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Схожесть</label>
                <span className="text-sm font-semibold text-gray-900">
                  {formData.similarity_boost.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                name="similarity_boost"
                min="0"
                max="1"
                step="0.01"
                value={formData.similarity_boost}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">Схожесть с оригиналом</p>
            </div>
          </div>
        </div>

        {/* Greeting Message */}
        <div className="card">
          <label className="label">Приветственное сообщение</label>
          <textarea
            name="greeting_message"
            rows="3"
            placeholder="Здравствуйте! Вас приветствует HALO AI..."
            value={formData.greeting_message}
            onChange={handleChange}
            className="input resize-none"
            required
          />
        </div>

        {/* Funnel Goal */}
        <div className="card">
          <label className="label">Цель звонка</label>
          <textarea
            name="funnel_goal"
            rows="2"
            placeholder="Получить контакты клиента, договориться о встрече и т.п."
            value={formData.funnel_goal}
            onChange={handleChange}
            className="input resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Какова основная цель этого звонка?
          </p>
        </div>

        {/* AI Prompt */}
        <div className="card">
          <label className="label">Инструкция для ИИ</label>
          <textarea
            name="prompt"
            rows="8"
            placeholder="Ты — полезный ассистент по продажам. Твоя задача..."
            value={formData.prompt}
            onChange={handleChange}
            className="input resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Опишите поведение ИИ, его цели и стратегию разговора
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Запуск звонка...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Phone size={20} />
              Запустить звонок
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
