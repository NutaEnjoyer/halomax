import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { callsAPI } from '../services/api';
import { Phone, Play, Pause, ChevronDown, AlertCircle, Volume2, Mic, Info } from 'lucide-react';

// Tooltip component
const Tooltip = ({ text }) => (
  <div className="group relative inline-flex ml-1">
    <Info className="w-4 h-4 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50 pointer-events-none">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// TTS Providers
const TTS_PROVIDERS = [
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Высокое качество, русские голоса' },
  { id: 'openai', name: 'OpenAI', description: 'Быстрый, многоязычный' },
  { id: 'yandex', name: 'Yandex', description: 'Русские голоса, низкая цена' },
];

// Voices by TTS provider
const VOICES_BY_PROVIDER = {
  elevenlabs: [
    { label: 'Николай', voiceId: '3EuKHIEZbSzrHGNmdYsx', description: 'Уверенный и чёткий', mp3: 'Nikolay' },
    { label: 'Марина', voiceId: 'ymDCYd8puC7gYjxIamPt', description: 'Мягкий и тёплый', mp3: 'Marina' },
    // { label: 'Денис', voiceId: '0BcDz9UPwL3MpsnTeUlO', description: 'Приятный и дружелюбный', mp3: 'Denis' },
    // { label: 'Кари', voiceId: 'Jbte7ht1CqapnZvc4KpK', description: 'Тёплый и дружелюбный', mp3: 'Kari' },
    // { label: 'Мария', voiceId: 'EDpEYNf6XIeKYRzYcx4I', description: 'Спокойный и размеренный', mp3: 'Maria' },
    // { label: 'Максим', voiceId: 'HcaxAsrhw4ByUo4CBCBN', description: 'Спокойный и нейтральный', mp3: 'Maxim' },
  ],
  openai: [
    { label: 'Alloy', voiceId: 'alloy', description: 'Нейтральный', mp3: 'alloy' },
    { label: 'Echo', voiceId: 'echo', description: 'Мужской', mp3: 'echo' },
    { label: 'Fable', voiceId: 'fable', description: 'Выразительный', mp3: 'fable' },
    { label: 'Onyx', voiceId: 'onyx', description: 'Глубокий мужской', mp3: 'onyx' },
    { label: 'Nova', voiceId: 'nova', description: 'Женский', mp3: 'nova' },
    { label: 'Shimmer', voiceId: 'shimmer', description: 'Мягкий женский', mp3: 'shimmer' },
    { label: 'Ash', voiceId: 'ash', description: 'Спокойный', mp3: 'ash' },
    { label: 'Coral', voiceId: 'coral', description: 'Тёплый', mp3: 'coral' },
    { label: 'Sage', voiceId: 'sage', description: 'Мудрый', mp3: 'sage' },
  ],
  yandex: [
    { label: 'Алёна', voiceId: 'alena', description: 'Женский, нейтральный', mp3: null },
    { label: 'Филипп', voiceId: 'filipp', description: 'Мужской, нейтральный', mp3: null },
    { label: 'Ермиль', voiceId: 'ermil', description: 'Мужской, нейтральный', mp3: null },
    { label: 'Жанна', voiceId: 'jane', description: 'Женский, нейтральный', mp3: null },
    { label: 'Мадирус', voiceId: 'madirus', description: 'Мужской, нейтральный', mp3: null },
    { label: 'Омаж', voiceId: 'omazh', description: 'Женский, нейтральный', mp3: null },
    { label: 'Захар', voiceId: 'zahar', description: 'Мужской, нейтральный', mp3: null },
  ],
};

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
    tts_provider: templateData?.tts_provider || 'elevenlabs',
    voice: templateData?.voice || VOICES_BY_PROVIDER.elevenlabs[0]?.voiceId || '',
    greeting_message: templateData?.greeting_message || '',
    prompt: templateData?.prompt || '',
    funnel_goal: templateData?.funnel_goal || '',
    stability: 0.5,
    speed: 1.0,
    similarity_boost: 0.75,
  });

  // Get current voices based on selected TTS provider
  const currentVoices = VOICES_BY_PROVIDER[formData.tts_provider] || [];
  const selectedVoice = currentVoices.find((v) => v.voiceId === formData.voice);
  const selectedProvider = TTS_PROVIDERS.find((p) => p.id === formData.tts_provider);

  // Update form when template changes
  useEffect(() => {
    if (templateData) {
      const provider = templateData.tts_provider || 'elevenlabs';
      const voices = VOICES_BY_PROVIDER[provider] || [];
      setFormData({
        phone_number: '',
        language: templateData.language || 'ru',
        tts_provider: provider,
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

  const handleTTSChange = (providerId) => {
    const voices = VOICES_BY_PROVIDER[providerId] || [];
    setFormData({
      ...formData,
      tts_provider: providerId,
      voice: voices[0]?.voiceId || '',
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

    const voice = currentVoices.find((v) => v.voiceId === voiceId);
    if (!voice || !voice.mp3) return;

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

        {/* TTS Provider */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-gray-400" />
            <label className="label mb-0">TTS Провайдер</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TTS_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleTTSChange(provider.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.tts_provider === provider.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900">{provider.name}</div>
                <div className="text-xs text-gray-500 mt-1">{provider.description}</div>
              </button>
            ))}
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
            <label className="label">
              Голосовая модель ({selectedProvider?.name})
            </label>
            <button
              type="button"
              onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
              className="input text-left flex items-center justify-between"
            >
              <span>
                {selectedVoice?.label || 'Выберите голос'} — {selectedVoice?.description || ''}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  voiceDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {voiceDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
                {currentVoices.map((voice) => (
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
                    {voice.mp3 && (
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
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Нажмите кнопку воспроизведения, чтобы прослушать голос
            </p>
          </div>
        </div>

        {/* Voice Settings - only for ElevenLabs */}
        {formData.tts_provider === 'elevenlabs' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Настройки голоса ElevenLabs</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stability */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Стабильность</label>
                    <Tooltip text="Более высокие значения сделают речь более последовательной, но также могут сделать её звучать монотонно. Более низкие значения сделают речь более выразительной, но могут привести к нестабильности." />
                  </div>
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
              </div>

              {/* Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Скорость</label>
                    <Tooltip text="Контролирует скорость генерируемой речи. Значения ниже 1.0 замедлят речь, в то время как значения выше 1.0 ускорят её. Экстремальные значения могут повлиять на качество генерируемой речи." />
                  </div>
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
              </div>

              {/* Similarity Boost */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Схожесть</label>
                    <Tooltip text="Более высокие значения повысят общую ясность и последовательность голоса. Очень высокие значения могут привести к артефактам. Рекомендуется регулировать это значение, чтобы найти правильный баланс." />
                  </div>
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
              </div>
            </div>
          </div>
        )}

        {/* OpenAI Voice Settings */}
        {formData.tts_provider === 'openai' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Настройки голоса OpenAI</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Скорость</label>
                    <Tooltip text="Контролирует скорость генерируемой речи. Значения ниже 1.0 замедлят речь, в то время как значения выше 1.0 ускорят её. Экстремальные значения могут повлиять на качество генерируемой речи." />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formData.speed.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  name="speed"
                  min="0.25"
                  max="4"
                  step="0.05"
                  value={formData.speed}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Yandex Voice Settings */}
        {formData.tts_provider === 'yandex' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Настройки голоса Yandex</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Скорость</label>
                    <Tooltip text="Скорость синтезированной речи. Значение 1.0 — стандартная скорость. Диапазон: 0.1 - 3.0" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formData.speed.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  name="speed"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={formData.speed}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

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
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-lg"
        >
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
