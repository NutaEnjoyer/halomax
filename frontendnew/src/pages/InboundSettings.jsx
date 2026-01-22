import { useState, useEffect, useRef } from 'react';
import { inboundAPI } from '../services/api';
import {
  PhoneIncoming,
  Play,
  Pause,
  ChevronDown,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

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

export default function InboundSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const audioRef = useRef(null);
  const voiceDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    language: 'ru',
    voice: voices[0]?.voiceId || '',
    greeting_message: '',
    prompt: '',
    funnel_goal: '',
    is_active: true,
  });

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

  const handleVoiceSelect = (voiceId) => {
    setFormData({ ...formData, voice: voiceId });
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

  const selectedVoice = voices.find((v) => v.voiceId === formData.voice);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center p-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загружаем настройки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Настройки входящих звонков</h1>
        <p className="page-subtitle">
          Настройте поведение ИИ-ассистента при входящих звонках
        </p>
      </div>

      {/* Phone Number Card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <PhoneIncoming className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Номер для входящих звонков</p>
              <p className="text-xl font-semibold text-gray-900">+7 (865) 259-40-87</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Активен</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Toggle */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <label className="label mb-0">Статус</label>
              <p className="text-sm text-gray-500">
                Включить обработку входящих звонков
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, is_active: !formData.is_active })
              }
              className={`toggle ${formData.is_active ? 'toggle-enabled' : 'toggle-disabled'}`}
            >
              <span
                className={`toggle-knob ${
                  formData.is_active ? 'toggle-knob-enabled' : 'toggle-knob-disabled'
                }`}
              />
            </button>
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
          </div>
        </div>

        {/* Greeting Message */}
        <div className="card">
          <label className="label">Приветственное сообщение</label>
          <textarea
            name="greeting_message"
            rows="3"
            placeholder="Здравствуйте! Чем могу помочь?"
            value={formData.greeting_message}
            onChange={handleChange}
            className="input resize-none"
            required
          />
        </div>

        {/* Funnel Goal */}
        <div className="card">
          <label className="label">Цель разговора</label>
          <textarea
            name="funnel_goal"
            rows="2"
            placeholder="Помочь клиенту решить его вопрос"
            value={formData.funnel_goal}
            onChange={handleChange}
            className="input resize-none"
            required
          />
        </div>

        {/* AI Prompt */}
        <div className="card">
          <label className="label">Инструкция для ИИ</label>
          <textarea
            name="prompt"
            rows="8"
            placeholder="Ты - полезный ассистент. Помогай клиентам с их вопросами..."
            value={formData.prompt}
            onChange={handleChange}
            className="input resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Опишите поведение ИИ при входящих звонках
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-lg">
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Сохранение...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={20} />
              Сохранить настройки
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
